import type { Report } from "./types";
import { BRAND } from "@/lib/brand";

export type ReplyScenario = "fee" | "verify" | "bond" | "decline" | "abroad" | "proceed";

export const REPLY_LANGS: { code: string; label: string; native: string; llm: boolean }[] = [
  { code: "en", label: "English", native: "English", llm: false },
  { code: "pcm", label: "Pidgin", native: "Naijá", llm: false },
  { code: "ig", label: "Igbo", native: "Igbo", llm: true },
  { code: "yo", label: "Yoruba", native: "Yorùbá", llm: true },
  { code: "ha", label: "Hausa", native: "Hausa", llm: true },
  { code: "sw", label: "Swahili", native: "Kiswahili", llm: true },
  { code: "lg", label: "Luganda", native: "Luganda", llm: true },
  { code: "tw", label: "Twi", native: "Twi", llm: true },
];

export function pickScenario(r: Pick<Report, "lure" | "clauses" | "identity" | "extraction">): ReplyScenario {
  const ids = new Set(r.lure.map((f) => f.id));
  if (ids.has("fee_before_job") || ids.has("deposit_before_interview") || ids.has("task_job")) return "fee";
  if (ids.has("sea_scam_compound") || ids.has("russia_factory") || ids.has("gulf_unlicensed")) return "abroad";
  if (r.clauses.some((c) => c.key === "training_bond" || c.key === "certificates")) return "bond";
  if (ids.has("impersonation") || ids.has("inactive_license") || ids.has("lookalike_domain") || ids.has("young_domain") || ids.has("freemail_hr")) return "verify";
  if (r.lure.length === 0 && r.clauses.length === 0) return "proceed";
  return "verify";
}

const EN: Record<ReplyScenario, (r: Report) => string> = {
  fee: (r) => `Thank you for the message. I do not pay any fee, deposit or registration charge to be considered for a job, and licensed agencies in ${countryName(r)} are not allowed to charge job seekers. If the role is genuine, please send the company's registered name, office address and a company-domain email, and I will confirm it with the ${registryShort(r)} register before we continue.`,
  verify: (r) => `Thank you for reaching out. Before I go further, I need to confirm this offer with the organisation directly. Please share the agency's ${registryShort(r)} registration or licence number, the office address, and an email on the company's own domain. I will also call the number listed on the official register. I do not share my ID documents or bank details until that is done.`,
  bond: () => `Thank you for the offer. Before I sign, I need clarity on two clauses. Please confirm in writing the exact training cost behind the bond, its duration, and how it reduces over time. I will provide certified copies of my certificates but will keep the originals. I would like an amended letter reflecting this.`,
  decline: () => `Thank you, but I will not be proceeding with this opportunity. Please remove my details from your list.`,
  abroad: (r) => `Thank you for the offer. Before I consider any job outside ${countryName(r)}, I need: the employer's registered name and address in the destination country, the recruitment agency's licence number on the ${registryShort(r)} register, a written contract in advance, and confirmation that I pay nothing before travel. I will verify all of it with the authority before I reply.`,
  proceed: () => `Thank you for reaching out. I am interested. Could you share the role description, the interview format and date, and the name of the person I will meet, in writing? I will confirm from my side once I have those.`,
};

const PCM: Record<ReplyScenario, (r: Report) => string> = {
  fee: (r) => `Thanks for the message. I no dey pay any fee, deposit or registration money to get work, and licensed agency for ${countryName(r)} no suppose collect money from person wey dey find job. If the work na real one, abeg send the company registered name, office address and email wey carry the company domain. I go check am for the ${registryShort(r)} register before we continue.`,
  verify: (r) => `Thanks for reaching out. Before I continue, I need to confirm this offer with the organisation direct. Abeg send the agency ${registryShort(r)} licence number, the office address, and email wey carry the company domain. I go still call the number wey dey on the official register. I no go send my ID or bank details until I don confirm.`,
  bond: () => `Thanks for the offer. Before I sign, I need two things clear. Abeg write down the exact training cost wey the bond dey cover, how long e go last, and how e go reduce with time. I go give certified copy of my certificates but I go keep the original. Make una send me a corrected letter.`,
  decline: () => `Thanks, but I no go continue with this one. Abeg remove my details from una list.`,
  abroad: (r) => `Thanks for the offer. Before I consider any work outside ${countryName(r)}, I need: the employer registered name and address for the country, the agency licence number on the ${registryShort(r)} register, a written contract before I travel, and confirmation say I no go pay anything before I travel. I go verify everything with the authority before I reply.`,
  proceed: () => `Thanks for reaching out. I dey interested. Abeg send the role description, the interview format and date, and the name of the person wey I go meet, in writing. I go confirm from my side once I get am.`,
};

function countryName(r: Report): string {
  return { NG: "Nigeria", KE: "Kenya", UG: "Uganda", GH: "Ghana" }[r.country];
}
function registryShort(r: Report): string {
  return { NG: "NELEX", KE: "NEA", UG: "EEMIS", GH: "Labour Department" }[r.country];
}

export function staticReplies(r: Report, scenario: ReplyScenario): Record<string, string> {
  return { en: EN[scenario](r), pcm: PCM[scenario](r) };
}

export function shareText(r: Report, url: string): string {
  const level = { stop: "STOP", caution: "CAUTION", on_file: "ON FILE", unknown: "NOT ON FILE" }[r.verdict.level];
  const top = r.lure[0]?.title ? ` ${r.lure[0].title}.` : "";
  return `${BRAND.name} check: ${level}. ${r.verdict.headline}${top} Full card: ${url}`;
}
