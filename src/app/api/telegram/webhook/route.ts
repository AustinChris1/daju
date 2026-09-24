import { runCheck, shortId } from "@/lib/check/engine";
import { llmAvailable, translateReply } from "@/lib/extract/llm";
import { searchByName } from "@/lib/registry/load";
import { getStore, type ReportRow } from "@/lib/store";
import { SAMPLES } from "@/lib/samples";
import { isCountry } from "@/lib/countries";
import { answerCallback, editMessage, sendMessage, typing } from "@/lib/telegram/api";
import { busyHtml, cardHtml, cardKeyboard, cardUrl, countryKeyboard, esc, helpHtml, hotlinesHtml, langsKeyboard, registryHtml, replyHtml, startHtml } from "@/lib/telegram/html";
import type { Report } from "@/lib/check/types";

// Telegram webhook: messages become checks, buttons become follow-ups. Telegram retries on non-200, so
// every path answers 200 quickly and reports problems to the chat instead.
export const maxDuration = 60;

const seen = new Map<number, number>();
const DEDUP_TTL_MS = 15 * 60 * 1000;

function isDuplicate(updateId: number): boolean {
  const now = Date.now();
  if (seen.has(updateId)) return true;
  seen.set(updateId, now);
  if (seen.size > 2000) for (const [id, t] of seen) if (now - t > DEDUP_TTL_MS) seen.delete(id);
  return false;
}

const ok = (extra: Record<string, unknown> = {}) => Response.json({ ok: true, ...extra });

function site(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://daju-bice.vercel.app").replace(/\/+$/, "");
}

// Runs a check and replaces the "searching" message with the card, image preview above the text.
async function check(chatId: number | string, text: string, replyTo?: number): Promise<void> {
  await typing(chatId);
  const placeholder = await sendMessage(chatId, busyHtml(), { replyTo });
  try {
    const report = await runCheck({ text });
    const html = cardHtml(report, site());
    const opts = { keyboard: cardKeyboard(report, site(), llmAvailable()), preview: { url: cardUrl(site(), report.id) } };
    const edited = placeholder ? await editMessage(chatId, placeholder, html, opts) : false;
    if (!edited) await sendMessage(chatId, html, opts);
  } catch (err) {
    console.error("[telegram] check failed:", err instanceof Error ? err.message : err);
    const msg = "I could not finish that check. Try again in a moment, or use the website.";
    if (!(placeholder && (await editMessage(chatId, placeholder, msg)))) await sendMessage(chatId, msg);
  }
}

async function loadReport(id: string): Promise<Report | null> {
  const row = await getStore().getCheck(id);
  return row?.report ?? null;
}

