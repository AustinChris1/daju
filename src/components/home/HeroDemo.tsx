"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Stamp } from "@/components/brand/Stamp";
import type { VerdictLevel } from "@/lib/check/types";

// Two real outcomes from the engine, replayed as a loop. Every register fact shown is from the bundled snapshots.
interface Scene {
  country: string;
  message: string;
  marks: string[];
  lookup: { register: string; count: string; result: string; tone: "ok" | "warn" | "none" }[];
  level: VerdictLevel;
  headline: string;
  line: string;
}

const SCENES: Scene[] = [
  {
    country: "🇺🇬 Uganda",
    message:
      "Jobs available in Saudi Arabia and Dubai for housemaids and drivers. Salary 1,200 SAR to 1,800 SAR monthly. Visa guaranteed, no interview needed. We are agents of Moonlight Recruiting Agency Uganda Ltd. Pay medical fee UGX 350,000 and registration UGX 150,000 before processing. WhatsApp 0756 000 111 now, limited slots.",
    marks: ["Visa guaranteed", "no interview needed", "Moonlight Recruiting Agency Uganda Ltd", "medical fee UGX 350,000", "registration UGX 150,000", "0756 000 111", "limited slots"],
    lookup: [
      { register: "NELEX", count: "1,186", result: "no match", tone: "none" },
      { register: "NEA", count: "1,295", result: "no match", tone: "none" },
      { register: "EEMIS", count: "195", result: "MOONLIGHT RECRUITING AGENCY UGANDA LTD · active to 2028-05-21", tone: "ok" },
      { register: "contact", count: "on file +256 702 022 113", result: "message says 0756 000 111 · does not match", tone: "warn" },
    ],
    level: "stop",
    headline: "Name is on file, contact is not",
    line: "Moonlight is on the Uganda register. The number in the message is not the one on file, and a fee is asked before any work.",
  },
  {
    country: "🇳🇬 Nigeria",
    message:
      "Good day. This is Adaeze from Worknigeria.com Limited. We are recruiting a front-end developer for a fintech client in Lekki. Please send your CV to careers@worknigeria.com. There are no fees at any stage. Interviews are held at our office.",
    marks: ["Worknigeria.com Limited", "careers@worknigeria.com", "no fees at any stage"],
    lookup: [
      { register: "NELEX", count: "1,186", result: "WORKNIGERIA.COM LIMITED · active · CAC verified", tone: "ok" },
      { register: "contact", count: "on file helpdesk@worknigeria.com", result: "message domain worknigeria.com · matches", tone: "ok" },
      { register: "domain", count: "worknigeria.com", result: "registered 2006-02-27", tone: "ok" },
      { register: "warnings", count: "20 rules", result: "none matched", tone: "none" },
    ],
    level: "on_file",
    headline: "On file, contact matches, no lure signals found",
    line: "Still call the number on the register before you pay anything or travel.",
  },
];

type Phase = "paste" | "scan" | "read" | "lookup" | "stamp";
const TIMELINE: [Phase, number][] = [
  ["paste", 900],
  ["scan", 1300],
  ["read", 1800],
  ["lookup", 3600],
  ["stamp", 4200],
];

function Marked({ text, marks, on }: { text: string; marks: string[]; on: boolean }) {
  const re = new RegExp(marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  const parts: { t: string; m: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(re)) {
    const i = match.index ?? 0;
    if (i > last) parts.push({ t: text.slice(last, i), m: false });
    parts.push({ t: match[0], m: true });
    last = i + match[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last), m: false });
  let k = 0;
  let m = 0;
  return (
    <p className="font-mono text-[0.8rem] leading-relaxed text-toner">
      {parts.map((p) =>
        p.m ? (
          <mark key={k++} className={on ? "mark mark-in" : "bg-transparent text-toner"} style={on ? { animationDelay: `${m++ * 90}ms` } : undefined}>
            {p.t}
          </mark>
        ) : (
          <span key={k++}>{p.t}</span>
        ),
      )}
    </p>
  );
}

export function HeroDemo() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>(reduce ? "stamp" : "paste");
  const [visibleLookups, setVisibleLookups] = useState(reduce ? 4 : 0);
  const scene = SCENES[i];

  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    const timers: number[] = [];
    let t = 0;
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("paste");
        setVisibleLookups(0);
      }, 0),
    );
    for (const [p, at] of TIMELINE) {
      timers.push(window.setTimeout(() => !cancelled && setPhase(p), at));
      t = at;
    }
    // Register rows tick in one at a time during the lookup phase.
    for (let r = 0; r < scene.lookup.length; r++) timers.push(window.setTimeout(() => !cancelled && setVisibleLookups(r + 1), 1900 + r * 420));
    timers.push(window.setTimeout(() => !cancelled && setI((n) => (n + 1) % SCENES.length), t + 4600));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [i, reduce, scene.lookup.length]);

  const after = (p: Phase) => TIMELINE.findIndex(([x]) => x === phase) >= TIMELINE.findIndex(([x]) => x === p);

  return (
    <div className="sheet relative overflow-hidden p-4 sm:p-5" aria-live="off" aria-label="A replay of two real checks">
      <div className="flex items-center justify-between">
        <p className="condensed text-[0.65rem] text-toner-2">Live replay · {scene.country}</p>
        <p className="font-mono text-[0.65rem] text-toner-2">
          {phase === "paste" && "pasting"}
          {phase === "scan" && "reading"}
          {phase === "read" && "marking evidence"}
          {phase === "lookup" && "searching four registers"}
          {phase === "stamp" && "issued"}
        </p>
      </div>

      <div className="relative mt-3 border border-rule bg-paper-2 p-3" style={{ minHeight: 132 }}>
        <div key={i} className="hero-paste" data-on={after("paste") ? "" : undefined}>
          <Marked text={scene.message} marks={scene.marks} on={after("read")} />
        </div>
        {phase === "scan" && <div className="scanbar" aria-hidden />}
      </div>

      <ol className="mt-3 space-y-1.5 font-mono text-[0.72rem]">
        {scene.lookup.map((l, idx) =>
          idx < visibleLookups ? (
            <li key={l.register + idx} className="hero-row grid grid-cols-[4.6rem_1fr] gap-2">
              <span className="text-toner-2">
                {l.register} <span className="opacity-70">{l.count}</span>
              </span>
              <span className={l.tone === "ok" ? "text-green" : l.tone === "warn" ? "text-red" : "text-toner-2"}>{l.result}</span>
            </li>
          ) : (
            <li key={l.register + idx} className="grid grid-cols-[4.6rem_1fr] gap-2 text-toner-2 opacity-40" aria-hidden>
              <span>{l.register}</span>
              <span className="border-b border-dotted border-rule" />
            </li>
          ),
        )}
      </ol>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-rule pt-3" style={{ minHeight: 74 }}>
        <div className={`transition-opacity duration-300 ${after("stamp") ? "opacity-100" : "opacity-0"}`}>
          <p className="font-semibold leading-tight">{scene.headline}</p>
          <p className="mt-1 max-w-[42ch] text-xs text-toner-2">{scene.line}</p>
        </div>
        <div className="shrink-0">{after("stamp") && <Stamp key={`${i}-stamp`} level={scene.level} size="sm" animate={!reduce} />}</div>
      </div>
    </div>
  );
}
