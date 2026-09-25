import "server-only";
import type { Country } from "@/lib/countries";
import type { CompanyRecord } from "@/lib/check/types";
import { coreName, nameScore } from "@/lib/registry/match";

// Company registers hold every registered business, not only recruitment agencies, so a direct employer can be
// confirmed there. No government in the four countries publishes a lookup a program can call, so two sources
// are supported behind keys: OpenCorporates (a dated index of CAC, free for public-benefit projects) and Mono
// (a licensed live CAC lookup, billed per call). With neither key the card offers the official search instead.
const cache = new Map<string, { at: number; v: CompanyRecord | null }>();
const TTL = 6 * 60 * 60 * 1000;
const OC_JURISDICTION: Partial<Record<Country, string>> = { NG: "ng", KE: "ke", UG: "ug", GH: "gh" };

export function companyRegisterAvailable(country: Country): boolean {
  const mono = country === "NG" && !!process.env.MONO_SECRET_KEY?.trim();
  const oc = !!process.env.OPENCORPORATES_API_TOKEN?.trim() && !!OC_JURISDICTION[country];
  return mono || oc;
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
  if (/active|registered|approved|live/.test(t)) return "active";
  if (/inactive|dormant|struck|dissolv|deregister|cancel|wound|removed/.test(t)) return "inactive";
  return "unknown";
}

async function monoSearch(name: string): Promise<CompanyRecord[]> {
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
  const rows = Array.isArray(data) ? (data as Raw[]) : [];
  return rows.flatMap((raw) => {
    const rec = str(raw, "approved_name", "approvedName", "company_name", "companyName", "name", "business_name");
    if (!rec) return [];
    return [
      {
        register: "CAC" as const,
        country: "NG" as const,
        name: rec,
        number: str(raw, "rc_number", "rcNumber", "registration_number", "registrationNumber", "id"),
        type: str(raw, "company_type", "companyType", "classification", "type"),
        status: normaliseStatus(str(raw, "status", "company_status")),
        statusText: str(raw, "status", "company_status"),
        registeredOn: str(raw, "registration_date", "registrationDate", "date_of_registration", "dateOfRegistration")?.slice(0, 10) ?? null,
        address: str(raw, "address", "head_office_address", "registered_address"),
        score: 0,
        via: "Mono",
        live: true,
        asOf: null,
        checkedAt: new Date().toISOString(),
      },
    ];
  });
}

async function openCorporatesSearch(name: string, country: Country): Promise<CompanyRecord[]> {
  const token = process.env.OPENCORPORATES_API_TOKEN?.trim();
  const jur = OC_JURISDICTION[country];
  if (!token || !jur) return [];
  const url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(name)}&jurisdiction_code=${jur}&per_page=10&api_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    console.error("[company] opencorporates", res.status);
    return [];
  }
  const json = (await res.json()) as { results?: { companies?: { company: Raw }[] } };
  const registers: Record<string, CompanyRecord["register"]> = { NG: "CAC", KE: "BRS", UG: "URSB", GH: "ORC" };
  return (json.results?.companies ?? []).flatMap(({ company: raw }) => {
    const rec = str(raw, "name");
    if (!rec) return [];
    return [
      {
        register: registers[country],
        country,
        name: rec,
        number: str(raw, "company_number"),
        type: str(raw, "company_type"),
        status: normaliseStatus(str(raw, "current_status")),
        statusText: str(raw, "current_status"),
        registeredOn: str(raw, "incorporation_date")?.slice(0, 10) ?? null,
        address: str(raw, "registered_address_in_full"),
        score: 0,
        via: "OpenCorporates",
        live: false,
        asOf: str(raw, "retrieved_at")?.slice(0, 10) ?? null,
        checkedAt: new Date().toISOString(),
      },
    ];
  });
}

// Looks the first plausible company names up; returns the closest confirmed record or null.
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
      const rows = country === "NG" && process.env.MONO_SECRET_KEY?.trim() ? await monoSearch(q) : await openCorporatesSearch(q, country);
      for (const rec of rows) {
        const score = Math.round(nameScore(q, rec.name) * 100) / 100;
        if (score >= 0.82 && (!best || score > best.score)) best = { ...rec, score };
      }
    } catch (err) {
      console.error("[company] lookup failed", err instanceof Error ? err.message : err);
    }
    cache.set(k, { at: Date.now(), v: best });
    if (best) return best;
  }
  return null;
}
