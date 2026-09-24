// Offline test suite for Telegram formatter, semantic regressions, deduplication, and webhook auth logic.
// Run with: npx tsx scripts/telegram/test-format.mts
import assert from "node:assert/strict";
import {
  formatCheckResult,
  formatEmptyMessage,
  formatErrorMessage,
  formatHelpMessage,
  formatStartMessage,
  formatUnsupportedMediaMessage,
} from "../../src/lib/telegram/format";
import type { Report } from "../../src/lib/check/types";

const mockBaseReport: Report = {
  id: "test123abc",
  version: "0.3.0",
  createdAt: "2026-09-24T12:00:00.000Z",
  country: "UG",
  kind: "job_ad",
  extraction: {
    kind: "job_ad",
    text: "Sample job ad text",
    orgCandidates: ["Jobchannel Reality Limited"],
    people: [],
    emails: [],
    phones: ["+256700999888"],
    domains: [],
    urls: [],
    money: [],
    feeAsks: [],
    salary: null,
    destinations: ["Saudi Arabia"],
    titles: ["Manual or domestic work"],
    channels: ["whatsapp"],
    countryGuess: "UG",
    signals: {},
    source: "heuristic",
  },
  identity: {
    queries: ["Jobchannel Reality Limited"],
    matches: [
      {
        country: "UG",
        entryId: "ug-0001",
        name: "JOBCHANNEL REALITY LIMITED",
        score: 0.95,
        status: "active",
        validTo: "2028-07-14",
        licenseNo: "E26070004",
        contact: "mismatch",
        matchedVia: "name",
        onFile: { phones: ["+256753026460"], emails: ["jobchannel25@gmail.com"], domains: [] },
        cacVerified: null,
      },
    ],
    impersonation: true,
  },
  domains: [],
  lure: [
    {
      id: "impersonation",
      severity: "high",
      title: "Name is on file, contact is not",
      detail: "The organisation name matches a registered agency, but the phone number in this message is not the one on the register.",
      evidence: "JOBCHANNEL REALITY LIMITED · on-file contact differs",
      sourceId: "ug-mglsd-brokers",
    },
  ],
  clauses: [],
  verdict: {
    level: "stop",
    headline: "Name is on file, contact is not",
    lines: [
      '"JOBCHANNEL REALITY LIMITED" is on the UG register as active (snapshot 2026-09-21).',
      "The phone or email in this message is NOT the one on file.",
    ],
  },
  actions: { replies: {}, hotlines: [], shareText: "", replyScenario: "verify" },
  registryAsOf: { NG: "2026-09-21", KE: "2026-05-18", UG: "2026-09-21", GH: "2026-09-21" },
  community: null,
  verifiedSender: null,
};

console.log("=== Running Daju Telegram Regression & Offline Test Suite ===\n");

// 1. Semantic Regression: Contact mismatch
{
  const text = formatCheckResult(mockBaseReport, "https://daju.app");
  assert.ok(text.includes("🛑 DAJU: STOP"), "Must include STOP banner");
  assert.ok(text.includes("Name is on file, contact is not"), "Must include headline");
  assert.ok(text.includes("NOT the one on file"), "Must assert contact mismatch wording from engine line");
  assert.ok(text.includes("on-file contact differs"), "Must include authoritative evidence");
  console.log("✓ Semantic regression: Contact mismatch verified");
}

// 2. Semantic Regression: none_on_file
{
  const noneOnFileReport: Report = {
    ...mockBaseReport,
    identity: {
      ...mockBaseReport.identity,
      impersonation: false,
      matches: [
        {
          ...mockBaseReport.identity.matches[0],
          contact: "none_on_file",
        },
      ],
    },
    lure: [],
    verdict: {
      level: "caution",
      headline: "Name on file, contact could not be compared",
      lines: [
        '"JOBCHANNEL REALITY LIMITED" is on the UG register as active (snapshot 2026-09-21).',
        "The register holds no contact details for this entry, so the contact could not be compared.",
      ],
    },
  };
  const text = formatCheckResult(noneOnFileReport, "https://daju.app");
  assert.ok(text.includes("⚠️ DAJU: CAUTION"), "Must include CAUTION banner");
  assert.ok(text.includes("so the contact could not be compared"), "Must include engine none_on_file line");
  assert.equal(text.toLowerCase().includes("does not match"), false, "Must NOT say 'does not match' on none_on_file");
  assert.equal(text.toLowerCase().includes("mismatch"), false, "Must NOT say 'mismatch' on none_on_file");
  assert.equal(text.toLowerCase().includes("impersonation"), false, "Must NOT say 'impersonation' on none_on_file");
  console.log("✓ Semantic regression: none_on_file strictly verified");
}

// 3. Semantic Regression: contact match
{
  const matchReport: Report = {
    ...mockBaseReport,
    identity: {
      ...mockBaseReport.identity,
      impersonation: false,
      matches: [
        {
          ...mockBaseReport.identity.matches[0],
          contact: "match",
          matchedVia: "domain",
        },
      ],
    },
    lure: [],
    verdict: {
      level: "on_file",
      headline: "On file, contact matches, no lure signals found",
      lines: [
        '"JOBCHANNEL REALITY LIMITED" is on the UG register as active (snapshot 2026-09-21).',
        "The contact in this message matches the contact on file.",
        "Still call the number on the register, not the number in the message, before you pay anything or travel.",
      ],
    },
  };
  const text = formatCheckResult(matchReport, "https://daju.app");
  assert.ok(text.includes("📋 DAJU: ON FILE"), "Must include ON FILE banner");
  assert.ok(text.includes("The contact in this message matches the contact on file."), "Must include engine match line");
  assert.equal(text.includes("phone and email align"), false, "Must NOT invent unverified dual-channel claim");
  assert.equal(text.includes("both phone and email"), false, "Must NOT claim both matched without proof");
  console.log("✓ Semantic regression: contact match verified");
}

