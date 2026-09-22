"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Stamp } from "@/components/brand/Stamp";
import type { VerdictLevel } from "@/lib/check/types";
import { SAMPLES } from "@/lib/samples";

// Five real outcomes from the engine on the bundled samples. Colours follow the verdict, never the mood.
const CASES: { id: string; level: VerdictLevel; headline: string; evidence: string; who: string }[] = [
  { id: "thailand", level: "stop", headline: "Money is asked before any work", evidence: "processing fee of Ksh 25,000", who: "Thailand customer-service ad" },
  { id: "uganda-gulf", level: "stop", headline: "Name is on file, contact is not", evidence: "Moonlight Recruiting Agency Uganda Ltd · 0756 000 111", who: "Uganda Gulf housemaid job" },
  { id: "lagos-offer", level: "stop", headline: "Serious clause in this offer", evidence: "N3,000,000 as liquidated damages", who: "Lagos offer letter" },
  { id: "alabuga", level: "stop", headline: "Matches the Alabuga Start pattern", evidence: "Work and study, free flight ticket and hostel", who: "Russia programme ad" },
  { id: "kenya-expired", level: "stop", headline: "Matched agency is not currently licensed", evidence: "Derimel Recruiting Agency Ltd · NEA licence expired", who: "Kenya agency, expired licence" },
  { id: "direct-employer", level: "on_file", headline: "On file, contact matches, no lure signals found", evidence: "careers@worknigeria.com", who: "Direct employer message" },
];

const TONE: Record<VerdictLevel, string> = {
  stop: "bg-red-soft",
  caution: "bg-amber-soft",
  on_file: "bg-green-soft",
  unknown: "bg-paper-2",
};

export function CaseSlider() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(":scope > *");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 16), behavior: "smooth" });
  };
  return (
    <div>
      <div className="mx-auto flex max-w-6xl items-end justify-between px-4 sm:px-6">
        <div>
          <h2 className="display text-[clamp(1.6rem,3.5vw,2.3rem)]">Six messages, six stamps</h2>
          <p className="mt-2 max-w-[52ch] text-toner-2">Composite examples built from the patterns in official warnings; three name real register entries so you can see a match, a mismatch and an expired licence. Swipe, then run any of them.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous" className="rounded-full bg-paper-2 p-3 text-toner hover:bg-stamp hover:text-paper">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Next" className="rounded-full bg-paper-2 p-3 text-toner hover:bg-stamp hover:text-paper">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div ref={ref} className="slider mt-6 px-4 sm:px-6" style={{ scrollPaddingInline: "max(1rem, calc((100vw - 72rem) / 2 + 1.5rem))", paddingInline: "max(1rem, calc((100vw - 72rem) / 2 + 1.5rem))" }}>
        {CASES.map((c) => {
          const sample = SAMPLES.find((s) => s.id === c.id);
          return (
            <article key={c.id} className={`card flex flex-col p-5 ${TONE[c.level]}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-toner-2">{c.who}</p>
                <Stamp level={c.level} size="sm" animate={false} />
              </div>
              <p className="mt-6 text-lg font-bold leading-snug">{c.headline}</p>
              <p className="mt-3 font-mono text-xs leading-relaxed">
                <span className="mark">{c.evidence}</span>
              </p>
              <p className="mt-4 line-clamp-4 text-sm text-toner-2">{sample?.text}</p>
              {sample && (
                <Link href={`/check?text=${encodeURIComponent(sample.text)}&country=${sample.country}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-toner no-underline hover:text-stamp">
                  Run this check <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
