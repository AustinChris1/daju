import "server-only";

export interface SendTelegramMessageOptions {
  chatId: number | string;
  text: string;
}

export async function sendTelegramMessage(opts: SendTelegramMessageOptions): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN environment variable");
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: opts.chatId,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[telegram] sendMessage failed with HTTP ${res.status}: ${errText.slice(0, 120)}`);
      return false;
    }

    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[telegram] Network error sending message: ${msg}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

