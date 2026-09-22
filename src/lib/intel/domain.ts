import "server-only";
import dns from "node:dns/promises";
import type { DomainIntel } from "@/lib/check/types";
import { isFreeMail, levenshtein } from "@/lib/registry/match";
import { allDomains } from "@/lib/registry/load";

const cache = new Map<string, { at: number; v: DomainIntel }>();
const TTL = 6 * 60 * 60 * 1000;

const SKIP = new Set(["wa.me", "api.whatsapp.com", "t.me", "telegram.me", "bit.ly", "tinyurl.com", "forms.gle", "docs.google.com", "linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "tiktok.com", "jiji.ng", "jiji.co.ke", "jobberman.com", "brightermonday.co.ke", "myjobmag.com", "indeed.com", "glassdoor.com", "google.com", "youtube.com"]);

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

const HEADERS = { accept: "application/rdap+json, application/json", "user-agent": "Mozilla/5.0 (compatible; DajuCheck/1.0)" };

async function rdapFrom(url: string): Promise<string | null> {
  const res = await withTimeout(fetch(url, { headers: HEADERS, redirect: "follow" }), 5000);
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return null;
  const j = (await res.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
  const ev = j.events?.find((e) => e.eventAction === "registration") ?? j.events?.find((e) => e.eventAction === "last changed");
  return ev?.eventDate ?? null;
}

async function rdapRegistration(domain: string): Promise<string | null> {
  const tld = domain.split(".").pop() ?? "";
  const direct = tld === "com" || tld === "net" ? `https://rdap.verisign.com/${tld}/v1/domain/${encodeURIComponent(domain)}` : null;
  const first = direct ? await rdapFrom(direct).catch(() => null) : null;
  if (first) return first;
  return rdapFrom(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
}

function lookalike(domain: string): DomainIntel["lookalikeOf"] {
  const root = domain.split(".").slice(0, -1).join(".") || domain;
  if (root.length < 5) return null;
  for (const d of allDomains()) {
    if (d.domain === domain) return null;
    const otherRoot = d.domain.split(".").slice(0, -1).join(".");
    if (otherRoot.length < 5) continue;
    const dist = levenshtein(root, otherRoot);
    if (dist > 0 && dist <= 2) return { domain: d.domain, name: d.entry.name, country: d.country };
  }
  return null;
}

export async function domainIntel(domain: string): Promise<DomainIntel> {
  const d = domain.toLowerCase().replace(/^www\./, "");
  const hit = cache.get(d);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const out: DomainIntel = { domain: d, registered: null, ageDays: null, mx: null, freeMail: isFreeMail(d), lookalikeOf: null, error: null };
  if (SKIP.has(d) || out.freeMail) {
    cache.set(d, { at: Date.now(), v: out });
    return out;
  }
  out.lookalikeOf = lookalike(d);
  const [reg, mx] = await Promise.allSettled([rdapRegistration(d), withTimeout(dns.resolveMx(d), 4000)]);
  if (reg.status === "fulfilled" && reg.value) {
    out.registered = reg.value.slice(0, 10);
    const t = Date.parse(reg.value);
    if (!isNaN(t)) out.ageDays = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  } else if (reg.status === "rejected") {
    out.error = "rdap unavailable";
  }
  if (mx.status === "fulfilled") out.mx = mx.value.length > 0;
  else {
    const code = (mx.reason as { code?: string } | undefined)?.code ?? "";
    out.mx = code === "ENOTFOUND" || code === "ENODATA" ? false : null;
  }
  cache.set(d, { at: Date.now(), v: out });
  return out;
}
