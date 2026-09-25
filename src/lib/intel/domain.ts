import "server-only";
import dns from "node:dns/promises";
import type { DomainIntel, SiteIntel } from "@/lib/check/types";
import { coreName, isFreeMail, levenshtein } from "@/lib/registry/match";
import { allDomains } from "@/lib/registry/load";

const cache = new Map<string, { at: number; v: DomainIntel }>();
const TTL = 6 * 60 * 60 * 1000;

const SKIP = new Set(["wa.me", "api.whatsapp.com", "t.me", "telegram.me", "bit.ly", "tinyurl.com", "forms.gle", "docs.google.com", "linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "tiktok.com", "jiji.ng", "jiji.co.ke", "jobberman.com", "brightermonday.co.ke", "myjobmag.com", "indeed.com", "glassdoor.com", "google.com", "youtube.com", "lnkd.in", "bamboohr.com", "workable.com"]);

const PARKED = /domain (?:is )?for sale|buy this domain|parked (?:free|domain)|this domain (?:has been|is) registered|coming soon|under construction|website is (?:currently )?unavailable|hugedomains|sedo\.com|godaddy\.com\/domainsearch|namecheap\.com\/domains/i;

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

// Fetches the homepage once and answers: is there a real site, and does it name the organisation?
async function siteIntel(domain: string, names: string[]): Promise<SiteIntel> {
  const out: SiteIntel = { reachable: false, status: null, title: null, mentionsName: null, parked: false };
  // Shared hosts in Lagos and Nairobi often take five seconds to answer; each attempt gets its own budget.
  const attempts: [string, number][] = [
    [`https://${domain}/`, 9000],
    [`https://www.${domain}/`, 5000],
    [`http://${domain}/`, 5000],
  ];
  try {
    let res: Response | null = null;
    for (const [url, budget] of attempts) {
      try {
        res = await fetch(url, { signal: AbortSignal.timeout(budget), redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 DajuCheck/1.0", accept: "text/html,application/xhtml+xml" } });
        if (res.ok) break;
      } catch {
        res = null;
      }
    }
    if (!res) return out;
    out.status = res.status;
    out.reachable = res.ok;
    const html = (await res.text()).slice(0, 300_000);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
    out.title = title ? title.slice(0, 120) : null;
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
    out.parked = PARKED.test(text) || text.length < 200;
    const compact = text.replace(/\s+/g, "");
    const cores = names.map((n) => coreName(n)).filter((c) => c.length >= 4);
    const root = domain.split(".")[0];
    const candidates = [...cores, root.length >= 4 ? root : ""].filter(Boolean);
    out.mentionsName = candidates.length ? candidates.some((c) => text.includes(c) || compact.includes(c.replace(/\s+/g, ""))) : null;
    return out;
  } catch {
    return out;
  }
}

export async function domainIntel(domain: string, names: string[] = []): Promise<DomainIntel> {
  const d = domain.toLowerCase().replace(/^www\./, "");
  const hit = cache.get(d);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const out: DomainIntel = { domain: d, registered: null, ageDays: null, mx: null, freeMail: isFreeMail(d), lookalikeOf: null, site: null, error: null };
  if (SKIP.has(d) || out.freeMail) {
    cache.set(d, { at: Date.now(), v: out });
    return out;
  }
  out.lookalikeOf = lookalike(d);
  const [reg, mx, site] = await Promise.allSettled([rdapRegistration(d), withTimeout(dns.resolveMx(d), 4000), siteIntel(d, names)]);
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
  if (site.status === "fulfilled") out.site = site.value;
  cache.set(d, { at: Date.now(), v: out });
  return out;
}
