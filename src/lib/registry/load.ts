import "server-only";
import type { Country } from "@/lib/countries";
import { COUNTRY_CODES } from "@/lib/countries";
import type { RegistryEntry, RegistrySnapshot, RegistryIndexNote } from "./types";
import { coreName, dice, isFreeMail, nameScore, normName, phoneTail, normPhone } from "./match";
import ng from "../../../data/registries/ng.json";
import ke from "../../../data/registries/ke.json";
import ug from "../../../data/registries/ug.json";
import gh from "../../../data/registries/gh.json";
import index from "../../../data/registries/index.json";

const SNAPSHOTS: Record<Country, RegistrySnapshot> = {
  NG: ng as unknown as RegistrySnapshot,
  KE: ke as unknown as RegistrySnapshot,
  UG: ug as unknown as RegistrySnapshot,
  GH: gh as unknown as RegistrySnapshot,
};

type Indexed = {
  byId: Map<string, RegistryEntry>;
  byPhoneTail: Map<string, RegistryEntry[]>;
  byEmail: Map<string, RegistryEntry[]>;
  byDomain: Map<string, RegistryEntry[]>;
  cores: { entry: RegistryEntry; core: string }[];
};

function buildIndex(snap: RegistrySnapshot): Indexed {
  const byId = new Map<string, RegistryEntry>();
  const byPhoneTail = new Map<string, RegistryEntry[]>();
  const byEmail = new Map<string, RegistryEntry[]>();
  const byDomain = new Map<string, RegistryEntry[]>();
  const cores: { entry: RegistryEntry; core: string }[] = [];
  const push = (m: Map<string, RegistryEntry[]>, k: string, e: RegistryEntry) => {
    const arr = m.get(k) ?? [];
    arr.push(e);
    m.set(k, arr);
  };
  for (const e of snap.entries ?? []) {
    byId.set(e.id, e);
    for (const p of e.phones ?? []) {
      const t = phoneTail(normPhone(p, snap.country));
      if (t.length >= 7) push(byPhoneTail, t, e);
    }
    for (const em of e.emails ?? []) push(byEmail, em.toLowerCase(), e);
    for (const d of e.domains ?? []) if (!isFreeMail(d)) push(byDomain, d.toLowerCase(), e);
    cores.push({ entry: e, core: coreName(e.name) });
  }
  return { byId, byPhoneTail, byEmail, byDomain, cores };
}

const INDEX: Record<Country, Indexed> = Object.fromEntries(
  COUNTRY_CODES.map((c) => [c, buildIndex(SNAPSHOTS[c])]),
) as Record<Country, Indexed>;

export function snapshot(c: Country): RegistrySnapshot {
  return SNAPSHOTS[c];
}

export function registryNotes(): RegistryIndexNote[] {
  const raw = index as unknown as { countries?: (RegistryIndexNote & { notes?: unknown })[] } | RegistryIndexNote[];
  const rows = Array.isArray(raw) ? raw : raw.countries ?? [];
  // A scraper run may write notes as an array; keep only sentence-length strings.
  return rows.map((r) => ({ ...r, notes: Array.isArray(r.notes) ? (r.notes as unknown[]).filter((n): n is string => typeof n === "string" && n.length > 3).join(" ") : typeof r.notes === "string" ? r.notes : undefined }));
}

export function getEntry(c: Country, id: string): RegistryEntry | null {
  return INDEX[c].byId.get(id) ?? null;
}

export interface NameHit {
  country: Country;
  entry: RegistryEntry;
  score: number;
}

// How many register names contain each core token. A word shared by many agencies ("creative", "media",
// "resource") is weak evidence; a word that names one or two agencies ("moonlight") is strong evidence.
const DF = new Map<string, number>();
let N = 0;
for (const c of COUNTRY_CODES) {
  for (const { core } of INDEX[c].cores) {
    N += 1;
    for (const t of new Set(core.split(" ").filter((t) => t.length > 2))) DF.set(t, (DF.get(t) ?? 0) + 1);
  }
}
const GENERIC = new Set("and the for of media creative digital marketing finance sales management team department office human capital business training school academy trading general merchant investment investments technology technologies tech systems concept concepts links link partners associates ventures holdings foundation institute centre center network industries".split(" "));
const tokenWeight = (t: string) => Math.log((N + 1) / ((DF.get(t) ?? 0) + 1));
const isGeneric = (t: string) => t.length < 3 || GENERIC.has(t) || (DF.get(t) ?? 0) > N * 0.02;
const EVIDENCE = 6.5;

