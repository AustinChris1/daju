import { runCheck, shortId } from "@/lib/check/engine";
import { llmAvailable, translateReply } from "@/lib/extract/llm";
import { searchByName } from "@/lib/registry/load";
import { getStore, type ReportRow } from "@/lib/store";
import { SAMPLES } from "@/lib/samples";
import { isCountry } from "@/lib/countries";
import { answerCallback, deleteMessage, editMessage, sendMessage, typing, type Keyboard } from "@/lib/telegram/api";
import { busyHtml, cardHtml, cardKeyboard, cardUrl, countryKeyboard, esc, examplesKeyboard, helpHtml, hotlinesHtml, langsKeyboard, mainMenu, MENU, PROMPTS, registryHtml, replyHtml, startHtml, withDismiss } from "@/lib/telegram/html";
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

// Telegram cuts long pastes at 4,096 characters and delivers the pieces as separate messages. A piece that
// arrives at that limit is held for three minutes so the next piece can be checked together with it.
const PART_LIMIT = 3900;
const PENDING_TTL_MS = 3 * 60 * 1000;
const pending = new Map<number | string, { text: string; at: number }>();
const pendingFor = (chatId: number | string) => {
  const p = pending.get(chatId);
  if (p && Date.now() - p.at < PENDING_TTL_MS) return p;
  pending.delete(chatId);
  return null;
};
const CHECK_NOW: Keyboard = [[{ text: "✓ That was all, check it", callback_data: "chk:go" }]];

function site(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://daju-bice.vercel.app").replace(/\/+$/, "");
}

// Short notices carry a Dismiss button so the chat stays clean.
async function notice(chatId: number | string, html: string, keyboard = withDismiss()): Promise<void> {
  await sendMessage(chatId, html, { keyboard });
}

// Runs a check and replaces the "searching" message with the card, image preview above the text.
async function check(chatId: number | string, text: string, replyTo?: number): Promise<void> {
  await typing(chatId);
  const placeholder = await sendMessage(chatId, busyHtml(), { replyTo });
  try {
    const report = await runCheck({ text });
    const html = cardHtml(report);
    const opts = { keyboard: withDismiss(cardKeyboard(report, site(), llmAvailable())), preview: { url: cardUrl(site(), report.id) } };
    const edited = placeholder ? await editMessage(chatId, placeholder, html, opts) : false;
    if (!edited) await sendMessage(chatId, html, opts);
  } catch (err) {
    console.error("[telegram] check failed:", err instanceof Error ? err.message : err);
    const msg = "I could not finish that check. Try again in a moment, or use the website.";
    if (!(placeholder && (await editMessage(chatId, placeholder, msg, { keyboard: withDismiss() })))) await notice(chatId, msg);
  }
}

