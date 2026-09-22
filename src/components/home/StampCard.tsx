"use client";

import { useState } from "react";
import { Stamp } from "@/components/brand/Stamp";
import { Mark } from "@/components/brand/Mark";

// A photocopy that earns its stamp when the visitor presses it. Rare, first-time delight, so it may animate.
export function StampCard() {
  const [stamped, setStamped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setStamped((s) => !s)}
      aria-pressed={stamped}
      className="lift group relative flex aspect-[4/5] flex-col overflow-hidden rounded-[4px] border border-rule bg-paper p-5 text-left shadow-sheet"
    >
      <div className="flex items-center justify-between">
        <Mark size={22} />
        <span className="condensed text-[0.6rem] text-toner-2">Photocopy</span>
      </div>
      <p className="condensed mt-6 text-[0.65rem] text-toner-2">Offer of employment</p>
      <div className="mt-3 space-y-2" aria-hidden>
        {[92, 78, 88, 60, 84, 70, 40].map((w, i) => (
          <div key={i} className="h-2 rounded-[1px] bg-rule" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between">
        <p className="max-w-[22ch] text-xs text-toner-2">{stamped ? "A copy is only certified once the register has been checked." : "Press to run the check on this copy."}</p>
        <div className="min-h-10">{stamped && <Stamp level="on_file" size="sm" />}</div>
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-[4px] ring-0 ring-stamp transition-[box-shadow] duration-150 group-focus-visible:ring-2" />
    </button>
  );
}
