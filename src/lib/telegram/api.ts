import "server-only";

// Thin Telegram Bot API client: one fetch per method, HTML parse mode, inline keyboards, no dependency.
export type InlineButton = { text: string; url?: string; callback_data?: string };
export type Keyboard = InlineButton[][];

export interface SendOptions {
  keyboard?: Keyboard;
  preview?: { url: string; large?: boolean } | false;
  replyTo?: number;
}

interface TgResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

const TEXT_LIMIT = 4000;

export function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

// Telegram rejects messages over 4096 characters; keep the head and the tail (where the links live).
export function fit(text: string): string {
  return text.length > TEXT_LIMIT ? text.slice(0, TEXT_LIMIT - 800) + "\n[…]\n" + text.slice(-700) : text;
}

export async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<TgResponse<T>> {
  const token = botToken();
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN is not set" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }))) as TgResponse<T>;
    if (!json.ok) console.error(`[telegram] ${method}: ${json.description ?? `HTTP ${res.status}`}`);
    return json;
  } catch (err) {
    const description = err instanceof Error ? err.message : String(err);
    console.error(`[telegram] ${method}: ${description}`);
    return { ok: false, description };
  } finally {
    clearTimeout(timer);
  }
}

function previewOptions(preview: SendOptions["preview"]) {
  if (preview === false || preview === undefined) return { is_disabled: true };
  return { url: preview.url, prefer_large_media: preview.large ?? true, show_above_text: true };
}

export async function sendMessage(chatId: number | string, html: string, opts: SendOptions = {}): Promise<number | null> {
  const r = await tg<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: fit(html),
    parse_mode: "HTML",
    link_preview_options: previewOptions(opts.preview),
    reply_markup: opts.keyboard ? { inline_keyboard: opts.keyboard } : undefined,
    reply_parameters: opts.replyTo ? { message_id: opts.replyTo, allow_sending_without_reply: true } : undefined,
  });
  return r.ok && r.result ? r.result.message_id : null;
}

export async function editMessage(chatId: number | string, messageId: number, html: string, opts: SendOptions = {}): Promise<boolean> {
  const r = await tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: fit(html),
    parse_mode: "HTML",
    link_preview_options: previewOptions(opts.preview),
    reply_markup: opts.keyboard ? { inline_keyboard: opts.keyboard } : undefined,
  });
  return r.ok;
}

export async function typing(chatId: number | string): Promise<void> {
  await tg("sendChatAction", { chat_id: chatId, action: "typing" });
}

export async function answerCallback(id: string, text?: string, alert = false): Promise<void> {
  await tg("answerCallbackQuery", { callback_query_id: id, text, show_alert: alert });
}
