"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COUNTRIES, COUNTRY_CODES, type Country } from "@/lib/countries";
import { VERDICT_LABEL } from "@/lib/check/verdict";
import type { VerdictLevel } from "@/lib/check/types";
import type { RadarData } from "@/lib/radar";
import type { CountryChanges } from "@/lib/registry/changes";
import { CountUp } from "@/components/home/Reveal";
import { Flag } from "@/components/brand/Flag";

const LEVELS: VerdictLevel[] = ["stop", "caution", "on_file", "unknown"];
const LEVEL_BG: Record<VerdictLevel, string> = { stop: "bg-red", caution: "bg-amber", on_file: "bg-stamp", unknown: "bg-toner-2" };
const LEVEL_CHIP: Record<VerdictLevel, string> = { stop: "bg-red-soft text-red", caution: "bg-amber-soft text-amber", on_file: "bg-stamp-soft text-stamp", unknown: "bg-paper-2 text-toner-2" };
const KIND: Record<string, string> = { job_ad: "job ad", offer_letter: "offer letter", recruiter_message: "recruiter message", link: "link", contact_only: "contact only" };
const SEVERITY: Record<string, string> = { high: "text-red", medium: "text-amber", low: "text-toner-2" };
const REFRESH_MS = 30_000;

function ago(iso: string, now: number): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function describe(c: CountryChanges): string {
  const parts: string[] = [];
  if (c.added_count) parts.push(`${c.added_count} new`);
  if (c.removed_count) parts.push(`${c.removed_count} left`);
  if (c.status_change_count) parts.push(`${c.status_change_count} changed status`);
  if (c.contact_change_count) parts.push(`${c.contact_change_count} changed contact`);
  return parts.join(", ");
}

