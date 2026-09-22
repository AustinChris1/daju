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
      className="lift card group relative flex aspect-4/5 flex-col overflow-hidden rounded-2xl p-6 text-left"
    >
      <div className="flex items-center justify-between">
        <Mark size={24} />
        <span className="rounded-full bg-paper-2 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-toner-2">Photocopy</span>
      </div>
      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-toner-2">Offer of employment</p>
      <div className="mt-3 space-y-2" aria-hidden>
        {[92, 78, 88, 60, 84, 70, 40].map((w, i) => (
          <div key={i} className="h-2 rounded-full bg-paper-2" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="max-w-[20ch] text-sm text-toner-2">{stamped ? "A copy is only certified once the register has been checked." : "Tap to run the check on this copy."}</p>
        <div className="min-h-10">{stamped && <Stamp level="on_file" size="sm" />}</div>
      </div>
    </button>
  );
}
