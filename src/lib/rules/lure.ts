import type { Extraction, Finding, IdentityMatch, DomainIntel, Severity } from "@/lib/check/types";

interface Ctx {
  x: Extraction;
  identity: IdentityMatch[];
  domains: DomainIntel[];
  community: number;
}

interface Rule {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  sourceId: string | null;
  test: (c: Ctx) => string | null;
}

const ABROAD = new Set(["Nigeria", "Kenya", "Uganda", "Ghana"]);
const SEA = ["Thailand", "Myanmar", "Cambodia", "Laos"];
const GULF = ["UAE", "Qatar", "Saudi Arabia", "Kuwait", "Oman", "Bahrain", "Lebanon", "Jordan"];
const LURE_TITLES = ["Customer service", "Chat support", "Data entry", "Translator", "Digital marketing", "Crypto trading", "IT", "Call centre", "Gaming", "Cabin crew", "Office admin"];

function usdEquivalent(amount: number, currency: string): number {
  // Rough conversions only used for thresholds, never displayed.
  const rate: Record<string, number> = { USD: 1, GBP: 1.3, EUR: 1.1, AED: 0.27, SAR: 0.27, QAR: 0.27, RUB: 0.011, NGN: 1 / 1550, KES: 1 / 130, UGX: 1 / 3700, GHS: 1 / 15.5 };
  return amount * (rate[currency] ?? 0);
}

