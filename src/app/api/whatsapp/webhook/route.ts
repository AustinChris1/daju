import { createHmac, timingSafeEqual } from "node:crypto";
import { runCheck } from "@/lib/check/engine";
import { formatCheckResult, formatEmptyMessage, formatErrorMessage, formatStartMessage } from "@/lib/telegram/format";

// WhatsApp through Twilio (sandbox for the demo, a WhatsApp Business sender later). Twilio posts a form and reads
// the TwiML reply, so no outbound API call is needed. Same engine, same plain-text formatter as Telegram.
export const maxDuration = 60;

const WHATSAPP_LIMIT = 1550;
const seen = new Map<string, number>();
const DEDUP_TTL_MS = 15 * 60 * 1000;

function isDuplicate(sid: string): boolean {
  const now = Date.now();
  if (seen.has(sid)) return true;
  seen.set(sid, now);
  if (seen.size > 2000) for (const [k, t] of seen) if (now - t > DEDUP_TTL_MS) seen.delete(k);
  return false;
}

// Twilio signs base64(HMAC-SHA1(auth token, url + every POST field appended as key then value, keys sorted)).
function validSignature(url: string, params: URLSearchParams, header: string | null, token: string): boolean {
  if (!header) return false;
  const keys = [...new Set(params.keys())].sort();
  let data = url;
  for (const k of keys) for (const v of params.getAll(k)) data += k + v;
  const expected = createHmac("sha1", token).update(data).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function twiml(text: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(text)}</Message></Response>`, {
    status: 200,
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

// WhatsApp bodies cap at 1600 characters; keep the verdict and the card link, drop the middle.
function fitWhatsApp(text: string, cardUrl: string): string {
  if (text.length <= WHATSAPP_LIMIT) return text;
  const tail = `\n[...]\nFull card: ${cardUrl}`;
  return text.slice(0, WHATSAPP_LIMIT - tail.length).trimEnd() + tail;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);

  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (token) {
    const url = process.env.TWILIO_WEBHOOK_URL?.trim() || `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/api/whatsapp/webhook`;
    if (!validSignature(url, params, req.headers.get("x-twilio-signature"), token)) {
      return Response.json({ error: "Bad signature" }, { status: 403 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("[whatsapp] TWILIO_AUTH_TOKEN is not set; accepting unsigned requests");
  }

  const sid = params.get("MessageSid") ?? params.get("SmsMessageSid");
  if (sid && isDuplicate(sid)) return new Response("<Response/>", { status: 200, headers: { "content-type": "text/xml" } });

  const body = (params.get("Body") ?? "").trim();
  const media = parseInt(params.get("NumMedia") ?? "0", 10) || 0;

  if (/^(hi|hello|hey|start|help|menu)$/i.test(body)) return twiml(formatStartMessage());
  if (!body) {
    return twiml(media ? "I read text only on WhatsApp for now. Paste the message here, or open the website and upload the screenshot there: it is read on your phone." : formatEmptyMessage());
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://daju-bice.vercel.app").replace(/\/+$/, "");
  try {
    const report = await runCheck({ text: body });
    const reply = formatCheckResult(report, siteUrl);
    return twiml(fitWhatsApp(reply, `${siteUrl}/c/${report.id}`));
  } catch (err) {
    console.error("[whatsapp] check failed:", err instanceof Error ? err.message : err);
    return twiml(formatErrorMessage());
  }
}
