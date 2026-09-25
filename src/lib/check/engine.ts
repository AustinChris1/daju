import "server-only";
import { randomBytes } from "node:crypto";
import type { Country } from "@/lib/countries";
import { COUNTRY_CODES, isCountry } from "@/lib/countries";
import { extractHeuristic } from "@/lib/extract/heuristics";
import { refineWithClaude } from "@/lib/extract/llm";
import { findByDomain, findByEmail, findByPhone, namedInText, searchByName, snapshot } from "@/lib/registry/load";
import { domainOf, isFreeMail, normPhone, phoneTail } from "@/lib/registry/match";
import { domainIntel } from "@/lib/intel/domain";
import { runLureRules } from "@/lib/rules/lure";
import { runClauseRules } from "@/lib/rules/clauses";
import { getHotlines } from "@/lib/law";
import { getStore } from "@/lib/store";
import { pickScenario, shareText, staticReplies } from "./replies";
import type { CheckInput, ContactMatch, Extraction, IdentityMatch, Report, VerdictLevel } from "./types";
import type { RegistryEntry } from "@/lib/registry/types";

export const ENGINE_VERSION = "0.3.0";

export function shortId(n = 10): string {
  return randomBytes(16).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, n);
}

async function fetchPageText(url: string): Promise<string> {
  const u = new URL(url.startsWith("http") ? url : "https://" + url);
  if (!/^https?:$/.test(u.protocol)) throw new Error("unsupported protocol");
  const host = u.hostname;
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[::1\])/.test(host) || !host.includes(".")) throw new Error("blocked host");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(u.toString(), { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; DajuCheck/1.0)" } });
    const html = (await res.text()).slice(0, 600_000);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/h\d>|<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();
    return text.slice(0, 20000);
  } finally {
    clearTimeout(t);
  }
}

function contactMatch(entry: RegistryEntry, x: Extraction, country: Country): ContactMatch {
  const onFilePhones = new Set(entry.phones.map((p) => phoneTail(normPhone(p, country))).filter((t) => t.length >= 7));
  const onFileEmails = new Set(entry.emails.map((e) => e.toLowerCase()));
  const onFileDomains = new Set(entry.domains.map((d) => d.toLowerCase()).filter((d) => !isFreeMail(d)));
  const inputDomains = x.domains.filter((d) => !isFreeMail(d));
  const provided = x.phones.length + x.emails.length + x.domains.length > 0;
  if (!provided) return "not_provided";
  // Compare only channels both sides have; a phone-only message cannot contradict an email-only record.
  let comparable = 0;
  if (x.phones.length && onFilePhones.size) {
    comparable++;
    if (x.phones.some((p) => onFilePhones.has(phoneTail(p)))) return "match";
  }
  if (x.emails.length && onFileEmails.size) {
    comparable++;
    if (x.emails.some((e) => onFileEmails.has(e))) return "match";
  }
  if (inputDomains.length && onFileDomains.size) {
    comparable++;
    if (inputDomains.some((d) => onFileDomains.has(d))) return "match";
  }
  return comparable ? "mismatch" : "none_on_file";
}

function toMatch(country: Country, entry: RegistryEntry, score: number, via: IdentityMatch["matchedVia"], x: Extraction): IdentityMatch {
  return {
    country,
    entryId: entry.id,
    name: entry.name,
    score: Math.round(score * 100) / 100,
    status: entry.status,
    validTo: entry.valid_to,
    licenseNo: entry.license_no,
    contact: contactMatch(entry, x, country),
    matchedVia: via,
    onFile: { phones: entry.phones, emails: entry.emails, domains: entry.domains },
    cacVerified: entry.cac_verified,
  };
}

function resolveIdentity(x: Extraction, preferred: Country) {
  const queries = [...x.orgCandidates];
  const seen = new Set<string>();
  const matches: IdentityMatch[] = [];
  const add = (m: IdentityMatch) => {
    const k = m.country + ":" + m.entryId;
    if (seen.has(k)) return;
    seen.add(k);
    matches.push(m);
  };
  for (const p of x.phones) for (const h of findByPhone(p)) add(toMatch(h.country, h.entry, 1, "phone", x));
  for (const e of x.emails) for (const h of findByEmail(e)) add(toMatch(h.country, h.entry, 1, "email", x));
  for (const d of x.domains) if (!isFreeMail(d)) for (const h of findByDomain(d)) add(toMatch(h.country, h.entry, 1, "domain", x));
  for (const q of queries) {
    const order: Country[] = [preferred, ...COUNTRY_CODES.filter((c) => c !== preferred)];
    const hits = searchByName(q, { countries: order, limit: 4, min: 0.66 });
    for (const h of hits) add(toMatch(h.country, h.entry, h.score, "name", x));
  }
  matches.sort((a, b) => b.score - a.score || (a.country === preferred ? -1 : 1));
  // Impersonation needs the register name itself in the message, not a fuzzy hit on a shared word.
  const top = matches[0];
  const impersonation = !!top && top.score >= 0.8 && top.contact === "mismatch" && (top.matchedVia !== "name" || namedInText(top.name, x.text));
  return { queries, matches: matches.slice(0, 6), impersonation };
}

