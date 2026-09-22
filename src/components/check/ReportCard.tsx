"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Copy, ExternalLink, Flag, MessageCircle, ShieldCheck } from "lucide-react";
import type { Report, IdentityMatch, Finding, ClauseFinding, Severity } from "@/lib/check/types";
import { COUNTRIES } from "@/lib/countries";
import { REPLY_LANGS } from "@/lib/check/replies";
import { Stamp } from "@/components/brand/Stamp";
import { Button, OfficialBox, SectionLabel } from "@/components/ui";
import { BRAND } from "@/lib/brand";

const SEV: Record<Severity, string> = { high: "text-red", medium: "text-amber", low: "text-toner-2", info: "text-toner-2" };
const SEV_LABEL: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low", info: "Note" };

function contactLine(m: IdentityMatch): { text: string; tone: string } {
  switch (m.contact) {
    case "match":
      return { text: "Contact in the message matches the record", tone: "text-green" };
    case "mismatch":
      return { text: "Contact in the message is NOT the one on file", tone: "text-red" };
    case "none_on_file":
      return { text: m.onFile.phones.length === 0 && m.onFile.emails.length > 0 ? "This register lists no phone; only the email on file can be trusted" : "Record has no comparable contact to check against", tone: "text-amber" };
    default:
      return { text: "No contact in the message to compare", tone: "text-toner-2" };
  }
}

function Highlighted({ text, phrases }: { text: string; phrases: string[] }) {
  const reduce = useReducedMotion();
  const parts = useMemo(() => {
    const clean = phrases.map((p) => p.trim()).filter((p) => p.length >= 4);
    if (!clean.length) return [{ t: text, m: false }];
    const re = new RegExp(clean.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
    const out: { t: string; m: boolean }[] = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (i > last) out.push({ t: text.slice(last, i), m: false });
      out.push({ t: m[0], m: true });
      last = i + m[0].length;
    }
    if (last < text.length) out.push({ t: text.slice(last), m: false });
    return out;
  }, [text, phrases]);
  let k = 0;
  let m = 0;
  return (
    <pre className="whitespace-pre-wrap wrap-break-word font-mono text-[0.85rem] leading-relaxed text-toner">
      {parts.map((p) =>
        p.m ? (
          <mark key={k++} className={`mark ${reduce ? "" : "mark-in"}`} style={reduce ? undefined : { animationDelay: `${0.5 + (m++ % 8) * 0.06}s` }}>
            {p.t}
          </mark>
        ) : (
          <span key={k++}>{p.t}</span>
        ),
      )}
    </pre>
  );
}

