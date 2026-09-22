"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { Mark } from "./Mark";

// Four directions for the mark. A is what ships; the others stay here so the choice can be revisited.
const MARKS: { id: string; name: string; idea: string; svg: (s: number) => React.ReactNode }[] = [
  {
    id: "a",
    name: "Tone seal",
    idea: "The two high-tone marks that make dájú mean certain, impressed inside a double-ring seal. The tone is the certainty; the seal is the register that earns it.",
    svg: (s) => <Mark size={s} />,
  },
  {
    id: "b",
    name: "Page and seal",
    idea: "A photocopied page with the seal over its corner: only a record on file earns the impression.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <path d="M6 3.5h13l6 6V27a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 5 27V5a1.5 1.5 0 0 1 1-1.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M19 3.5v6h6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M9.5 15h9M9.5 19.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="22.5" cy="22.5" r="7.5" fill="var(--paper)" stroke="var(--stamp)" strokeWidth="2.2" />
        <circle cx="22.5" cy="22.5" r="4.2" stroke="var(--stamp)" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "c",
    name: "Accents as ink",
    idea: "The word itself is the mark: toner letters, and only the two accents printed in stamp ink.",
    svg: (s) => (
      <svg width={s * 2.2} height={s} viewBox="0 0 70 32" fill="none">
        <text x="2" y="27" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="26" fill="currentColor" letterSpacing="0.5">
          daju
        </text>
        <path d="M21 7.5 24 2.5M49 7.5 52 2.5" stroke="var(--stamp)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "d",
    name: "Ledger tick",
    idea: "A ruled register line with one entry sitting on it: on file means a line in the book.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <path d="M3 10h26M3 17h26M3 24h26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="4.5" fill="var(--stamp)" />
      </svg>
    ),
  },
];

export function BrandBoard() {
  const [dark, setDark] = useState(false);
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="condensed text-[0.8rem] text-toner-2">Directions considered</h2>
        <button type="button" onClick={() => setDark((d) => !d)} className="border border-rule px-3 py-1 text-xs">
          Preview on {dark ? "light" : "dark"}
        </button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2" data-theme={dark ? "dark" : "light"} style={dark ? ({ "--paper": "#141416", "--toner": "#edebe6", "--stamp": "#b49be8", "--rule": "#33333a", "--toner-2": "#a9a69f" } as React.CSSProperties) : undefined}>
        {MARKS.map((m) => (
          <div key={m.id} className="border border-rule p-5" style={{ background: "var(--paper)", color: "var(--toner)" }}>
            <div className="flex flex-wrap items-end gap-5">
              {m.svg(72)}
              {m.svg(32)}
              {m.svg(16)}
              <span className="wordmark ml-auto text-[1.2rem]">{BRAND.display}</span>
            </div>
            <p className="mt-4 font-semibold">
              {m.name}
              {m.id === "a" && <span className="ml-2 text-xs font-normal" style={{ color: "var(--stamp)" }}>ships</span>}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--toner-2)" }}>{m.idea}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