function verdictFor(r: Pick<Report, "lure" | "clauses" | "identity" | "country" | "extraction" | "registryAsOf" | "verifiedSender" | "domains">): Report["verdict"] {
  const high = r.lure.filter((f) => f.severity === "high");
  const medium = r.lure.filter((f) => f.severity === "medium");
  const strong = r.identity.matches.find((m) => m.score >= 0.82);
  const asOf = r.registryAsOf[r.country];
  const lines: string[] = [];
  let level: VerdictLevel;
  let headline: string;

  if (r.verifiedSender) {
    lines.push(`Sender verified: ${r.verifiedSender.company} proved control of ${r.verifiedSender.domain} on ${r.verifiedSender.verifiedAt.slice(0, 10)}.`);
  }
  if (strong) {
    const c = strong.contact;
    lines.push(`"${strong.name}" is on the ${strong.country} register as ${strong.status} (snapshot ${r.registryAsOf[strong.country]}).`);
    if (c === "match") lines.push("The contact in this message matches the contact on file.");
    if (c === "mismatch") lines.push("The phone or email in this message is NOT the one on file.");
    if (c === "none_on_file") {
      const onFile = [...strong.onFile.phones, ...strong.onFile.emails];
      const inputHasPhoneOnly = r.extraction.phones.length > 0 && r.extraction.emails.length === 0;
      if (inputHasPhoneOnly && strong.onFile.phones.length === 0 && onFile.length) {
        lines.push(`The ${strong.country} register publishes no phone number for this agency, so the WhatsApp number in the message cannot be checked. On file: ${onFile.slice(0, 2).join(", ")}. Write to that address, or call the registry, not the number in the message.`);
      } else if (onFile.length) {
        lines.push(`The register holds ${onFile.slice(0, 2).join(", ")} for this entry, which the message does not use, so the contact could not be compared.`);
      } else {
        lines.push("The register holds no contact details for this entry, so the contact could not be compared.");
      }
    }
    if (c === "not_provided") lines.push("No phone, email or website was in the text, so nothing could be compared to the record.");
  } else if (r.identity.matches.length) {
    lines.push(`Closest register entry is "${r.identity.matches[0].name}" (${r.identity.matches[0].country}), a partial match only.`);
  } else if (r.identity.queries.length) {
    lines.push(`None of the names found (${r.identity.queries.slice(0, 3).join(", ")}) appear in the four registers as of ${asOf}.`);
  } else {
    lines.push("No organisation name could be read from the text, so no register lookup was possible.");
  }

  if (high.length || r.clauses.some((c) => c.severity === "high" && c.key === "certificates")) {
    level = "stop";
    headline = high[0]?.title ?? "Serious clause in this offer";
  } else if (medium.length >= 2 || r.clauses.some((c) => c.severity === "high")) {
    level = "caution";
    headline = medium[0]?.title ?? r.clauses[0]?.label ?? "Several signals need checking";
  } else if (medium.length === 1) {
    level = "caution";
    headline = medium[0].title;
  } else if (r.verifiedSender) {
    level = "on_file";
    headline = "Verified sender, no lure signals found";
  } else if (strong && strong.status === "active" && strong.contact === "match") {
    level = "on_file";
    headline = "On file, contact matches, no lure signals found";
  } else if (strong && strong.status === "active") {
    level = "caution";
    headline = strong.contact === "mismatch" ? "Name on file, contact not on file" : "Name on file, contact could not be compared";
  } else {
    level = "unknown";
    const established = r.domains.find((d) => !d.freeMail && d.ageDays !== null && d.ageDays >= 365);
    const live = r.domains.find((d) => !d.freeMail && d.site?.reachable && !d.site.parked);
    if (established) {
      const years = Math.floor(established.ageDays! / 365);
      const siteNote = live && live.domain === established.domain ? (live.site?.mentionsName ? ", and its website names the company" : ", and its website is live") : "";
      headline = `No warning signs; ${established.domain} has been registered for ${years} year${years === 1 ? "" : "s"}${siteNote}`;
    } else if (live) {
      headline = `No warning signs; ${live.domain} has a live website${live.site?.mentionsName ? " that names the company" : ""}`;
    } else {
      headline = r.extraction.kind === "offer_letter" ? "No warning signs, sender not on any agency register" : "No warning signs, sender not on any agency register";
    }
  }

  if (level === "unknown") lines.push("Direct employers are not agencies and do not appear in agency registers, so not being on file is not a warning by itself. Verify the company another way before paying anything or sharing documents.");
  if (level === "on_file") lines.push("Still call the number on the register, not the number in the message, before you pay anything or travel.");
  return { level, headline, lines };
}

