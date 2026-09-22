import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";

// Shared helpers for the JSON route handlers under src/app/api.
// Nothing in here is a route; the underscore folder keeps Next from treating it as one.

export function json(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return Response.json(body, { status, headers });
}

export function bad(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function notFound(message = "Not found"): Response {
  return json({ error: message }, 404);
}

// Logs the real error server-side and returns a generic message; never leaks a stack trace.
export function fail(err: unknown, message = "Something went wrong"): Response {
  console.error("[api]", err instanceof Error ? `${err.name}: ${err.message}` : err);
  return json({ error: message }, 500);
}

// Parses the body as JSON and validates with the given schema.
// Returns either { data } or { res } (a ready 400 response).
export async function parseBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<{ data: z.infer<T>; res?: undefined } | { data?: undefined; res: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { res: bad("Body must be valid JSON") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path?.length ? first.path.join(".") + ": " : "";
    return { res: bad(path + (first?.message ?? "Invalid input")) };
  }
  return { data: parsed.data };
}

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

declare global {
  var __trueCopyRate: Map<string, number[]> | undefined;
}

function rateMap(): Map<string, number[]> {
  if (!globalThis.__trueCopyRate) globalThis.__trueCopyRate = new Map();
  return globalThis.__trueCopyRate;
}

// Sliding-window in-memory limiter. Returns a 429 response when the caller is over the limit, else null.
export function rateLimit(req: Request, bucket: string, max: number, windowMs: number): Response | null {
  const ip = clientIp(req);
  const key = bucket + ":" + ip;
  const now = Date.now();
  const m = rateMap();
  const hits = (m.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    const retry = Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000));
    m.set(key, hits);
    return json({ error: `Too many requests. Try again in ${retry}s.` }, 429, { "retry-after": String(retry) });
  }
  hits.push(now);
  m.set(key, hits);
  // Opportunistic cleanup so the map does not grow without bound.
  if (m.size > 5000) {
    for (const [k, v] of m) if (!v.some((t) => now - t < windowMs)) m.delete(k);
  }
  return null;
}

// Random URL-safe string of exactly n characters.
export function randomToken(n: number): string {
  let out = "";
  while (out.length < n) out += randomBytes(n).toString("base64url");
  return out.slice(0, n);
}

// Random alphanumeric string of exactly n characters (safe inside DNS TXT values).
export function randomAlnum(n: number): string {
  let out = "";
  while (out.length < n) out += randomBytes(n * 2).toString("base64url").replace(/[^a-zA-Z0-9]/g, "");
  return out.slice(0, n);
}

export const countrySchema = z.enum(["NG", "KE", "UG", "GH"]);

export function intParam(v: string | null, def: number, min: number, max: number): number {
  if (v == null || v === "") return def;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}
