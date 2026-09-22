"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { VerdictLevel } from "@/lib/check/types";
import { VERDICT_COLOR, VERDICT_LABEL } from "@/lib/check/verdict";

export function Stamp({ level, size = "lg", animate = true }: { level: VerdictLevel; size?: "sm" | "lg"; animate?: boolean }) {
  const reduce = useReducedMotion();
  const cls = `stamp ${VERDICT_COLOR[level]} ${size === "lg" ? "text-[clamp(1.6rem,6vw,2.6rem)]" : "text-sm"}`;
  if (!animate || reduce) return <span className={cls}>{VERDICT_LABEL[level]}</span>;
  return (
    <motion.span
      className={cls}
      initial={{ opacity: 0, scale: 1.35, rotate: -14, filter: "blur(3px)" }}
      animate={{ opacity: 1, scale: 1, rotate: -6, filter: "blur(0px)" }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      style={{ transformOrigin: "center" }}
    >
      {VERDICT_LABEL[level]}
    </motion.span>
  );
}
