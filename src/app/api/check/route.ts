import { z } from "zod";
import { runCheck } from "@/lib/check/engine";
import { bad, fail, json, parseBody, rateLimit } from "../_lib/http";

const opt = (max: number) => z.string().trim().max(max).optional();

const Body = z
  .object({
    text: z.string().max(20000, "Text is capped at 20,000 characters").optional(),
    url: opt(2048),
    name: opt(200),
    phone: opt(40),
    email: opt(200),
    country: z.enum(["NG", "KE", "UG", "GH", "auto"]).optional(),
    offerToken: z.string().trim().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const limited = rateLimit(req, "check", 30, 10 * 60 * 1000);
  if (limited) return limited;
  const { data, res } = await parseBody(req, Body);
  if (res) return res;
  const text = data.text?.trim() || undefined;
  const hasAny = [text, data.url, data.name, data.phone, data.email].some((v) => v && v.length > 0);
  if (!hasAny) return bad("Provide at least one of text, url, name, phone or email");
  try {
    const report = await runCheck({
      text,
      url: data.url || undefined,
      name: data.name || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      country: data.country,
      offerToken: data.offerToken,
    });
    return json({ report });
  } catch (err) {
    if (err instanceof Error && /nothing to check|unsupported protocol|blocked host/i.test(err.message)) return bad(err.message);
    return fail(err, "Check failed");
  }
}
