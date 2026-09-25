import "server-only";
import type { Country } from "@/lib/countries";
import type { CompanyRecord } from "@/lib/check/types";
import { coreName, nameScore } from "@/lib/registry/match";

// Company registers hold every registered business, not only recruitment agencies, so a direct employer
// can be confirmed there. Nigeria's CAC is reached through Mono's licensed lookup when MONO_SECRET_KEY is set.
// Kenya (BRS), Uganda (URSB) and Ghana (ORC) expose no public lookup yet and stay unconnected.
const cache = new Map<string, { at: number; v: CompanyRecord | null }>();
const TTL = 6 * 60 * 60 * 1000;

export function companyRegisterAvailable(country: Country): boolean {
  return country === "NG" && !!process.env.MONO_SECRET_KEY?.trim();
}

type Raw = Record<string, unknown>;
const str = (o: Raw, ...keys: string[]): string | null => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
};

function normaliseStatus(s: string | null): CompanyRecord["status"] {
  const t = (s ?? "").toLowerCase();
  if (!t) return "unknown";
  if (/active|registered|approved/.test(t)) return "active";
  if (/inactive|dormant|struck|dissolv|deregister|cancel|wound/.test(t)) return "inactive";
  return "unknown";
}

async function monoSearch(name: string): Promise<Raw[]> {
  const key = process.env.MONO_SECRET_KEY?.trim();
  if (!key) return [];
  const res = await fetch(`https://api.withmono.com/v3/lookup/cac?search=${encodeURIComponent(name)}`, {
    headers: { accept: "application/json", "mono-sec-key": key },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return [];
  if (!res.ok) {
    console.error("[company] mono", res.status, (await res.text().catch(() => "")).slice(0, 200));
    return [];
  }
  const json = (await res.json()) as Raw;
  const data = (json.data ?? json.results ?? json) as unknown;
  return Array.isArray(data) ? (data as Raw[]) : [];
}

function toRecord(raw: Raw, query: string): CompanyRecord | null {
  const name = str(raw, "approved_name", "approvedName", "company_name", "companyName", "name", "business_name");
  if (!name) return null;
  const score = nameScore(query, name);
  if (score < 0.82) return null;
  return {
    register: "CAC",
    country: "NG",
    name,
    number: str(raw, "rc_number", "rcNumber", "registration_number", "registrationNumber", "id"),
    type: str(raw, "company_type", "companyType", "classification", "type"),
    status: normaliseStatus(str(raw, "status", "company_status")),
    statusText: str(raw, "status", "company_status"),
    registeredOn: str(raw, "registration_date", "registrationDate", "date_of_registration", "dateOfRegistration")?.slice(0, 10) ?? null,
    address: str(raw, "address", "head_office_address", "registered_address"),
    score: Math.round(score * 100) / 100,
    via: "Mono",
    checkedAt: new Date().toISOString(),
  };
}

// Looks the first plausible company name up; returns the closest confirmed record or null.
export async function companyLookup(names: string[], country: Country): Promise<CompanyRecord | null> {
  if (!companyRegisterAvailable(country)) return null;
  const candidates = names.map((n) => n.trim()).filter((n) => coreName(n).length >= 4 && /[a-z]/i.test(n)).slice(0, 2);
  for (const q of candidates) {
    const k = `${country}:${coreName(q)}`;
    const hit = cache.get(k);
    if (hit && Date.now() - hit.at < TTL) {
      if (hit.v) return hit.v;
      continue;
    }
    let best: CompanyRecord | null = null;
    try {
      for (const raw of await monoSearch(q)) {
        const rec = toRecord(raw, q);
        if (rec && (!best || rec.score > best.score)) best = rec;
      }
    } catch (err) {
      console.error("[company] lookup failed", err instanceof Error ? err.message : err);
    }
    cache.set(k, { at: Date.now(), v: best });
    if (best) return best;
  }
  return null;
}