function MatchCards({ matches }: { matches: IdentityMatch[] }) {
  return (
    <ul className="mt-3 divide-y divide-rule border-y border-rule sm:hidden">
      {matches.map((m) => {
        const c = m.score < 0.82 && m.matchedVia === "name" ? { text: "Similar name only, not compared", tone: "text-toner-2" } : contactLine(m);
        return (
          <li key={m.country + m.entryId} className="py-3 text-sm">
            <Link href={`/registry/${m.country}/${m.entryId}`} className="font-semibold text-toner">
              {m.name}
            </Link>
            <div className="text-xs text-toner-2">
              {COUNTRIES[m.country].registry.short} · {COUNTRIES[m.country].name}
              {m.licenseNo ? ` · ${m.licenseNo}` : ""}
              {m.validTo ? ` · valid to ${m.validTo}` : ""}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              <span className={m.status === "active" ? "text-green" : m.status === "unknown" ? "text-toner-2" : "text-red"}>{m.status}</span>
              <span className="font-mono text-xs text-toner-2">{Math.round(m.score * 100)}% by {m.matchedVia}</span>
            </div>
            <div className={`mt-1 ${c.tone}`}>{c.text}</div>
            {(m.onFile.emails.length || m.onFile.phones.length) > 0 && <div className="mt-0.5 break-all font-mono text-xs text-toner-2">on file: {[...m.onFile.phones, ...m.onFile.emails].slice(0, 2).join(", ")}</div>}
          </li>
        );
      })}
    </ul>
  );
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ReportCard({ report, animate = true, shareUrl }: { report: Report; animate?: boolean; shareUrl: string }) {
  const r = report;
  const [lang, setLang] = useState("en");
  const [reply, setReply] = useState(r.actions.replies.en ?? "");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [reported, setReported] = useState<Set<string>>(new Set());

  async function selectLang(code: string) {
    setLang(code);
    if (code === "en" || code === "pcm") {
      setReply(r.actions.replies[code] ?? "");
      return;
    }
    if (translations[code]) {
      setReply(translations[code]);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch(`/api/check/${r.id}/translate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: code }) });
      const j = await res.json();
      if (j.text) {
        setTranslations((t) => ({ ...t, [code]: j.text }));
        setReply(j.text);
      } else {
        setReply(r.actions.replies.en + "\n\n(Translation unavailable right now. English shown.)");
      }
    } catch {
      setReply(r.actions.replies.en);
    } finally {
      setTranslating(false);
    }
  }

  const evidence = [
    ...r.lure.map((f) => f.evidence ?? "").flatMap((e) => e.split(" · ")),
    ...r.clauses.map((c) => c.evidence),
    ...r.extraction.phones,
    ...r.extraction.emails,
    ...r.extraction.orgCandidates.slice(0, 2),
  ].filter(Boolean);

  const country = COUNTRIES[r.country];
  const waText = encodeURIComponent(r.actions.shareText);
  const reportables = [...r.extraction.phones.map((v) => ({ kind: "phone", value: v })), ...r.extraction.emails.map((v) => ({ kind: "email", value: v })), ...r.extraction.domains.filter((d) => !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(d)).map((v) => ({ kind: "domain", value: v }))];

  async function reportContact(kind: string, value: string) {
    const res = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, value, country: r.country, checkId: r.id }) });
    if (res.ok) setReported((s) => new Set(s).add(value));
  }

  let n = 0;

  return (
    <article className="sheet relative overflow-hidden p-5 sm:p-8" aria-label={`${BRAND.name} check ${r.id}`}>
      <header className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="condensed text-[0.7rem] text-toner-2">
            {BRAND.name} check · {country.flag} {country.name} · {r.kind.replace("_", " ")}
          </p>
          <h1 className="display mt-2 text-[clamp(1.5rem,4vw,2.2rem)] leading-tight">{r.verdict.headline}</h1>
          <ul className="mt-3 max-w-[68ch] space-y-1.5 text-[0.95rem] leading-relaxed">
            {r.verdict.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-start sm:justify-end sm:pt-2">
          <Stamp level={r.verdict.level} animate={animate} />
        </div>
      </header>

      {r.verifiedSender && (
        <div className="mt-6 flex items-start gap-3 border border-stamp bg-stamp-soft p-3 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-stamp" aria-hidden />
          <div>
            <strong>Verified sender.</strong> {r.verifiedSender.company} proved control of <span className="font-mono">{r.verifiedSender.domain}</span> by {r.verifiedSender.method.toUpperCase()} record on {r.verifiedSender.verifiedAt.slice(0, 10)}. A verified sender can still send a bad contract; read the clauses below.
          </div>
        </div>
      )}

      <section className="mt-8">
        <SectionLabel n={++n}>Who is on file</SectionLabel>
        {r.identity.matches.length === 0 ? (
          <p className="mt-2 max-w-[68ch] text-[0.95rem] text-toner-2">
            {r.identity.queries.length ? `No entry close to "${r.identity.queries[0]}" in the four registers (snapshots ${Object.entries(r.registryAsOf).map(([c, d]) => `${c} ${d}`).join(", ")}).` : "No organisation name could be read from the text. Add the company or agency name and run the check again."}
          </p>
        ) : (
          <>
          <MatchCards matches={r.identity.matches} />
          <div className="mt-3 hidden overflow-x-auto sm:block">
            <table className="ledger text-sm">
              <thead>
                <tr>
                  <th>Register entry</th>
                  <th>Status</th>
                  <th>Contact check</th>
                  <th>Match</th>
                </tr>
              </thead>
              <tbody>
                {r.identity.matches.map((m) => {
                  const c = m.score < 0.82 && m.matchedVia === "name" ? { text: "Similar name only, not compared", tone: "text-toner-2" } : contactLine(m);
                  return (
                    <tr key={m.country + m.entryId}>
                      <td>
                        <Link href={`/registry/${m.country}/${m.entryId}`} className="font-semibold text-toner">
                          {m.name}
                        </Link>
                        <div className="text-xs text-toner-2">
                          {COUNTRIES[m.country].registry.short} · {COUNTRIES[m.country].name}
                          {m.licenseNo ? ` · ${m.licenseNo}` : ""}
                          {m.validTo ? ` · valid to ${m.validTo}` : ""}
                          {m.cacVerified ? " · CAC verified" : ""}
                        </div>
                      </td>
                      <td className={m.status === "active" ? "text-green" : m.status === "unknown" ? "text-toner-2" : "text-red"}>{m.status}</td>
                      <td className={c.tone}>
                        {c.text}
                        {(m.onFile.emails.length || m.onFile.phones.length) > 0 && (
                          <div className="mt-1 font-mono text-xs text-toner-2">on file: {[...m.onFile.phones, ...m.onFile.emails].slice(0, 3).join(", ")}</div>
                        )}
                      </td>
                      <td className="font-mono text-xs text-toner-2">
                        {Math.round(m.score * 100)}% by {m.matchedVia}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      <section className="mt-8">
        <SectionLabel n={++n}>What was found</SectionLabel>
        {r.lure.length === 0 ? (
          <p className="mt-2 text-[0.95rem] text-toner-2">No lure patterns from the published warnings matched this text.</p>
        ) : (
          <ol className="mt-3 space-y-4">
            {r.lure.map((f: Finding) => {
              const off = dismissed.has(f.id);
              return (
                <li key={f.id} className={`grid gap-1 sm:grid-cols-[5rem_1fr] ${off ? "opacity-50" : ""}`}>
                  <span className={`condensed text-[0.7rem] ${SEV[f.severity]}`}>{SEV_LABEL[f.severity]}</span>
                  <div>
                    <p className={`font-semibold ${off ? "line-through" : ""}`}>{f.title}</p>
                    <p className="max-w-[68ch] text-sm text-toner-2">{f.detail}</p>
                    {f.evidence && (
                      <p className="mt-1 font-mono text-xs">
                        <span className="mark">{f.evidence}</span>
                      </p>
                    )}
                    <button type="button" onClick={() => setDismissed((s) => { const c = new Set(s); if (c.has(f.id)) c.delete(f.id); else c.add(f.id); return c; })} className="mt-1 text-xs text-toner-2 underline hover:text-toner">
                      {off ? "Restore" : "Does not apply"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {r.clauses.length > 0 && (
        <section className="mt-8">
          <SectionLabel n={++n}>Clauses against the law</SectionLabel>
          <ol className="mt-3 space-y-5">
            {r.clauses.map((c: ClauseFinding) => (
              <li key={c.key} className="grid gap-1 sm:grid-cols-[5rem_1fr]">
                <span className={`condensed text-[0.7rem] ${SEV[c.severity]}`}>{SEV_LABEL[c.severity]}</span>
                <div>
                  <p className="font-semibold">{c.label}</p>
                  <p className="mt-1 font-mono text-xs">
                    <span className="mark">{c.evidence}</span>
                  </p>
                  <p className="mt-1 max-w-[68ch] text-sm text-toner-2">{c.detail}</p>
                  {c.citation ? (
                    <blockquote className="mt-2 border-l border-rule pl-3 text-sm">
                      <p className="font-semibold">
                        {c.citation.act}, {c.citation.section}
                        {c.citation.confidence !== "verified" && <span className="ml-2 text-xs font-normal text-toner-2">({c.citation.confidence})</span>}
                      </p>
                      {c.citation.quote && <p className="mt-1 font-mono text-xs text-toner-2">“{c.citation.quote}”</p>}
                      {c.citation.plain && <p className="mt-1 text-toner-2">{c.citation.plain}</p>}
                      {c.citation.url && (
                        <a href={c.citation.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-stamp">
                          Read the section <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </blockquote>
                  ) : (
                    <p className="mt-2 text-xs text-toner-2">No statute section covers this in {country.name}; courts decide case by case.</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {r.domains.length > 0 && (
        <section className="mt-8">
          <SectionLabel n={++n}>Domains in the message</SectionLabel>
          <table className="ledger mt-3 text-sm">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Registered</th>
                <th>Mail set up</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {r.domains.map((d) => (
                <tr key={d.domain}>
                  <td className="font-mono">{d.domain}</td>
                  <td>{d.freeMail ? "free mailbox" : d.registered ? `${d.registered}${d.ageDays !== null ? ` (${d.ageDays} days)` : ""}` : d.error ? "lookup unavailable" : "unknown"}</td>
                  <td>{d.freeMail ? "n/a" : d.mx === null ? "unknown" : d.mx ? "yes" : "no MX record"}</td>
                  <td className="text-toner-2">{d.lookalikeOf ? `Looks like ${d.lookalikeOf.domain} (${d.lookalikeOf.name})` : d.freeMail ? "Anyone can open this mailbox" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-8">
        <SectionLabel n={++n}>Your text, marked up</SectionLabel>
        <div className="mt-3 max-h-80 overflow-auto border border-rule bg-paper-2 p-3">
          <Highlighted text={r.extraction.text} phrases={evidence} />
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel n={++n}>What to send</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-1">
          {REPLY_LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => selectLang(l.code)}
              className={`rounded-xs border px-2 py-1 text-xs ${lang === l.code ? "border-stamp bg-stamp-soft text-toner" : "border-rule text-toner-2 hover:text-toner"}`}
              title={l.llm ? "Machine translated" : "Written template"}
            >
              {l.native}
              {l.llm && <span className="ml-1 text-[0.6rem] opacity-70">MT</span>}
            </button>
          ))}
        </div>
        <textarea
          value={translating ? "Translating…" : reply}
          onChange={(e) => setReply(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-xs border border-rule bg-paper-2 p-3 font-mono text-sm leading-relaxed text-toner"
          aria-label="Reply to send"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={async () => setCopied((await copy(reply)) ? "reply" : null)}>
            <Copy className="h-4 w-4" aria-hidden /> {copied === "reply" ? "Copied" : "Copy reply"}
          </Button>
          <a href={`https://wa.me/?text=${encodeURIComponent(reply)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xs border border-toner px-4 py-2.5 text-sm font-bold tab text-toner hover:bg-paper-2">
            <MessageCircle className="h-4 w-4" aria-hidden /> Send on WhatsApp
          </a>
        </div>
        {lang !== "en" && lang !== "pcm" && <p className="mt-2 text-xs text-toner-2">Machine translated. Read it once before you send it.</p>}
      </section>

      <section className="mt-8">
        <SectionLabel n={++n}>Who to call in {country.name}</SectionLabel>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {r.actions.hotlines.slice(0, 6).map((h) => (
            <li key={h.org + h.value} className="border border-rule p-3 text-sm">
              <p className="font-semibold">{h.org}</p>
              {h.channel === "phone" ? (
                <a href={`tel:${h.value.replace(/\s/g, "")}`} className="font-mono text-stamp">{h.value}</a>
              ) : h.channel === "email" ? (
                <a href={`mailto:${h.value}`} className="font-mono text-stamp">{h.value}</a>
              ) : (
                <a href={h.value} target="_blank" rel="noreferrer" className="font-mono text-stamp break-all">{h.value}</a>
              )}
              <p className="mt-1 text-xs text-toner-2">
                <a href={h.source_url} target="_blank" rel="noreferrer" className="text-toner-2">source</a>
              </p>
            </li>
          ))}
        </ul>
        <Link href="/hotlines" className="mt-2 inline-block text-sm text-stamp">All hotlines and what to say</Link>
      </section>

      {reportables.length > 0 && (
        <section className="mt-8">
          <SectionLabel n={++n}>Warn the next person</SectionLabel>
          <p className="mt-2 max-w-[68ch] text-sm text-toner-2">If you know this contact is a scam, report it. Future checks that see the same number, email or domain will show the count.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {reportables.map((c) => (
              <button key={c.value} type="button" disabled={reported.has(c.value)} onClick={() => reportContact(c.kind, c.value)} className="inline-flex items-center gap-1 rounded-xs border border-rule px-2 py-1 font-mono text-xs text-toner-2 hover:border-toner hover:text-toner disabled:border-dotted">
                <Flag className="h-3 w-3" aria-hidden /> {reported.has(c.value) ? "Reported" : `Report ${c.value}`}
              </button>
            ))}
          </div>
          {r.community && <p className="mt-2 text-sm text-amber">{r.community.reports} earlier report{r.community.reports === 1 ? "" : "s"} name a contact in this message.</p>}
        </section>
      )}

      <footer className="mt-10 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <OfficialBox
          rows={[
            ["Check id", r.id],
            ["Issued", r.createdAt.replace("T", " ").slice(0, 16) + " UTC"],
            ["Registers", Object.entries(r.registryAsOf).map(([c, d]) => `${c} ${d}`).join("  ")],
            ["Engine", `${r.version} · ${r.extraction.source}`],
            ["Card", shareUrl],
          ]}
        />
        <div className="flex flex-col gap-2 sm:items-end">
          <Button type="button" variant="secondary" onClick={async () => setCopied((await copy(shareUrl)) ? "link" : null)}>
            <Copy className="h-4 w-4" aria-hidden /> {copied === "link" ? "Link copied" : "Copy card link"}
          </Button>
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xs bg-stamp px-4 py-2.5 text-sm font-bold tab text-paper hover:bg-stamp-hover">
            <MessageCircle className="h-4 w-4" aria-hidden /> Share card to the group
          </a>
        </div>
      </footer>
    </article>
  );
}
