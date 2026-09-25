// Smoke test for the pure extraction + lure rule layer.
// Run with: pnpm tsx scripts/smoke-check.mts (or ./node_modules/.bin/tsx scripts/smoke-check.mts if pnpm pre-checks get in the way)
// Only pure modules are imported here; engine.ts and the store pull in "server-only", which throws outside Next.
import { extractHeuristic } from "../src/lib/extract/heuristics";
import { runLureRules } from "../src/lib/rules/lure";
import { runClauseRules } from "../src/lib/rules/clauses";
import { normPhone } from "../src/lib/registry/match";

const CASES: { label: string; text: string }[] = [
  {
    label: "a) Thailand customer-service ad (KE)",
    text: "URGENT HIRING!! Customer service representatives needed in Bangkok, Thailand. Salary $1,500 monthly + accommodation. No experience needed, we train you. Free flight ticket! Processing fee of Ksh 25,000 for visa only. Contact Mercy on WhatsApp +254 712 345 678 or Telegram @mercyjobs. Limited slots, apply today!",
  },
  {
    label: "b) Lagos offer letter with bond, unpaid probation, retained certificates",
    text: `Dear Candidate,

Zenith Consult Nigeria Ltd is pleased to offer you the position of Business Development Officer at our Lagos office, reporting to the Head of Operations. Your gross monthly salary shall be N150,000. Kindly confirm acceptance by replying to hr.zenithconsult@gmail.com within 48 hours. Please note that you will be bonded for a period of 2 years, on resignation you shall pay the sum of N3,000,000 as liquidated damages.

The first 6 months of probation shall be unpaid. On resumption, original certificates shall be submitted to HR and retained for the duration of the bond. Please sign and return a copy of this letter.

Yours faithfully,
Human Resources`,
  },
  {
    label: "c) Legitimate-looking Nigerian agency message",
    text: "Good day, this is Adaeze from Worknigeria.com Limited. We are recruiting for a client. Please send your CV to careers@worknigeria.com. No fees required. You can also reach me on +234 803 000 0000.",
  },
  {
    label: "d) Russia Alabuga Start style ad",
    text: "Alabuga Start programme in Russia! Work and study, free flight, hostel, salary 700 USD, ages 18-22, apply now via Telegram",
  },
  {
    label: "e) Plain UK remote developer job",
    text: "Acme Fintech Ltd is hiring a remote React developer. Apply at careers@acmefintech.co.uk. Salary GBP 55,000 per year.",
  },
];

function line(k: string, v: unknown) {
  const s = Array.isArray(v) ? (v.length ? v.join(" | ") : "(none)") : String(v ?? "(none)");
  console.log(`  ${k.padEnd(14)} ${s}`);
}

for (const c of CASES) {
  const x = extractHeuristic(c.text);
  const findings = runLureRules({ x, identity: [], domains: [], community: 0 });
  console.log(`\n=== ${c.label} ===`);
  line("kind", x.kind);
  line("country", x.countryGuess);
  line("orgCandidates", x.orgCandidates);
  line("people", x.people);
  line("phones", x.phones);
  line("emails", x.emails);
  line("domains", x.domains);
  line("destinations", x.destinations);
  line("titles", x.titles);
  line("channels", x.channels);
  line("feeAsks", x.feeAsks.map((f) => `${f.raw} [${f.purpose}] ctx="${f.context.slice(0, 60)}"`));
  line("salary", x.salary ? `${x.salary.raw} (${x.salary.currency} ${x.salary.amount})` : null);
  line("money", x.money.map((m) => `${m.raw}=${m.currency} ${m.amount}${m.purpose ? " [" + m.purpose + "]" : ""}`));
  const sig = Object.entries(x.signals).filter(([, v]) => v).map(([k, v]) => `${k}="${String(v).slice(0, 50)}"`);
  line("signals", sig);
  line("findings", findings.map((f) => `${f.id} (${f.severity})`));
  for (const f of findings) console.log(`      - ${f.id}: ${f.evidence}`);
}

console.log("\n=== normPhone sanity ===");
for (const p of ["+254 712 345 678", "0803 000 0000", "0712345678", "+234 803 000 0000"]) console.log(`  ${p.padEnd(20)} -> ${normPhone(p)}`);


// Clause audit on the Lagos bond letter: the path judges will ask about.
{
  const letter = `ZENITH CONSULT NIGERIA LTD
OFFER OF EMPLOYMENT

Dear Chinedu,

We are pleased to offer you the position of Business Development Executive at a gross salary of N150,000 per month. Your probationary period shall be six (6) months, during which the first three months shall be unpaid training. You will be bonded for a period of 2 years; on resignation before the end of this period you shall pay the sum of N3,000,000 as liquidated damages. Your original certificates shall be submitted to HR and retained for the duration of the bond. The company may terminate this contract at any time without notice.

Kindly confirm acceptance by replying to hr.zenithconsult@gmail.com.`;
  const x = extractHeuristic(letter, { hint: "NG" });
  const clauses = runClauseRules(x, "NG");
  console.log("\n=== clause audit (NG offer letter) ===");
  for (const c of clauses) console.log(`  ${c.severity.padEnd(6)} ${c.key.padEnd(14)} ${c.citation ? `${c.citation.act}, ${c.citation.section} [${c.citation.confidence}]` : "no citation"}`);
  if (clauses.length < 3) { console.error("Expected at least 3 clause findings"); process.exit(1); }
}

{
  // A job description names departments and platforms, not an agency. None of these may become a register query.
  const jd = `Digital Media Lead. Location: Chevron, Lekki, Lagos, Nigeria. Collaborate closely with Creative, Strategy, and Account Management teams.
Ensure accurate budget reconciliation and billing in coordination with Finance
KEY SKILLS & COMPETENCY REQUIRED
Deep, hands-on expertise with Meta Ads Manager, Google Ads and TikTok Ads Manager.
Curate and publish engaging digital content for BrandEye & DigiBreed.
Interested candidates should forward their resume to info@brandeyemedia.com`;
  const x = extractHeuristic(jd, { hint: "NG" });
  console.log("\n=== organisation candidates (job description) ===");
  console.log("  " + JSON.stringify(x.orgCandidates));
  const banned = x.orgCandidates.filter((o) => /^(creative|finance|media agency|meta ads manager)$/i.test(o) || /KEY SKILLS/.test(o) || /lekki|chevron/i.test(o));
  if (banned.length) { console.error("Generic or place candidates leaked: " + JSON.stringify(banned)); process.exit(1); }
  if (!x.orgCandidates.some((o) => /brandeye/i.test(o))) { console.error("Expected BrandEye among the candidates"); process.exit(1); }
}
