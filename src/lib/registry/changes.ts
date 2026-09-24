import type { Country } from "@/lib/countries";
import log from "../../../data/registries/changes.json";

// What moved between register snapshots, written by scripts/registries/diff.mjs on every weekly refresh.
export interface ChangedEntry {
  id: string;
  name: string;
  status: string;
  license_no: string | null;
  valid_to: string | null;
  from?: string;
  to?: string;
}

export interface CountryChanges {
  country: Country;
  as_of_before: string | null;
  as_of_after: string | null;
  count_before: number;
  count_after: number;
  added_count: number;
  removed_count: number;
  status_change_count: number;
  contact_change_count: number;
  added: ChangedEntry[];
  removed: ChangedEntry[];
  status_changes: ChangedEntry[];
  contact_changes: ChangedEntry[];
}

export interface ChangeRun {
  date: string;
  base: string;
  countries: CountryChanges[];
}

export function changeRuns(): ChangeRun[] {
  return ((log as { runs?: ChangeRun[] }).runs ?? []).slice();
}

export function latestChanges(): ChangeRun | null {
  return changeRuns()[0] ?? null;
}

export function changesFor(country: Country): CountryChanges | null {
  return latestChanges()?.countries.find((c) => c.country === country) ?? null;
}

export function describe(c: CountryChanges): string {
  const parts: string[] = [];
  if (c.added_count) parts.push(`${c.added_count} new`);
  if (c.removed_count) parts.push(`${c.removed_count} removed`);
  if (c.status_change_count) parts.push(`${c.status_change_count} changed status`);
  if (c.contact_change_count) parts.push(`${c.contact_change_count} changed contact`);
  return parts.join(", ");
}