export const LURE_RULES: Rule[] = [
  {
    id: "inactive_license",
    severity: "high",
    title: "Matched agency is not currently licensed",
    detail: "The register lists this agency as inactive, expired or revoked. Uganda alone revoked 275 licences in April 2026.",
    sourceId: "ug-mglsd-brokers",
    test: ({ identity }) => {
      const m = identity[0];
      return m && m.score >= 0.8 && ["inactive", "expired", "revoked"].includes(m.status) ? `${m.name} · ${m.status}` : null;
    },
  },
  {
    id: "impersonation",
    severity: "high",
    title: "Name is on file, contact is not",
    detail: "The organisation name matches a registered agency, but the phone number or email in this message is not the one on the register. Traffickers reuse licensed names with their own numbers.",
    sourceId: "ug-mglsd-brokers",
    test: ({ identity }) => {
      const m = identity[0];
      return m && m.contact === "mismatch" && m.score >= 0.8 ? `${m.name} · on-file contact differs` : null;
    },
  },
  {
    id: "fee_before_job",
    severity: "high",
    title: "Money is asked before any work",
    detail: "Genuine employers and licensed agencies do not charge a job seeker to apply, register, train, or be considered. A fee before work is the most common lure across all four countries.",
    sourceId: "ng-naptip-fake-jobs",
    test: ({ x }) => (x.feeAsks.length ? x.feeAsks[0].raw + " · " + (x.feeAsks[0].purpose ?? "fee") : x.signals.trainingBond ? null : x.signals.feeAsk),
  },
  {
    id: "deposit_before_interview",
    severity: "high",
    title: "Payment demanded before an interview or onboarding",
    detail: "A deposit tied to an interview, onboarding, or resumption date is a pressure tactic. Interviews are free.",
    sourceId: "ng-naptip-fake-jobs",
    test: ({ x }) => x.signals.depositBeforeInterview,
  },
  {
    id: "sea_scam_compound",
    severity: "high",
    title: "Matches the Thailand or Cambodia scam-compound lure",
    detail: "Kenya's Ministry of Foreign Affairs and Nigeria's NAPTIP describe the same pattern: a customer-service, chat, typing, marketing or IT job in Thailand, Cambodia, Myanmar or Laos, often with a free or one-way ticket. Victims end up in forced online-fraud compounds.",
    sourceId: "ke-myanmar-cambodia",
    test: ({ x }) => {
      const dest = x.destinations.filter((d) => SEA.includes(d));
      if (!dest.length) return null;
      const lureTitle = x.titles.some((t) => LURE_TITLES.includes(t));
      const lureWords = /online|remote|typing|chat|customer|marketing|casino|gaming|data|it |computer|translator/i.test(x.text);
      return lureTitle || lureWords || x.signals.oneWay ? `${dest.join(", ")} · ${x.titles.join(", ") || "online role"}` : `${dest.join(", ")} destination`;
    },
  },
  {
    id: "russia_factory",
    severity: "high",
    title: "Matches the Alabuga Start pattern",
    detail: "Recruitment of young Africans to Russia's Alabuga zone for a 'work and study' programme led to drone-factory labour under surveillance, with costs deducted from pay. Kenya, Uganda and Nigeria are named source countries.",
    sourceId: "alabuga-start",
    test: ({ x }) => (x.destinations.includes("Russia") && /alabuga|start|factory|program|vocational|work and study|study and work|drone|hostel|tatarstan|free (?:flight|ticket)|paid (?:flight|ticket)/i.test(x.text) ? "Russia · " + (x.text.match(/alabuga|factory|program(?:me)?|work and study|vocational/i)?.[0] ?? "programme") : null),
  },
  {
    id: "gulf_unlicensed",
    severity: "medium",
    title: "Gulf domestic or manual job with no licensed agency on file",
    detail: "Domestic and manual work in the Gulf must go through a licensed recruitment agency in Kenya, Uganda and Ghana. No matching agency appears in the registers.",
    sourceId: "ug-mglsd-brokers",
    test: ({ x, identity }) => {
      const dest = x.destinations.filter((d) => GULF.includes(d));
      if (!dest.length) return null;
      const manual = x.titles.includes("Manual or domestic work") || /housemaid|domestic|cleaner|driver|security|nanny|caregiver|factory|warehouse/i.test(x.text);
      const onFile = identity.some((m) => m.status === "active" && m.score >= 0.82);
      return manual && !onFile ? dest.join(", ") + " · no licensed agency matched" : null;
    },
  },
  {
    id: "one_way_ticket",
    severity: "medium",
    title: "Free or one-way travel offered",
    detail: "Kenyan survivors described being told the ticket was return when it was one-way. Free travel is the hook that makes the fee feel small.",
    sourceId: "ke-thailand-warning",
    test: ({ x }) => x.signals.oneWay,
  },
  {
    id: "lookalike_domain",
    severity: "high",
    title: "Domain looks like a registered agency's domain",
    detail: "One or two characters differ from a domain on the register. Lookalike domains are the standard way to borrow a real name.",
    sourceId: null,
    test: ({ domains }) => {
      const d = domains.find((i) => i.lookalikeOf);
      return d ? `${d.domain} vs ${d.lookalikeOf!.domain}` : null;
    },
  },
  {
    id: "young_domain",
    severity: "high",
    title: "Website domain is less than 90 days old",
    detail: "Registered recently, which fits a throwaway campaign rather than an established employer.",
    sourceId: null,
    test: ({ domains }) => {
      const d = domains.find((i) => i.ageDays !== null && i.ageDays < 90);
      return d ? `${d.domain} · ${d.ageDays} days old` : null;
    },
  },
  {
    id: "freemail_hr",
    severity: "medium",
    title: "Corporate role, free email address",
    detail: "A company that claims an HR department but writes from Gmail, Yahoo or Outlook cannot be verified by its email. Ask for a company-domain address.",
    sourceId: null,
    test: ({ x, domains }) => {
      const free = domains.filter((d) => d.freeMail).map((d) => d.domain);
      if (!free.length) return null;
      return /\bhr\b|human resource|recruit|talent|career|manager|company|ltd|limited|plc|group/i.test(x.text) ? free.join(", ") : null;
    },
  },
  {
    id: "telegram_only",
    severity: "medium",
    title: "Telegram is the only contact channel",
    detail: "No email, no website, only a Telegram handle. That is the contact pattern of task scams and compound recruiters.",
    sourceId: "ng-naptip-fake-jobs",
    test: ({ x }) => x.signals.telegramOnly,
  },
  {
    id: "task_job",
    severity: "medium",
    title: "Reads like a task or commission scam",
    detail: "Earn per task, like videos, boost products, paid in USDT: these start with small payouts and end with a deposit you never recover.",
    sourceId: "ng-naptip-fake-jobs",
    test: ({ x }) => x.signals.taskJob,
  },
  {
    id: "salary_too_high",
    severity: "medium",
    title: "Salary is far above the market for the role",
    detail: "Entry-level customer service or data entry abroad at this pay is the classic bait. Kenyan victims were shown 'Sh1 million to Sh2 million a month' adverts.",
    sourceId: "ke-thailand-warning",
    test: ({ x }) => {
      if (!x.salary) return null;
      const usd = usdEquivalent(x.salary.amount, x.salary.currency);
      const entry = x.titles.some((t) => ["Customer service", "Chat support", "Data entry", "Call centre", "Office admin", "Manual or domestic work"].includes(t)) || !!x.signals.noExperience;
      const abroad = x.destinations.some((d) => !ABROAD.has(d));
      if (entry && abroad && usd >= 1500) return `${x.salary.raw} for ${x.titles[0] ?? "an entry role"} abroad`;
      if (entry && !abroad && usd >= 1200) return `${x.salary.raw} for ${x.titles[0] ?? "an entry role"}`;
      return null;
    },
  },
  {
    id: "no_experience_abroad",
    severity: "medium",
    title: "No experience or interview needed for a job abroad",
    detail: "Legitimate overseas placements involve interviews, medicals and contracts before travel.",
    sourceId: "ke-thailand-warning",
    test: ({ x }) => (x.signals.noExperience && x.destinations.some((d) => !ABROAD.has(d)) ? x.signals.noExperience : null),
  },
  {
    id: "visa_guarantee",
    severity: "medium",
    title: "Guaranteed visa or guaranteed job",
    detail: "No agency can guarantee a visa. The guarantee is there to justify the fee.",
    sourceId: "gh-melr-list",
    test: ({ x }) => x.signals.visaGuarantee,
  },
  {
    id: "selected_without_applying",
    severity: "medium",
    title: "You were 'selected' without applying",
    detail: "Nigeria's most common variant: a message that you were selected for a government or company job, followed by a fee.",
    sourceId: "ng-naptip-fake-jobs",
    test: ({ x }) => x.signals.selected,
  },
  {
    id: "personal_data_early",
    severity: "medium",
    title: "Identity or bank details requested up front",
    detail: "BVN, NIN, passport scans or bank details before an interview enable identity fraud and loans in your name.",
    sourceId: null,
    test: ({ x }) => x.signals.personalData,
  },
  {
    id: "urgency",
    severity: "low",
    title: "Urgency pressure",
    detail: "Limited slots and deadlines measured in hours are designed to stop you checking.",
    sourceId: null,
    test: ({ x }) => x.signals.urgent,
  },
  {
    id: "community_reports",
    severity: "medium",
    title: "Reported by other people who ran a check",
    detail: "A contact in this message has been reported by other people who ran a check.",
    sourceId: null,
    test: ({ community }) => (community > 0 ? `${community} report${community === 1 ? "" : "s"}` : null),
  },
];

export function runLureRules(ctx: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const r of LURE_RULES) {
    let ev: string | null = null;
    try {
      ev = r.test(ctx);
    } catch {
      ev = null;
    }
    if (ev) out.push({ id: r.id, severity: r.severity, title: r.title, detail: r.detail, evidence: ev.slice(0, 160), sourceId: r.sourceId });
  }
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
