import type { Country } from "@/lib/countries";
import type { Citation, Hotline } from "@/lib/check/types";
import clausesJson from "../../data/law/clauses.json";
import hotlinesJson from "../../data/law/hotlines.json";
import lureJson from "../../data/law/lure_sources.json";

interface ClauseCountry {
  act: string | null;
  section: string | null;
  case?: string | null;
  url: string | null;
  quote: string | null;
  plain: string | null;
  confidence: string;
  note: string | null;
}

interface ClausesFile {
  as_of: string;
  clauses: Record<string, { label: string } & Partial<Record<Country, ClauseCountry>>>;
}

interface HotlinesFile {
  as_of: string;
  NG: Hotline[];
  KE: Hotline[];
  UG: Hotline[];
  GH: Hotline[];
}

export interface LureSource {
  id: string;
  country: string;
  org: string;
  date: string;
  url: string;
  quote: string;
}

const clauses = clausesJson as unknown as ClausesFile;
const hotlines = hotlinesJson as unknown as HotlinesFile;
const lureSources = lureJson as unknown as LureSource[];

export function getCitation(key: string, country: Country): Citation | null {
  const c = clauses.clauses?.[key]?.[country];
  if (!c) return null;
  if (c.act && c.section) return { country, act: c.act, section: c.section, url: c.url ?? "", quote: c.quote ?? "", plain: c.plain ?? "", confidence: c.confidence };
  // Case law: the decision stands in for the Act and the citation is the case reference.
  if (c.case) return { country, act: c.case, section: "judgment", url: c.url ?? "", quote: c.quote ?? "", plain: c.plain ?? "", confidence: c.confidence };
  if (c.act && c.plain) return { country, act: c.act, section: "no cap in statute", url: c.url ?? "", quote: c.quote ?? "", plain: c.plain, confidence: c.confidence };
  return null;
}

export function allClauses() {
  return clauses;
}

export function getHotlines(country: Country): Hotline[] {
  return (hotlines[country] ?? []).filter((h) => h.verified !== false);
}

export function allHotlines(): HotlinesFile {
  return hotlines;
}

export function getLureSource(id: string | null): LureSource | null {
  if (!id) return null;
  return lureSources.find((s) => s.id === id) ?? null;
}

export function allLureSources(): LureSource[] {
  return lureSources;
}

export function lawAsOf(): string {
  return clauses.as_of;
}