export function distinctTokens(name: string): string[] {
  return [...new Set(coreName(name).split(" "))].filter((t) => !isGeneric(t));
}

// Caps a similarity score unless the query shares enough distinctive words with the register name.
// One common word never identifies an agency; one rare word, or two moderately rare ones, can.
export function gateScore(query: string, candidate: string, raw: number): number {
  const q = distinctTokens(query);
  if (!q.length) return Math.min(raw, 0.5);
  const cand = coreName(candidate).split(" ");
  const matched = q.filter((t) => cand.includes(t) || cand.some((c) => c.length > 3 && dice(t, c) >= 0.85));
  if (!matched.length) return Math.min(raw, 0.5);
  const evidence = matched.reduce((s, t) => s + tokenWeight(t), 0);
  const coverage = evidence / q.reduce((s, t) => s + tokenWeight(t), 0);
  if (evidence < EVIDENCE) return Math.min(raw, 0.6);
  if (coverage < 0.5) return Math.min(raw, 0.65);
  return raw;
}

// True when the register entry's distinctive words all appear in the message, so a fuzzy hit cannot claim a name the text never used.
export function namedInText(entryName: string, text: string): boolean {
  const d = distinctTokens(entryName);
  if (!d.length) return false;
  const t = normName(text);
  return d.every((tok) => t.includes(tok));
}

export function searchByName(query: string, opts: { countries?: Country[]; limit?: number; min?: number } = {}): NameHit[] {
  const countries = opts.countries ?? COUNTRY_CODES;
  const min = opts.min ?? 0.55;
  const hits: NameHit[] = [];
  const q = query.trim();
  if (q.length < 3) return hits;
  for (const c of countries) {
    for (const { entry } of INDEX[c].cores) {
      const s = gateScore(q, entry.name, nameScore(q, entry.name));
      if (s >= min) hits.push({ country: c, entry, score: s });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, opts.limit ?? 8);
}

export function findByPhone(e164: string): NameHit[] {
  const t = phoneTail(e164);
  const out: NameHit[] = [];
  for (const c of COUNTRY_CODES) for (const e of INDEX[c].byPhoneTail.get(t) ?? []) out.push({ country: c, entry: e, score: 1 });
  return out;
}

export function findByEmail(email: string): NameHit[] {
  const out: NameHit[] = [];
  for (const c of COUNTRY_CODES) for (const e of INDEX[c].byEmail.get(email.toLowerCase()) ?? []) out.push({ country: c, entry: e, score: 1 });
  return out;
}

export function findByDomain(domain: string): NameHit[] {
  const out: NameHit[] = [];
  for (const c of COUNTRY_CODES) for (const e of INDEX[c].byDomain.get(domain.toLowerCase()) ?? []) out.push({ country: c, entry: e, score: 1 });
  return out;
}

export function allDomains(): { domain: string; country: Country; entry: RegistryEntry }[] {
  const out: { domain: string; country: Country; entry: RegistryEntry }[] = [];
  for (const c of COUNTRY_CODES) for (const [domain, entries] of INDEX[c].byDomain) out.push({ domain, country: c, entry: entries[0] });
  return out;
}

export function listEntries(c: Country, opts: { q?: string; status?: string; offset?: number; limit?: number } = {}) {
  const snap = SNAPSHOTS[c];
  let rows = snap.entries ?? [];
  if (opts.status && opts.status !== "all") rows = rows.filter((e) => e.status === opts.status);
  if (opts.q && opts.q.trim().length >= 2) {
    const q = opts.q.trim().toLowerCase();
    rows = rows.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.emails.some((x) => x.includes(q)) ||
        e.phones.some((x) => x.includes(q)) ||
        (e.address ?? "").toLowerCase().includes(q),
    );
  }
  const total = rows.length;
  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 50;
  return { total, rows: rows.slice(offset, offset + limit), as_of: snap.as_of, source: snap.source };
}

export function registryStats() {
  return COUNTRY_CODES.map((c) => {
    const s = SNAPSHOTS[c];
    const entries = s.entries ?? [];
    const active = entries.filter((e) => e.status === "active").length;
    const withPhone = entries.filter((e) => e.phones.length).length;
    const withEmail = entries.filter((e) => e.emails.length).length;
    return { country: c, as_of: s.as_of, source: s.source, count: entries.length, active, withPhone, withEmail };
  });
}