export async function runCheck(input: CheckInput): Promise<Report> {
  const store = getStore();
  const hint = isCountry(input.country) ? input.country : null;
  let text = (input.text ?? "").trim();
  let hasUrlOnly = false;
  const parts: string[] = [];
  if (input.name) parts.push(`Company: ${input.name}`);
  if (input.email) parts.push(`Email: ${input.email}`);
  if (input.phone) parts.push(`Phone: ${input.phone}`);
  if (input.url) {
    const url = input.url.trim();
    try {
      const page = await fetchPageText(url);
      text = [text, `Source: ${url}`, page].filter(Boolean).join("\n");
    } catch {
      text = [text, `Source: ${url}`].filter(Boolean).join("\n");
      hasUrlOnly = !input.text;
    }
  }
  if (parts.length) text = [parts.join("\n"), text].filter(Boolean).join("\n");
  if (!text) throw new Error("Nothing to check");

  const x = extractHeuristic(text, { hint, hasUrlOnly });
  const refined = text.length > 60 ? await refineWithClaude(text) : null;
  if (refined) {
    x.source = "heuristic+llm";
    if (refined.organisation && !x.orgCandidates.some((o) => o.toLowerCase() === refined.organisation!.toLowerCase())) x.orgCandidates.unshift(refined.organisation);
    if (refined.recruiter_name && !x.people.includes(refined.recruiter_name)) x.people.unshift(refined.recruiter_name);
    if (refined.is_offer_letter && x.kind !== "offer_letter") x.kind = "offer_letter";
    if (refined.job_title && !x.titles.length) x.titles.push(refined.job_title);
    if (refined.destination_country && !x.destinations.includes(refined.destination_country)) x.destinations.push(refined.destination_country);
    if (refined.fee_requested?.amount && !x.feeAsks.length) {
      const fee = { amount: refined.fee_requested.amount, currency: refined.fee_requested.currency ?? "", raw: `${refined.fee_requested.currency ?? ""} ${refined.fee_requested.amount}`.trim(), context: refined.fee_requested.purpose ?? "", purpose: refined.fee_requested.purpose ?? "fee" };
      x.feeAsks.push(fee);
      x.money.push(fee);
    }
    if (refined.salary?.amount && !x.salary) x.salary = { amount: refined.salary.amount, currency: refined.salary.currency ?? "", raw: `${refined.salary.currency ?? ""} ${refined.salary.amount}`.trim(), context: refined.salary.period ?? "", purpose: "salary" };
    x.signals.summary = refined.one_line_summary;
  }

  const country: Country = hint ?? x.countryGuess ?? "NG";
  const identity = resolveIdentity(x, country);
  const domains = await Promise.all(x.domains.slice(0, 5).map((d) => domainIntel(d, x.orgCandidates)));

  let verifiedSender: Report["verifiedSender"] = null;
  const offerToken = input.offerToken ?? text.match(/\/o\/([A-Za-z0-9_-]{8,})/)?.[1] ?? null;
  if (offerToken) {
    const offer = await store.getOffer(offerToken);
    if (offer && offer.employer.verified_at) {
      verifiedSender = { company: offer.employer.company, domain: offer.employer.domain, verifiedAt: offer.employer.verified_at, method: offer.employer.method ?? "dns" };
      await store.bumpOfferViews(offerToken);
    }
  }
  if (!verifiedSender) {
    for (const d of x.domains) {
      const emp = await store.getEmployerByDomain(d);
      if (emp?.verified_at && x.emails.some((e) => domainOf(e) === d)) {
        verifiedSender = { company: emp.company, domain: emp.domain, verifiedAt: emp.verified_at, method: emp.method ?? "dns" };
        break;
      }
    }
  }

  const community = await store.countReports([...x.phones, ...x.emails, ...x.domains]);
  const lure = runLureRules({ x, identity: identity.matches, domains, community });
  const clauses = runClauseRules(x, country);
  const registryAsOf = Object.fromEntries(COUNTRY_CODES.map((c) => [c, snapshot(c).as_of])) as Record<Country, string>;

  const id = shortId();
  const base: Omit<Report, "verdict" | "actions"> = {
    id,
    version: ENGINE_VERSION,
    createdAt: new Date().toISOString(),
    country,
    kind: x.kind,
    extraction: { ...x, text: x.text.slice(0, 6000) },
    identity,
    domains,
    lure,
    clauses,
    registryAsOf,
    community: community ? { reports: community } : null,
    verifiedSender,
  };
  const verdict = verdictFor(base);
  const draft = { ...base, verdict, actions: { replies: {}, hotlines: [], shareText: "", replyScenario: "" } } as Report;
  const scenario = pickScenario(draft);
  const replies = staticReplies(draft, scenario);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const report: Report = { ...draft, actions: { replies, hotlines: getHotlines(country), shareText: shareText(draft, `${siteUrl}/c/${id}`), replyScenario: scenario } };
  try {
    await store.saveCheck({ id, created_at: report.createdAt, country, kind: x.kind, level: verdict.level, report });
  } catch (err) {
    // A store outage must never block a check; the card link will simply not persist.
    console.error("saveCheck failed", err instanceof Error ? err.message : err);
  }
  return report;
}
