import type { Country } from "@/lib/countries";
import type { RegistryStatus } from "@/lib/registry/types";

export type Severity = "high" | "medium" | "low" | "info";

export type InputKind = "job_ad" | "offer_letter" | "recruiter_message" | "link" | "contact_only";

export interface MoneyMention {
  amount: number;
  currency: string;
  raw: string;
  context: string;
  purpose: string | null;
}

export interface Extraction {
  kind: InputKind;
  text: string;
  orgCandidates: string[];
  people: string[];
  emails: string[];
  phones: string[];
  domains: string[];
  urls: string[];
  money: MoneyMention[];
  feeAsks: MoneyMention[];
  salary: MoneyMention | null;
  destinations: string[];
  titles: string[];
  channels: string[];
  countryGuess: Country | null;
  signals: Record<string, string | null>;
  source: "heuristic" | "heuristic+llm";
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence: string | null;
  sourceId: string | null;
}

export type ContactMatch = "match" | "mismatch" | "none_on_file" | "not_provided";

export interface IdentityMatch {
  country: Country;
  entryId: string;
  name: string;
  score: number;
  status: RegistryStatus;
  validTo: string | null;
  licenseNo: string | null;
  contact: ContactMatch;
  matchedVia: "name" | "phone" | "email" | "domain";
  onFile: { phones: string[]; emails: string[]; domains: string[] };
  cacVerified: boolean | null;
}

export interface DomainIntel {
  domain: string;
  registered: string | null;
  ageDays: number | null;
  mx: boolean | null;
  freeMail: boolean;
  lookalikeOf: { domain: string; name: string; country: Country } | null;
  error: string | null;
}

export interface Citation {
  country: Country;
  act: string;
  section: string;
  url: string;
  quote: string;
  plain: string;
  confidence: string;
}

export interface ClauseFinding {
  key: string;
  label: string;
  severity: Severity;
  evidence: string;
  detail: string;
  citation: Citation | null;
}

export type VerdictLevel = "stop" | "caution" | "on_file" | "unknown";

export interface Hotline {
  org: string;
  channel: "phone" | "email" | "web";
  value: string;
  source_url: string;
  verified: boolean;
}

export interface Report {
  id: string;
  version: string;
  createdAt: string;
  country: Country;
  kind: InputKind;
  extraction: Extraction;
  identity: { queries: string[]; matches: IdentityMatch[]; impersonation: boolean };
  domains: DomainIntel[];
  lure: Finding[];
  clauses: ClauseFinding[];
  verdict: { level: VerdictLevel; headline: string; lines: string[] };
  actions: { replies: Record<string, string>; hotlines: Hotline[]; shareText: string; replyScenario: string };
  registryAsOf: Record<Country, string>;
  community: { reports: number } | null;
  verifiedSender: { company: string; domain: string; verifiedAt: string; method: string } | null;
}

export interface CheckInput {
  text?: string;
  url?: string;
  name?: string;
  phone?: string;
  email?: string;
  country?: Country | "auto";
  offerToken?: string;
}
