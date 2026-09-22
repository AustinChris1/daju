import type { VerdictLevel } from "./types";

export const VERDICT_LABEL: Record<VerdictLevel, string> = {
  stop: "Stop",
  caution: "Caution",
  on_file: "On file",
  unknown: "Not on file",
};

export const VERDICT_COLOR: Record<VerdictLevel, string> = {
  stop: "text-red",
  caution: "text-amber",
  on_file: "text-stamp",
  unknown: "text-toner-2",
};

export function verdictLabel(level: VerdictLevel): string {
  return VERDICT_LABEL[level];
}
