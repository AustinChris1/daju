import "server-only";
import { COUNTRY_CODES, type Country } from "@/lib/countries";
import { LURE_RULES } from "@/lib/rules/lure";
import { registryStats, snapshot } from "@/lib/registry/load";
import { latestChanges, type CountryChanges } from "@/lib/registry/changes";
import { getStore, type Stats } from "@/lib/store";
import type { VerdictLevel } from "@/lib/check/types";

// Everything the Radar page shows, read live from the database and the deployed register snapshots.
export interface RadarData {
  generatedAt: string;
  driver: "memory" | "supabase";
  stats: Stats;
  recent: { id: string; at: string; country: Country; kind: string; level: VerdictLevel }[];
  patterns: { id: string; title: string; severity: string; count: number }[];
  patternSample: number;
  registers: { country: Country; as_of: string; count: number; active: number; lapsed: number; withPhone: number }[];
  moved: { date: string; countries: CountryChanges[] } | null;
  reports: { at: string; kind: string; value: string; country: Country | null }[];
}

// Reported phone numbers and emails belong to people until proven otherwise, so only their shape is shown.
export function maskValue(kind: string, value: string): string {
  if (kind === "phone") {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 7) return value.slice(0, 3) + "•••";
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ••• ${digits.slice(-3)}`;
  }
  if (kind === "email") {
    const [user, domain] = value.split("@");
    if (!domain) return value.slice(0, 2) + "•••";
    return `${user.slice(0, 2)}•••@${domain}`;
  }
  return value;
}

export async function radarData(): Promise<RadarData> {
  const store = getStore();
  const [stats, recent, lure, reports] = await Promise.all([store.stats(), store.recentChecks(20), store.recentLure(200), store.recentReports(12)]);

  const counts = new Map<string, number>();
  for (const ids of lure) for (const id of new Set(ids)) counts.set(id, (counts.get(id) ?? 0) + 1);
  const patterns = [...counts]
    .map(([id, count]) => {
      const rule = LURE_RULES.find((r) => r.id === id);
      return { id, title: rule?.title ?? id, severity: rule?.severity ?? "low", count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const registers = registryStats().map((s) => {
    const c = s.country as Country;
    const lapsed = snapshot(c).entries.filter((e) => e.status === "expired" || e.status === "inactive" || e.status === "revoked").length;
    return { country: c, as_of: s.as_of, count: s.count, active: s.active, lapsed, withPhone: s.withPhone };
  });

  const changes = latestChanges();
  return {
    generatedAt: new Date().toISOString(),
    driver: store.driver,
    stats,
    recent: recent.map((r) => ({ id: r.id, at: r.created_at, country: r.country, kind: r.kind, level: r.level })),
    patterns,
    patternSample: lure.length,
    registers: COUNTRY_CODES.map((c) => registers.find((r) => r.country === c)).filter((r): r is NonNullable<typeof r> => !!r),
    moved: changes ? { date: changes.date, countries: changes.countries } : null,
    reports: reports.map((r) => ({ at: r.created_at, kind: r.kind, value: maskValue(r.kind, r.value), country: r.country })),
  };
}
