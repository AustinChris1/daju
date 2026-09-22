import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Country } from "@/lib/countries";
import type { Report, VerdictLevel } from "@/lib/check/types";

export interface CheckRow {
  id: string;
  created_at: string;
  country: Country;
  kind: string;
  level: VerdictLevel;
  report: Report;
}

export interface ReportRow {
  id: string;
  created_at: string;
  kind: "phone" | "email" | "domain" | "name";
  value: string;
  country: Country | null;
  note: string | null;
  check_id: string | null;
}

export interface EmployerRow {
  id: string;
  created_at: string;
  company: string;
  domain: string;
  country: Country;
  contact_email: string;
  method: "dns" | "email" | null;
  verified_at: string | null;
  dns_token: string;
  email_code: string | null;
  manage_key: string;
}

export interface OfferRow {
  id: string;
  created_at: string;
  token: string;
  employer_id: string;
  role: string;
  candidate: string | null;
  country: Country;
  views: number;
}

export interface WatchRow {
  id: string;
  created_at: string;
  email: string;
  country: Country;
  entry_id: string;
  entry_name: string;
  status_at_watch: string;
}

export interface Stats {
  checks: number;
  byLevel: Record<VerdictLevel, number>;
  byCountry: Record<Country, number>;
  reports: number;
  employers: number;
  offers: number;
}

export interface Store {
  driver: "memory" | "supabase";
  saveCheck(row: CheckRow): Promise<void>;
  getCheck(id: string): Promise<CheckRow | null>;
  recentChecks(limit: number): Promise<Pick<CheckRow, "id" | "created_at" | "country" | "kind" | "level">[]>;
  stats(): Promise<Stats>;
  addReport(row: ReportRow): Promise<void>;
  countReports(values: string[]): Promise<number>;
  recentReports(limit: number): Promise<ReportRow[]>;
  createEmployer(row: EmployerRow): Promise<void>;
  getEmployerByKey(manageKey: string): Promise<EmployerRow | null>;
  getEmployerByDomain(domain: string): Promise<EmployerRow | null>;
  updateEmployer(id: string, patch: Partial<EmployerRow>): Promise<void>;
  createOffer(row: OfferRow): Promise<void>;
  getOffer(token: string): Promise<(OfferRow & { employer: EmployerRow }) | null>;
  listOffers(employerId: string): Promise<OfferRow[]>;
  bumpOfferViews(token: string): Promise<void>;
  addWatch(row: WatchRow): Promise<void>;
  listWatches(email: string): Promise<WatchRow[]>;
  allWatches(): Promise<WatchRow[]>;
}

const emptyLevels = (): Record<VerdictLevel, number> => ({ stop: 0, caution: 0, on_file: 0, unknown: 0 });
const emptyCountries = (): Record<Country, number> => ({ NG: 0, KE: 0, UG: 0, GH: 0 });

class MemoryStore implements Store {
  driver = "memory" as const;
  checks = new Map<string, CheckRow>();
  reports: ReportRow[] = [];
  employers = new Map<string, EmployerRow>();
  offers = new Map<string, OfferRow>();
  watches: WatchRow[] = [];

  async saveCheck(row: CheckRow) {
    this.checks.set(row.id, row);
    if (this.checks.size > 5000) this.checks.delete(this.checks.keys().next().value as string);
  }
  async getCheck(id: string) {
    return this.checks.get(id) ?? null;
  }
  async recentChecks(limit: number) {
    return [...this.checks.values()].slice(-limit).reverse().map(({ id, created_at, country, kind, level }) => ({ id, created_at, country, kind, level }));
  }
  async stats(): Promise<Stats> {
    const byLevel = emptyLevels();
    const byCountry = emptyCountries();
    for (const c of this.checks.values()) {
      byLevel[c.level]++;
      byCountry[c.country]++;
    }
    return { checks: this.checks.size, byLevel, byCountry, reports: this.reports.length, employers: [...this.employers.values()].filter((e) => e.verified_at).length, offers: this.offers.size };
  }
  async addReport(row: ReportRow) {
    this.reports.push(row);
  }
  async countReports(values: string[]) {
    const set = new Set(values.map((v) => v.toLowerCase()));
    return this.reports.filter((r) => set.has(r.value.toLowerCase())).length;
  }
  async recentReports(limit: number) {
    return this.reports.slice(-limit).reverse();
  }
  async createEmployer(row: EmployerRow) {
    this.employers.set(row.id, row);
  }
  async getEmployerByKey(k: string) {
    return [...this.employers.values()].find((e) => e.manage_key === k) ?? null;
  }
  async getEmployerByDomain(d: string) {
    return [...this.employers.values()].find((e) => e.domain === d && e.verified_at) ?? null;
  }
  async updateEmployer(id: string, patch: Partial<EmployerRow>) {
    const e = this.employers.get(id);
    if (e) this.employers.set(id, { ...e, ...patch });
  }
  async createOffer(row: OfferRow) {
    this.offers.set(row.token, row);
  }
  async getOffer(token: string) {
    const o = this.offers.get(token);
    if (!o) return null;
    const employer = this.employers.get(o.employer_id);
    return employer ? { ...o, employer } : null;
  }
  async listOffers(employerId: string) {
    return [...this.offers.values()].filter((o) => o.employer_id === employerId).reverse();
  }
  async bumpOfferViews(token: string) {
    const o = this.offers.get(token);
    if (o) o.views++;
  }
  async addWatch(row: WatchRow) {
    this.watches.push(row);
  }
  async listWatches(email: string) {
    return this.watches.filter((w) => w.email === email);
  }
  async allWatches() {
    return this.watches;
  }
}