async function onCallback(cb: { id: string; data?: string; message?: { chat: { id: number }; message_id: number } }): Promise<void> {
  const chatId = cb.message?.chat.id;
  const data = cb.data ?? "";
  if (!chatId) return answerCallback(cb.id);
  const [kind, a, b] = data.split(":");

  if (kind === "sample") {
    const s = SAMPLES.find((x) => x.id === a);
    await answerCallback(cb.id, s ? "Running the example" : "Unknown example");
    if (s) await check(chatId, s.text);
    return;
  }
  if (kind === "hotmenu") {
    await answerCallback(cb.id);
    await sendMessage(chatId, "<b>☎️ Which country?</b>", { keyboard: countryKeyboard("hot") });
    return;
  }
  if (kind === "hot" && isCountry(a)) {
    await answerCallback(cb.id);
    await sendMessage(chatId, hotlinesHtml(a));
    return;
  }
  if (kind === "how" && a === "registry") {
    await answerCallback(cb.id);
    await sendMessage(chatId, "Send <code>/registry</code> followed by the name, for example:\n<code>/registry moonlight recruiting</code>");
    return;
  }
  if (kind === "langs") {
    await answerCallback(cb.id);
    await sendMessage(chatId, "<b>🌍 Reply in which language?</b>\n<i>Machine translated from the English reply; read it before you send.</i>", { keyboard: langsKeyboard(a) });
    return;
  }
  if (kind === "rp") {
    const lang = a;
    const report = await loadReport(b);
    if (!report) return answerCallback(cb.id, "That check has expired. Paste the message again.", true);
    let text: string | null = report.actions.replies[lang] ?? null;
    if (!text && llmAvailable()) {
      await answerCallback(cb.id, "Translating…");
      await typing(chatId);
      text = (await translateReply(report.actions.replies.en, lang)) ?? null;
    } else {
      await answerCallback(cb.id);
    }
    if (!text) return void (await sendMessage(chatId, "That language is not available right now. The English reply is on the card."));
    const { html, keyboard } = replyHtml(report, lang, text);
    await sendMessage(chatId, html, { keyboard });
    return;
  }
  if (kind === "rep") {
    const report = await loadReport(a);
    if (!report) return answerCallback(cb.id, "That check has expired. Paste the message again.", true);
    const store = getStore();
    const values: { kind: ReportRow["kind"]; value: string }[] = [
      ...report.extraction.phones.map((v) => ({ kind: "phone" as const, value: v })),
      ...report.extraction.emails.map((v) => ({ kind: "email" as const, value: v })),
    ].slice(0, 4);
    for (const v of values) {
      await store.addReport({ id: shortId(), created_at: new Date().toISOString(), kind: v.kind, value: v.value.toLowerCase(), country: report.country, note: "telegram", check_id: report.id });
    }
    await answerCallback(cb.id, values.length ? "Reported. Thank you." : "No phone or email to report.");
    if (values.length) await sendMessage(chatId, `🚩 Reported ${values.map((v) => `<code>${esc(v.value)}</code>`).join(", ")}. The next person who checks ${values.length === 1 ? "it" : "them"} sees the count.`);
    return;
  }
  await answerCallback(cb.id);
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret && req.headers.get("x-telegram-bot-api-secret-token")?.trim() !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let update: Record<string, unknown>;
  try {
    update = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updateId = typeof update.update_id === "number" ? update.update_id : null;
  if (updateId !== null && isDuplicate(updateId)) return ok({ duplicate: true });

  const cb = update.callback_query as Parameters<typeof onCallback>[0] | undefined;
  if (cb && typeof cb === "object") {
    await onCallback(cb);
    return ok();
  }

  const message = update.message as Record<string, unknown> | undefined;
  if (!message || typeof message !== "object") return ok({ ignored: true });
  const chatId = (message.chat as { id?: number } | undefined)?.id;
  if (!chatId) return ok({ ignored: "no_chat_id" });
  const messageId = typeof message.message_id === "number" ? message.message_id : undefined;
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const caption = typeof message.caption === "string" ? message.caption.trim() : "";
  const hasMedia = Boolean(message.photo || message.document || message.voice || message.video || message.sticker || message.audio);

  if (text.startsWith("/")) {
    const [cmdRaw, ...rest] = text.split(/\s+/);
    const cmd = cmdRaw.toLowerCase().replace(/@\w+$/, "");
    const arg = rest.join(" ").trim();
    if (cmd === "/start") {
      const { html, keyboard } = startHtml();
      await sendMessage(chatId, html, { keyboard });
      return ok();
    }
    if (cmd === "/help") {
      const { html, keyboard } = helpHtml(site());
      await sendMessage(chatId, html, { keyboard });
      return ok();
    }
    if (cmd === "/hotlines") {
      await sendMessage(chatId, "<b>☎️ Which country?</b>", { keyboard: countryKeyboard("hot") });
      return ok();
    }
    if (cmd === "/registry" || cmd === "/search") {
      if (arg.length < 3) {
        await sendMessage(chatId, "Send the name after the command, for example:\n<code>/registry moonlight recruiting</code>");
        return ok();
      }
      const { html, keyboard } = registryHtml(arg, searchByName(arg, { limit: 6, min: 0.5 }));
      await sendMessage(chatId, html, { keyboard: [...keyboard, [{ text: "Open the full search", url: `${site()}/registry?q=${encodeURIComponent(arg)}` }]] });
      return ok();
    }
    if (cmd === "/check") {
      if (arg.length < 10) {
        await sendMessage(chatId, "Paste the message after <code>/check</code>, or just send it on its own.");
        return ok();
      }
      await check(chatId, arg, messageId);
      return ok();
    }
    await sendMessage(chatId, "I do not know that command. Paste a job message, or try /help.");
    return ok();
  }

  if (hasMedia && !caption) {
    await sendMessage(chatId, "I read text here. Paste the message, or drop the screenshot on the website: it is read on your phone and never uploaded.", {
      keyboard: [[{ text: "🖼 Check a screenshot on the website", url: `${site()}/check` }]],
    });
    return ok();
  }

  const toCheck = text || caption;
  if (!toCheck) {
    await sendMessage(chatId, "Paste or forward a job message, recruiter message or offer letter and I will check it.");
    return ok();
  }
  if (toCheck.length < 12) {
    await sendMessage(chatId, "That is too short to check. Forward the whole message, with the number and email exactly as they appear.");
    return ok();
  }

  await check(chatId, toCheck, messageId);
  return ok();
}
