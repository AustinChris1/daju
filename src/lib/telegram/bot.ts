import "server-only";

// The bot's public link, from NEXT_PUBLIC_TELEGRAM_BOT or from Telegram itself when only the token is set.
declare global {
  var __dajuBotName: { name: string | null; at: number } | undefined;
}

const TTL_MS = 60 * 60 * 1000;

export async function botUsername(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_TELEGRAM_BOT?.trim().replace(/^@/, "");
  if (fromEnv) return fromEnv;
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  const cached = globalThis.__dajuBotName;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.name;
  let name: string | null = null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(4000), next: { revalidate: 3600 } });
    const json = (await res.json()) as { ok: boolean; result?: { username?: string } };
    name = json.ok ? (json.result?.username ?? null) : null;
  } catch {
    name = null;
  }
  globalThis.__dajuBotName = { name, at: Date.now() };
  return name;
}

export async function botLink(): Promise<string | null> {
  const name = await botUsername();
  return name ? `https://t.me/${name}` : null;
}