async function registrySearch(chatId: number | string, q: string): Promise<void> {
  const { html, keyboard } = registryHtml(q, searchByName(q, { limit: 6, min: 0.5 }));
  await sendMessage(chatId, html, { keyboard: withDismiss([...keyboard, [{ text: "Open the full search", url: `${site()}/registry?q=${encodeURIComponent(q)}` }]]) });
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

  if (kind === "chk") {
    const held = pendingFor(chatId);
    pending.delete(chatId);
    if (!held) return answerCallback(cb.id, "Nothing is waiting. Paste the message again.", true);
    await answerCallback(cb.id, "Checking");
    if (cb.message) await deleteMessage(chatId, cb.message.message_id);
    await check(chatId, held.text);
    return;
  }
  if (kind === "del") {
    const removed = cb.message ? await deleteMessage(chatId, cb.message.message_id) : false;
    if (!removed && cb.message) await editMessage(chatId, cb.message.message_id, "<i>Dismissed.</i>");
    return answerCallback(cb.id);
  }
  if (kind === "sample") {
    const s = SAMPLES.find((x) => x.id === a);
    await answerCallback(cb.id, s ? "Running the example" : "Unknown example");
    if (s) await check(chatId, s.text);
    return;
  }
  if (kind === "hotmenu") {
    await answerCallback(cb.id);
    await notice(chatId, "<b>☎️ Which country?</b>", withDismiss(countryKeyboard("hot")));
    return;
  }
  if (kind === "hot" && isCountry(a)) {
    await answerCallback(cb.id);
    if (cb.message) await deleteMessage(chatId, cb.message.message_id);
    await notice(chatId, hotlinesHtml(a));
    return;
  }
  if (kind === "langs") {
    await answerCallback(cb.id);
    await notice(chatId, "<b>🌍 Reply in which language?</b>\n<i>Machine translated from the English reply; read it before you send.</i>", withDismiss(langsKeyboard(a)));
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
    if (!text) return void (await notice(chatId, "That language is not available right now. The English reply is on the card."));
    const { html, keyboard } = replyHtml(report, lang, text);
    await sendMessage(chatId, html, { keyboard: withDismiss(keyboard) });
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
    if (values.length) await notice(chatId, `🚩 Reported ${values.map((v) => `<code>${esc(v.value)}</code>`).join(", ")}. The next person who checks ${values.length === 1 ? "it" : "them"} sees the count.`);
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
  const repliedTo = (message.reply_to_message as { text?: string } | undefined)?.text ?? "";

  // Buttons under the text box arrive as plain text.
  if (text === MENU.check) {
    await sendMessage(chatId, PROMPTS.check, { forceReply: "Paste the job message" });
    return ok();
  }
  if (text === MENU.examples) {
    await sendMessage(chatId, "<b>▶ Pick a real case</b>\n<i>Three name real register entries, so you can see a match, a mismatch and an expired licence.</i>", { keyboard: examplesKeyboard() });
    return ok();
  }
  if (text === MENU.registry) {
    await sendMessage(chatId, PROMPTS.registry, { forceReply: "Agency or company name" });
    return ok();
  }
  if (text === MENU.hotlines) {
    await notice(chatId, "<b>☎️ Which country?</b>", withDismiss(countryKeyboard("hot")));
    return ok();
  }
  if (text === MENU.help) {
    const { html, keyboard } = helpHtml(site());
    await notice(chatId, html, withDismiss(keyboard));
    return ok();
  }
  // An answer to the register prompt is a search, not a check.
  if (text && repliedTo === PROMPTS.registry) {
    await registrySearch(chatId, text);
    return ok();
  }

  if (text.startsWith("/")) {
    const [cmdRaw, ...rest] = text.split(/\s+/);
    const cmd = cmdRaw.toLowerCase().replace(/@\w+$/, "");
    const arg = rest.join(" ").trim();
    if (cmd === "/start") {
      await sendMessage(chatId, startHtml(), { menu: mainMenu() });
      return ok();
    }
    if (cmd === "/help") {
      const { html, keyboard } = helpHtml(site());
      await notice(chatId, html, withDismiss(keyboard));
      return ok();
    }
    if (cmd === "/hotlines") {
      await notice(chatId, "<b>☎️ Which country?</b>", withDismiss(countryKeyboard("hot")));
      return ok();
    }
    if (cmd === "/registry" || cmd === "/search") {
      if (arg.length < 3) {
        await sendMessage(chatId, PROMPTS.registry, { forceReply: "Agency or company name" });
        return ok();
      }
      await registrySearch(chatId, arg);
      return ok();
    }
    if (cmd === "/check") {
      if (arg.length < 10) {
        await sendMessage(chatId, PROMPTS.check, { forceReply: "Paste the job message" });
        return ok();
      }
      await check(chatId, arg, messageId);
      return ok();
    }
    await notice(chatId, "I do not know that command. Paste a job message, or use the buttons below.");
    return ok();
  }

  if (hasMedia && !caption) {
    await notice(chatId, "I read text here. Paste the message, or drop the screenshot on the website: it is read on your phone and never uploaded.", withDismiss([[{ text: "🖼 Check a screenshot on the website", url: `${site()}/check` }]]));
    return ok();
  }

  const toCheck = text || caption;
  if (!toCheck) {
    await notice(chatId, "Paste or forward a job message, recruiter message or offer letter and I will check it.");
    return ok();
  }
  if (toCheck.length < 12) {
    await notice(chatId, "That is too short to check. Forward the whole message, with the number and email exactly as they appear.");
    return ok();
  }

  const held = pendingFor(chatId);
  if (held) {
    pending.delete(chatId);
    const joined = `${held.text}\n${toCheck}`;
    if (toCheck.length >= PART_LIMIT) {
      pending.set(chatId, { text: joined, at: Date.now() });
      await notice(chatId, "Got that part too. Send the rest, or check what I have.", withDismiss(CHECK_NOW));
      return ok();
    }
    await check(chatId, joined, messageId);
    return ok();
  }
  if (toCheck.length >= PART_LIMIT) {
    pending.set(chatId, { text: toCheck, at: Date.now() });
    await notice(chatId, "Telegram cuts messages at 4,096 characters, so that arrived in parts. Send the rest and I will check it all as one message.", withDismiss(CHECK_NOW));
    return ok();
  }

  await check(chatId, toCheck, messageId);
  return ok();
}