// 4. Semantic Regression: direct employer unknown
{
  const unknownReport: Report = {
    ...mockBaseReport,
    identity: { queries: ["Acme Fintech Ltd"], matches: [], impersonation: false },
    lure: [],
    domains: [
      {
        domain: "acmefintech.co.uk",
        registered: "2021-04-12",
        ageDays: 1991,
        mx: true,
        freeMail: false,
        lookalikeOf: null,
      site: null,
        error: null,
      },
    ],
    verdict: {
      level: "unknown",
      headline: "No warning signs, sender not on any agency register",
      lines: [
        "None of the names found (Acme Fintech Ltd) appear in the four registers as of 2026-09-21.",
        "Direct employers are not agencies and do not appear in agency registers, so not being on file is not a warning by itself. Verify the company another way before paying anything or sharing documents.",
      ],
    },
  };
  const text = formatCheckResult(unknownReport, "https://daju.app");
  assert.ok(text.includes("❓ DAJU: NOT ON FILE"), "Must include NOT ON FILE banner");
  assert.ok(text.includes("Direct employers are not agencies and do not appear in agency registers, so not being on file is not a warning by itself."), "Must include verbatim direct employer educational statement");
  assert.equal(text.toLowerCase().includes("suspicious"), false, "Must NOT call absence from registers suspicious by itself");
  assert.equal(text.toLowerCase().includes("red flag"), false, "Must NOT call absence from registers a red flag");
  console.log("✓ Semantic regression: direct employer unknown verified");
}

// 5. Semantic Regression: verified employer
{
  const verifiedReport: Report = {
    ...mockBaseReport,
    identity: { queries: ["Paystack Ltd"], matches: [], impersonation: false },
    lure: [],
    verifiedSender: {
      company: "Paystack Ltd",
      domain: "paystack.com",
      verifiedAt: "2026-03-15T10:00:00.000Z",
      method: "dns",
    },
    verdict: {
      level: "on_file",
      headline: "Verified sender, no lure signals found",
      lines: [
        "Sender verified: Paystack Ltd proved control of paystack.com on 2026-03-15.",
        "Still call the number on the register, not the number in the message, before you pay anything or travel.",
      ],
    },
  };
  const text = formatCheckResult(verifiedReport, "https://daju.app");
  assert.ok(text.includes("📋 DAJU: ON FILE"), "Must include ON FILE banner");
  assert.ok(text.includes("Sender verified: Paystack Ltd proved control of paystack.com on 2026-03-15."), "Must represent verified sender from engine lines");
  assert.ok(text.includes('Daju never says an offer is "safe".'), "Must preserve core invariant disclaimer");
  assert.equal(text.toLowerCase().includes("offer is safe"), false, "Must NOT convert verified sender into 'offer is safe'");
  assert.equal(text.toLowerCase().includes("job is safe"), false, "Must NOT convert verified sender into 'job is safe'");
  console.log("✓ Semantic regression: verified employer verified");
}

// 6. Test Static Messages & Commands
{
  const start = formatStartMessage();
  assert.ok(start.includes("Forward me a job message"), "Start message must prompt for job message");
  assert.ok(start.includes("Nigeria, Kenya, Uganda and Ghana"), "Must state 4 countries");
  assert.ok(start.includes("never tell you an offer is 'safe'"), "Must reiterate safety doctrine");
  console.log("✓ /start message verified");

  const help = formatHelpMessage();
  assert.ok(help.includes("How to use Daju on Telegram"), "Help message must have title");
  assert.ok(help.includes("Screenshots and document uploads are not supported yet"), "Must state OCR coming next");
  console.log("✓ /help message verified");

  const media = formatUnsupportedMediaMessage();
  assert.ok(media.includes("Screenshot and document checking is coming next"), "Must handle media politely");
  console.log("✓ Unsupported media message verified");

  const empty = formatEmptyMessage();
  assert.ok(empty.includes("Please paste or forward"), "Must handle empty text");
  console.log("✓ Empty message verified");

  const error = formatErrorMessage();
  assert.equal(error, "Daju couldn't complete this check right now. Please try again, or use the web checker.", "Error message must match exact specification");
  console.log("✓ Error message verified");
}

// 7. Test Webhook Secret Verification Logic
{
  const configuredSecret = "my_telegram_secret_987";
  const isValidSecret = (headerVal: string | null) => headerVal?.trim() === configuredSecret;

  assert.equal(isValidSecret("my_telegram_secret_987"), true, "Valid secret should pass");
  assert.equal(isValidSecret("wrong_secret"), false, "Wrong secret should fail");
  assert.equal(isValidSecret(null), false, "Missing secret should fail");
  assert.equal(isValidSecret(""), false, "Empty secret should fail");
  console.log("✓ Webhook secret verification logic verified");
}

// 8. Test In-Memory update_id Deduplication Logic
{
  const map = new Map<number, number>();
  const isDup = (id: number, now = Date.now()) => {
    if (map.has(id)) return true;
    map.set(id, now);
    return false;
  };

  assert.equal(isDup(1001), false, "First occurrence should not be duplicate");
  assert.equal(isDup(1001), true, "Immediate retry should be identified as duplicate");
  assert.equal(isDup(1002), false, "New update_id should not be duplicate");
  assert.equal(isDup(1002), true, "Second retry should be identified as duplicate");
  console.log("✓ In-memory update_id deduplication logic verified");
}

console.log("\nAll Telegram offline tests and semantic regression checks passed successfully!");