class SupabaseStore implements Store {
  driver = "supabase" as const;
  constructor(private sb: SupabaseClient) {}

  async saveCheck(row: CheckRow) {
    const { error } = await this.sb.from("tc_checks").insert(row);
    if (error) throw error;
  }
  async getCheck(id: string) {
    const { data } = await this.sb.from("tc_checks").select("*").eq("id", id).maybeSingle();
    return (data as CheckRow) ?? null;
  }
  async recentChecks(limit: number) {
    const { data } = await this.sb.from("tc_checks").select("id,created_at,country,kind,level").order("created_at", { ascending: false }).limit(limit);
    return (data as CheckRow[]) ?? [];
  }
  async stats(): Promise<Stats> {
    const [checks, levels, countries, reports, employers, offers] = await Promise.all([
      this.sb.from("tc_checks").select("id", { count: "exact", head: true }),
      this.sb.from("tc_checks").select("level"),
      this.sb.from("tc_checks").select("country"),
      this.sb.from("tc_reports").select("id", { count: "exact", head: true }),
      this.sb.from("tc_employers").select("id", { count: "exact", head: true }).not("verified_at", "is", null),
      this.sb.from("tc_offers").select("id", { count: "exact", head: true }),
    ]);
    const byLevel = emptyLevels();
    for (const r of (levels.data ?? []) as { level: VerdictLevel }[]) byLevel[r.level]++;
    const byCountry = emptyCountries();
    for (const r of (countries.data ?? []) as { country: Country }[]) byCountry[r.country]++;
    return { checks: checks.count ?? 0, byLevel, byCountry, reports: reports.count ?? 0, employers: employers.count ?? 0, offers: offers.count ?? 0 };
  }
  async addReport(row: ReportRow) {
    const { error } = await this.sb.from("tc_reports").insert(row);
    if (error) throw error;
  }
  async countReports(values: string[]) {
    if (!values.length) return 0;
    const { count } = await this.sb.from("tc_reports").select("id", { count: "exact", head: true }).in("value", values.map((v) => v.toLowerCase()));
    return count ?? 0;
  }
  async recentReports(limit: number) {
    const { data } = await this.sb.from("tc_reports").select("*").order("created_at", { ascending: false }).limit(limit);
    return (data as ReportRow[]) ?? [];
  }
  async createEmployer(row: EmployerRow) {
    const { error } = await this.sb.from("tc_employers").insert(row);
    if (error) throw error;
  }
  async getEmployerByKey(k: string) {
    const { data } = await this.sb.from("tc_employers").select("*").eq("manage_key", k).maybeSingle();
    return (data as EmployerRow) ?? null;
  }
  async getEmployerByDomain(d: string) {
    const { data } = await this.sb.from("tc_employers").select("*").eq("domain", d).not("verified_at", "is", null).maybeSingle();
    return (data as EmployerRow) ?? null;
  }
  async updateEmployer(id: string, patch: Partial<EmployerRow>) {
    const { error } = await this.sb.from("tc_employers").update(patch).eq("id", id);
    if (error) throw error;
  }
  async createOffer(row: OfferRow) {
    const { error } = await this.sb.from("tc_offers").insert(row);
    if (error) throw error;
  }
  async getOffer(token: string) {
    const { data } = await this.sb.from("tc_offers").select("*, employer:tc_employers(*)").eq("token", token).maybeSingle();
    return (data as (OfferRow & { employer: EmployerRow }) | null) ?? null;
  }
  async listOffers(employerId: string) {
    const { data } = await this.sb.from("tc_offers").select("*").eq("employer_id", employerId).order("created_at", { ascending: false });
    return (data as OfferRow[]) ?? [];
  }
  async bumpOfferViews(token: string) {
    await this.sb.rpc("tc_bump_offer_views", { p_token: token });
  }
  async addWatch(row: WatchRow) {
    const { error } = await this.sb.from("tc_watches").insert(row);
    if (error) throw error;
  }
  async listWatches(email: string) {
    const { data } = await this.sb.from("tc_watches").select("*").eq("email", email);
    return (data as WatchRow[]) ?? [];
  }
  async allWatches() {
    const { data } = await this.sb.from("tc_watches").select("*");
    return (data as WatchRow[]) ?? [];
  }
}

declare global {
  var __trueCopyStore: Store | undefined;
}

export function getStore(): Store {
  if (globalThis.__trueCopyStore) return globalThis.__trueCopyStore;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const store: Store = url && key ? new SupabaseStore(createClient(url, key, { auth: { persistSession: false } })) : new MemoryStore();
  globalThis.__trueCopyStore = store;
  return store;
}
