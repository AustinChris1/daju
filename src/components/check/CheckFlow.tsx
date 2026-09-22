"use client";

import { useMemo, useState } from "react";
import type { Report } from "@/lib/check/types";
import type { Country } from "@/lib/countries";
import { setStored, storageKey, useStoredValue } from "@/lib/useStored";
import { CheckForm } from "./CheckForm";
import { ReportCard } from "./ReportCard";
import { Sheet } from "@/components/ui";

const KEY = storageKey("history");
type Item = { id: string; headline: string; level: string; at: string };

export function CheckFlow({ initialText, initialCountry, siteUrl }: { initialText?: string; initialCountry?: Country | "auto"; siteUrl: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const raw = useStoredValue(KEY);
  const history = useMemo<Item[]>(() => {
    try {
      return raw ? (JSON.parse(raw) as Item[]) : [];
    } catch {
      return [];
    }
  }, [raw]);

  function onResult(r: Report) {
    setReport(r);
    const next = [{ id: r.id, headline: r.verdict.headline, level: r.verdict.level, at: r.createdAt }, ...history.filter((h) => h.id !== r.id)].slice(0, 12);
    setStored(KEY, JSON.stringify(next));
    try {
      window.history.replaceState(null, "", `/c/${r.id}`);
    } catch {}
    requestAnimationFrame(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-8">
      <Sheet>
        <CheckForm initialText={initialText} initialCountry={initialCountry} onResult={onResult} />
      </Sheet>
      <div id="result">{report && <ReportCard report={report} shareUrl={`${siteUrl}/c/${report.id}`} />}</div>
      {!report && history.length > 0 && (
        <div className="text-sm">
          <p className="condensed text-[0.7rem] text-toner-2">Your recent checks on this phone</p>
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                <a href={`/c/${h.id}`} className="text-toner">{h.headline}</a>
                <span className="font-mono text-xs text-toner-2">{h.at.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
