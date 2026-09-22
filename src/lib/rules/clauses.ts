import type { Country } from "@/lib/countries";
import type { ClauseFinding, Extraction, Severity } from "@/lib/check/types";
import { getCitation } from "@/lib/law";

interface ClauseRule {
  key: string;
  label: string;
  severity: Severity;
  detail: (x: Extraction, ev: string) => string;
  test: (x: Extraction) => string | null;
}

const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, twelve: 12 };

function monthsIn(s: string): number | null {
  const m = s.match(/(\d+|one|two|three|four|five|six|twelve)\s*(?:\(\d+\)\s*)?(years?|months?|weeks?)/i);
  if (!m) return null;
  const n = WORD_NUM[m[1].toLowerCase()] ?? parseInt(m[1], 10);
  if (!isFinite(n)) return null;
  const unit = m[2].toLowerCase();
  if (unit.startsWith("year")) return n * 12;
  if (unit.startsWith("week")) return n / 4;
  return n;
}

const PROBATION_CAP: Record<Country, number | null> = { NG: null, KE: 6, UG: 6, GH: null };

export const CLAUSE_RULES: ClauseRule[] = [
  {
    key: "training_bond",
    label: "Training or service bond",
    severity: "high",
    detail: () => "You are asked to pay or serve if you leave. Bonds are only enforceable when the amount matches a real training cost and the period is reasonable. A blanket bond that stops you resigning is not.",
    test: (x) => x.signals.trainingBond,
  },
  {
    key: "probation",
    label: "Probation terms",
    severity: "medium",
    detail: (x, ev) => {
      const months = monthsIn(ev);
      const cap = x.countryGuess ? PROBATION_CAP[x.countryGuess] : null;
      if (x.signals.unpaidProbation) return "Probation without full pay. Probation changes how you can be dismissed, not whether you are paid for work done.";
      if (months && cap && months > cap) return `Probation of ${months} months exceeds the statutory maximum of ${cap} months without your written agreement to an extension.`;
      return "Check the probation length and what happens at the end of it. The statute sets the limits below.";
    },
    test: (x) => (x.signals.unpaidProbation ? x.signals.unpaidProbation : (() => {
      const p = x.signals.probation;
      if (!p) return null;
      const months = monthsIn(p);
      const cap = x.countryGuess ? PROBATION_CAP[x.countryGuess] : null;
      return months && cap && months > cap ? p : null;
    })()),
  },
  {
    key: "certificates",
    label: "Original certificates withheld",
    severity: "high",
    detail: () => "Keeping your original certificates or passport as security is a control tactic, not a normal HR practice. Provide certified copies and keep the originals.",
    test: (x) => x.signals.withheldCerts,
  },
  {
    key: "notice",
    label: "Termination without proper notice",
    severity: "medium",
    detail: () => "Every one of the four labour statutes sets a minimum notice period, or pay in lieu, for a monthly-paid employee. A clause that allows dismissal without notice at any time overrides that.",
    test: (x) => x.signals.noNotice,
  },
  {
    key: "currency",
    label: "Salary quoted in foreign currency",
    severity: "low",
    detail: (x) => `Salary quoted as ${x.salary?.raw ?? "a foreign amount"}. Confirm in writing how and where it will be paid, and at what rate, before you accept.`,
    test: (x) => x.signals.foreignCurrencySalary,
  },
  {
    key: "non_compete",
    label: "Non-compete or restraint of trade",
    severity: "medium",
    detail: (x, ev) => {
      const months = monthsIn(ev);
      return months && months > 12 ? `A ${months}-month restraint is longer than courts in the region usually accept. Ask for the scope and duration to be narrowed.` : "Restraints are enforced only when reasonable in duration, geography and scope.";
    },
    test: (x) => x.signals.nonCompete,
  },
];

export function runClauseRules(x: Extraction, country: Country): ClauseFinding[] {
  if (x.kind !== "offer_letter" && !x.signals.trainingBond && !x.signals.withheldCerts) return [];
  const out: ClauseFinding[] = [];
  for (const r of CLAUSE_RULES) {
    const ev = r.test(x);
    if (!ev) continue;
    out.push({ key: r.key, label: r.label, severity: r.severity, evidence: ev.slice(0, 200), detail: r.detail(x, ev), citation: getCitation(r.key, country) });
  }
  return out;
}