export function RadarLive({ initial }: { initial: RadarData }) {
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(() => new Date(initial.generatedAt).getTime());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/radar", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as RadarData;
        if (!alive) return;
        setData(next);
        setNow(Date.now());
        setPulse(true);
        setTimeout(() => alive && setPulse(false), 600);
      } catch {}
    };
    const poll = setInterval(tick, REFRESH_MS);
    const clock = setInterval(() => setNow(Date.now()), 10_000);
    const first = setTimeout(() => setNow(Date.now()), 0);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
      clearTimeout(first);
    };
  }, []);

  const { stats } = data;
  const total = Math.max(1, stats.checks);
  const maxCountry = Math.max(1, ...COUNTRY_CODES.map((c) => stats.byCountry[c] ?? 0));
  const maxPattern = Math.max(1, ...data.patterns.map((p) => p.count));

  return (
    <div className="space-y-10">
      <p className="flex items-center gap-2 text-sm text-toner-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full bg-green ${pulse ? "scale-150" : ""}`} style={{ transition: "transform 300ms var(--ease-out)" }} aria-hidden />
        Live from {data.driver === "supabase" ? "the database" : "this server's memory"}. Refreshes every 30 seconds. Last read {ago(data.generatedAt, now)}.
      </p>

      <section className="card overflow-hidden">
        <div className="grid gap-px bg-rule/60 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Checks stamped", value: stats.checks, tone: "text-stamp" },
            { label: "Stops", value: stats.byLevel.stop, tone: "text-red" },
            { label: "Cautions", value: stats.byLevel.caution, tone: "text-amber" },
            { label: "Contacts reported", value: stats.reports, tone: "text-toner" },
            { label: "Verified employers", value: stats.employers, tone: "text-green" },
            { label: "Verified roles open", value: stats.jobs, tone: "text-green" },
          ].map((s) => (
            <div key={s.label} className="bg-paper p-5">
              <p className={`text-4xl font-extrabold tracking-tight ${s.tone}`}>
                <CountUp value={s.value} />
              </p>
              <p className="mt-1 text-sm font-semibold text-toner-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold">Stamp mix</h2>
          <p className="mt-1 text-sm text-toner-2">What the last {stats.checks.toLocaleString()} checks came back with.</p>
          <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={LEVELS.map((l) => `${VERDICT_LABEL[l]} ${stats.byLevel[l]}`).join(", ")}>
            {LEVELS.map((l) => (
              <div key={l} className={LEVEL_BG[l]} style={{ width: `${(stats.byLevel[l] / total) * 100}%`, transition: "width 600ms var(--ease-out)" }} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {LEVELS.map((l) => (
              <li key={l} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${LEVEL_BG[l]}`} aria-hidden />
                <span className="font-semibold">{VERDICT_LABEL[l]}</span>
                <span className="font-mono text-toner-2">{stats.byLevel[l]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-bold">Checks by country</h2>
          <p className="mt-1 text-sm text-toner-2">Where the messages being checked come from.</p>
          <ul className="mt-4 space-y-3">
            {COUNTRY_CODES.map((c) => (
              <li key={c}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    <Flag code={c} /> {COUNTRIES[c].name}
                  </span>
                  <span className="font-mono text-toner-2">{stats.byCountry[c] ?? 0}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper-2">
                  <div className="h-full rounded-full bg-stamp" style={{ width: `${((stats.byCountry[c] ?? 0) / maxCountry) * 100}%`, transition: "width 600ms var(--ease-out)" }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card p-6">
          <h2 className="font-bold">Lures seen most</h2>
          <p className="mt-1 text-sm text-toner-2">Across the last {data.patternSample.toLocaleString()} checks. Each rule cites the official warning it comes from.</p>
          {data.patterns.length === 0 ? (
            <p className="mt-4 text-sm text-toner-2">No lure has matched yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {data.patterns.map((p, i) => (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      <span className="mr-2 font-mono text-xs text-toner-2">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-semibold">{p.title}</span>
                      <span className={`ml-2 text-xs font-bold uppercase ${SEVERITY[p.severity] ?? ""}`}>{p.severity}</span>
                    </span>
                    <span className="font-mono text-toner-2">{p.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2">
                    <div className={`h-full rounded-full ${p.severity === "high" ? "bg-red" : p.severity === "medium" ? "bg-amber" : "bg-toner-2"}`} style={{ width: `${(p.count / maxPattern) * 100}%`, transition: "width 600ms var(--ease-out)" }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-bold">Last stamps</h2>
          <p className="mt-1 text-sm text-toner-2">Anonymous: country, what was pasted, and the stamp it got.</p>
          {data.recent.length === 0 ? (
            <p className="mt-4 text-sm text-toner-2">No checks yet. <Link href="/check">Run the first one</Link>.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rule/60 text-sm">
              {data.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2">
                    <Flag code={r.country as Country} />
                    <span className="text-toner">{KIND[r.kind] ?? r.kind}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${LEVEL_CHIP[r.level]}`}>{VERDICT_LABEL[r.level]}</span>
                    <span className="w-14 text-right font-mono text-xs text-toner-2">{ago(r.at, now)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">The registers this week</h2>
          {data.moved && <span className="text-sm text-toner-2">Last diff {data.moved.date}</span>}
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.registers.map((r) => {
            const c = COUNTRIES[r.country];
            const m = data.moved?.countries.find((x) => x.country === r.country);
            return (
              <li key={r.country} className="rounded-2xl bg-paper-2 p-4">
                <p className="font-bold">
                  <Flag code={c.code} /> {c.registry.short}
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-stamp">{r.count.toLocaleString()}</p>
                <p className="text-xs text-toner-2">snapshot {r.as_of}</p>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-toner-2">Active</dt><dd className="font-mono">{r.active.toLocaleString()}</dd></div>
                  <div className="flex justify-between"><dt className="text-toner-2">Lapsed or revoked</dt><dd className={`font-mono ${r.lapsed ? "text-red" : ""}`}>{r.lapsed.toLocaleString()}</dd></div>
                  <div className="flex justify-between"><dt className="text-toner-2">With a phone</dt><dd className="font-mono">{r.withPhone.toLocaleString()}</dd></div>
                </dl>
                <p className="mt-3 text-sm">{m ? <span className="font-semibold text-amber">{describe(m)}</span> : <span className="text-toner-2">No change in the last diff</span>}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-toner-2">
          Every Monday the four registers are re-read and the difference is committed. <Link href="/registry">See what moved</Link>.
        </p>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Contacts reported by the community</h2>
        <p className="mt-1 text-sm text-toner-2">Numbers and addresses are masked. A report is one person&apos;s word. It shows on a card as a count, never as a verdict.</p>
        {data.reports.length === 0 ? (
          <p className="mt-4 text-sm text-toner-2">Nothing reported yet. <Link href="/report">Report a contact</Link>.</p>
        ) : (
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {data.reports.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-paper-2 px-3 py-2">
                <span className="font-mono">{r.value}</span>
                <span className="text-xs text-toner-2">
                  {r.kind}
                  {r.country ? <> · <Flag code={r.country} /></> : null} · {ago(r.at, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
