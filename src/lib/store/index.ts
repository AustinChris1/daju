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

export interface JobRow {
  id: string;
  created_at: string;
  employer_id: string;
  title: string;
  country: Country;
  location: string;
  mode: "onsite" | "hybrid" | "remote";
  salary: string | null;
  description: string;
  apply_email: string;
  public: boolean;
  views: number;
}

export type JobWithEmployer = JobRow & { employer: Pick<EmployerRow, "id" | "company" | "domain" | "country" | "verified_at" | "method"> };

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
  createJob(row: JobRow): Promise<void>;
  listJobs(limit: number): Promise<JobWithEmployer[]>;
  listEmployerJobs(employerId: string): Promise<JobRow[]>;
  getJob(id: string): Promise<JobWithEmployer | null>;
  setJobPublic(id: string, employerId: string, isPublic: boolean): Promise<void>;
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
  jobs = new Map<string, JobRow>();
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
  async createJob(row: JobRow) {
    this.jobs.set(row.id, row);
  }
  private withEmployer(j: JobRow): JobWithEmployer | null {
    const e = this.employers.get(j.employer_id);
    return e ? { ...j, employer: { id: e.id, company: e.company, domain: e.domain, country: e.country, verified_at: e.verified_at, method: e.method } } : null;
  }
  async listJobs(limit: number) {
    return [...this.jobs.values()].filter((j) => j.public).reverse().map((j) => this.withEmployer(j)).filter((j): j is JobWithEmployer => !!j && !!j.employer.verified_at).slice(0, limit);
  }
  async listEmployerJobs(employerId: string) {
    return [...this.jobs.values()].filter((j) => j.employer_id === employerId).reverse();
  }
  async getJob(id: string) {
    const j = this.jobs.get(id);
    if (!j) return null;
    j.views++;
    return this.withEmployer(j);
  }
  async setJobPublic(id: string, employerId: string, isPublic: boolean) {
    const j = this.jobs.get(id);
    if (j && j.employer_id === employerId) j.public = isPublic;
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
  async createJob(row: JobRow) {
    const { error } = await this.sb.from("tc_jobs").insert(row);
    if (error) throw error;
  }
  async listJobs(limit: number) {
    const { data } = await this.sb.from("tc_jobs").select("*, employer:tc_employers(id,company,domain,country,verified_at,method)").eq("public", true).order("created_at", { ascending: false }).limit(limit);
    return ((data as JobWithEmployer[]) ?? []).filter((j) => j.employer?.verified_at);
  }
  async listEmployerJobs(employerId: string) {
    const { data } = await this.sb.from("tc_jobs").select("*").eq("employer_id", employerId).order("created_at", { ascending: false });
    return (data as JobRow[]) ?? [];
  }
  async getJob(id: string) {
    const { data } = await this.sb.from("tc_jobs").select("*, employer:tc_employers(id,company,domain,country,verified_at,method)").eq("id", id).maybeSingle();
    if (data) await this.sb.rpc("tc_bump_job_views", { p_id: id });
    return (data as JobWithEmployer | null) ?? null;
  }
  async setJobPublic(id: string, employerId: string, isPublic: boolean) {
    const { error } = await this.sb.from("tc_jobs").update({ public: isPublic }).eq("id", id).eq("employer_id", employerId);
    if (error) throw error;
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

// Supports the Vercel Supabase integration with or without a custom variable prefix.
function supabaseEnv(): { url?: string; key?: string } {
  const p = process.env.SUPABASE_ENV_PREFIX?.trim();
  const e = process.env;
  const url = e.SUPABASE_URL || e.NEXT_PUBLIC_SUPABASE_URL || (p ? e[`${p}_URL`] || e[`${p}_SUPABASE_URL`] : undefined);
  const key =
    e.SUPABASE_SERVICE_ROLE_KEY ||
    e.SUPABASE_ANON_KEY ||
    e.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (p ? e[`${p}_SERVICE_ROLE_KEY`] || e[`${p}_SUPABASE_SERVICE_ROLE_KEY`] || e[`${p}_ANON_KEY`] || e[`${p}_SUPABASE_ANON_KEY`] : undefined);
  return { url, key };
}

// Bump when the Store interface grows, so a dev hot reload rebuilds the cached singleton.
const STORE_VERSION = 2;

export function getStore(): Store {
  const cached = globalThis.__trueCopyStore as (Store & { __v?: number }) | undefined;
  if (cached && cached.__v === STORE_VERSION) return cached;
  const { url, key } = supabaseEnv();
  const store: Store & { __v?: number } = url && key ? new SupabaseStore(createClient(url, key, { auth: { persistSession: false } })) : new MemoryStore();
  store.__v = STORE_VERSION;
  globalThis.__trueCopyStore = store;
  return store;
}
