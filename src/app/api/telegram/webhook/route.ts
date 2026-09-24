import { runCheck } from "@/lib/check/engine";
import { sendTelegramMessage } from "@/lib/telegram/client";
import {
  formatCheckResult,
  formatEmptyMessage,
  formatErrorMessage,
  formatHelpMessage,
  formatStartMessage,
  formatUnsupportedMediaMessage,
} from "@/lib/telegram/format";

// A check can take a few seconds (domain lookups, optional model); give the function room on Vercel.
export const maxDuration = 60;

// In-memory sliding deduplication set for update_id.
// Note: On serverless environments (Vercel), this cache is best-effort per lambda instance
// and is not shared globally across concurrent instances or across cold restarts.
const processedUpdates = new Map<number, number>();
const DEDUP_TTL_MS = 15 * 60 * 1000; // 15 minutes

function isDuplicate(updateId: number): boolean {
  const now = Date.now();
  if (processedUpdates.has(updateId)) return true;
  processedUpdates.set(updateId, now);

  // Opportunistic cleanup
  if (processedUpdates.size > 2000) {
    for (const [id, time] of processedUpdates.entries()) {
      if (now - time > DEDUP_TTL_MS) processedUpdates.delete(id);
    }
  }
  return false;
}

export async function POST(req: Request) {
  // 1. Verify webhook secret token if configured
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token")?.trim();
    if (incomingSecret !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 2. Parse Telegram Update payload
  let update: Record<string, unknown>;
  try {
    update = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateId = typeof update.update_id === "number" ? update.update_id : null;
  if (updateId !== null && isDuplicate(updateId)) {
    // Acknowledge duplicate update immediately without re-processing
    return Response.json({ ok: true, duplicate: true });
  }

  const message = update.message as Record<string, unknown> | undefined;
  if (!message || typeof message !== "object") {
    // Non-message updates (e.g. channel posts, poll answers, inline queries) - acknowledge cleanly
    return Response.json({ ok: true, ignored: true });
  }

  const chat = message.chat as { id?: number | string } | undefined;
  const chatId = chat?.id;
  if (!chatId) {
    return Response.json({ ok: true, ignored: "no_chat_id" });
  }

  const rawText = typeof message.text === "string" ? message.text.trim() : null;
  const caption = typeof message.caption === "string" ? message.caption.trim() : null;
  const hasAttachment = Boolean(message.photo || message.document || message.voice || message.video || message.sticker);

  // 3. Command Routing (/start, /help)
  if (rawText) {
    const cmd = rawText.toLowerCase().split(/\s+/)[0];
    if (cmd === "/start" || cmd.startsWith("/start@")) {
      await sendTelegramMessage({ chatId, text: formatStartMessage() });
      return Response.json({ ok: true });
    }
    if (cmd === "/help" || cmd.startsWith("/help@")) {
      await sendTelegramMessage({ chatId, text: formatHelpMessage() });
      return Response.json({ ok: true });
    }
  }

  // 4. Content Routing
  // If an attachment is present with no text caption, direct to text-only guidance
  if (hasAttachment && !caption) {
    await sendTelegramMessage({ chatId, text: formatUnsupportedMediaMessage() });
    return Response.json({ ok: true });
  }

  // Usable text to check (either message text or attachment caption)
  const textToCheck = rawText || caption;
  if (!textToCheck || textToCheck.length === 0) {
    await sendTelegramMessage({ chatId, text: formatEmptyMessage() });
    return Response.json({ ok: true });
  }

  // 5. Run Daju authoritative check engine
  // Do not assume runCheck() always completes in <1s.
  // Catch any internal or external failure safely and return user-friendly fallback.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://daju-bice.vercel.app";

  try {
    const report = await runCheck({ text: textToCheck });
    const replyText = formatCheckResult(report, siteUrl);
    await sendTelegramMessage({ chatId, text: replyText });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[telegram] Check execution failed:", errMsg);
    await sendTelegramMessage({ chatId, text: formatErrorMessage() });
  }

  return Response.json({ ok: true });
}

