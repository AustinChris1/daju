import type { Metadata } from "next";
import { COUNTRIES, type Country } from "@/lib/countries";
import { registryNotes, registryStats } from "@/lib/registry/load";
import { allClauses, allLureSources, lawAsOf } from "@/lib/law";
import { LURE_RULES } from "@/lib/rules/lure";
import { ENGINE_VERSION } from "@/lib/check/engine";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Method" };

export default function MethodPage() {
  const stats = registryStats();
  const notes = registryNotes();
  const clauses = allClauses();
  const sources = allLureSources();
  const clauseKeys = Object.keys(clauses.clauses);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)]">How a check is made</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">Everything on a card can be traced to a register snapshot, a statute section or a published warning. This page lists them. Engine {ENGINE_VERSION}.</p>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">1. The registers</h2>
        <div className="mt-3 overflow-x-auto">
        <table className="ledger text-sm">
          <thead>
            <tr>
              <th>Country</th>
              <th>Source</th>
              <th>Entries</th>
              <th>Snapshot</th>
              <th>What it holds</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              const c = COUNTRIES[s.country as Country];
              const note = notes.find((n) => n.country === s.country);
              return (
                <tr key={s.country}>
                  <td>{c.flag} {c.name}</td>
                  <td>
                    <a href={s.source.url} target="_blank" rel="noreferrer">{s.source.name}</a>
                    <div className="font-mono text-xs text-toner-2">{s.source.method}</div>
                  </td>
                  <td className="font-mono">{s.count.toLocaleString()}<div className="text-xs text-toner-2">{s.active.toLocaleString()} active</div></td>
                  <td className="font-mono">{s.as_of}</td>
                  <td className="text-toner-2">
                    {s.withEmail.toLocaleString()} with email, {s.withPhone.toLocaleString()} with phone.{note?.notes ? ` ${note.notes}` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <p className="mt-3 max-w-[68ch] text-sm text-toner-2">Snapshots are taken by the scripts in the repository and committed with their date. A check never calls a government site, so a portal outage cannot break a check, and a card always says which snapshot it used.</p>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">2. Identity and contact match</h2>
        <p className="mt-3 max-w-[68ch] text-[0.95rem] leading-relaxed">
          Names are compared after stripping legal suffixes, with a bigram similarity and token overlap; entries above 82% count as a match, and similar names below that are shown so an impersonator&apos;s one-word change is visible. Then the phone numbers, emails and domains in the message are compared with the record, but only on channels both sides have: a phone-only message cannot contradict an email-only record. A name that matches with a contact that does not is the highest-severity finding, because that is how licensed names are borrowed.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">3. Lure rules, {LURE_RULES.length} of them, each with its source</h2>
        <ul className="mt-3 divide-y divide-rule border-y border-rule text-sm">
          {LURE_RULES.map((r) => {
            const src = sources.find((s) => s.id === r.sourceId);
            return (
              <li key={r.id} className="grid gap-1 py-3 sm:grid-cols-[6rem_1fr]">
                <span className={`condensed text-[0.7rem] ${r.severity === "high" ? "text-red" : r.severity === "medium" ? "text-amber" : "text-toner-2"}`}>{r.severity}</span>
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-toner-2">{r.detail}</p>
                  {src && (
                    <p className="mt-1 font-mono text-xs text-toner-2">
                      “{src.quote}” <a href={src.url} target="_blank" rel="noreferrer" className="text-toner-2">{src.org}, {src.date}</a>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">4. Clauses and the law, verified {lawAsOf()}</h2>
        <p className="mt-3 max-w-[68ch] text-sm text-toner-2">Six clause types in offer letters are matched by pattern. Each citation below was checked against the official text; where a country has no statute on the point, the card says so rather than inventing one.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="ledger text-sm">
            <thead>
              <tr>
                <th>Clause</th>
                {(["NG", "KE", "UG", "GH"] as Country[]).map((c) => (
                  <th key={c}>{COUNTRIES[c].flag} {c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clauseKeys.map((k) => {
                const row = clauses.clauses[k];
                return (
                  <tr key={k}>
                    <td className="font-semibold">{row.label}</td>
                    {(["NG", "KE", "UG", "GH"] as Country[]).map((c) => {
                      const v = row[c];
                      return (
                        <td key={c} className="text-xs">
                          {v?.act && v.section ? (
                            <a href={v.url ?? "#"} target="_blank" rel="noreferrer" className="text-toner">
                              {v.act}, {v.section}
                            </a>
                          ) : (
                            <span className="text-toner-2">none in statute</span>
                          )}
                          <div className="text-toner-2">{v?.confidence}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">5. What the model does, and does not do</h2>
        <p className="mt-3 max-w-[68ch] text-[0.95rem] leading-relaxed">
          A language model may refine extraction (the organisation name, the fee, the job title) and translate the reply. It never decides the verdict, never scores &quot;how scammy&quot; a message is and never cites law. If the model is unavailable, the check runs on the rule engine alone and the card says <span className="font-mono">heuristic</span> instead of <span className="font-mono">heuristic+llm</span>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">6. Limits</h2>
        <ul className="mt-3 max-w-[68ch] list-disc space-y-1 pl-5 text-sm text-toner-2">
          <li>Direct employers are not agencies and do not appear in agency registers. Not on file is not a scam signal on its own.</li>
          <li>Ghana&apos;s GLMIS directory carries no licence status. Kenya&apos;s snapshot is from the diaspora register, dated May 2026.</li>
          <li>Only Uganda publishes phone numbers; Nigeria, Kenya and Ghana publish emails. Contact comparison uses whatever channel exists.</li>
          <li>Clause flags are information with a citation, not legal advice.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">7. Use it from your own product</h2>
        <pre className="mt-3 overflow-x-auto border border-rule bg-paper-2 p-3 font-mono text-xs">{`POST /api/check
{ "text": "<the message>", "country": "NG" }

GET /api/registry?q=moonlight
GET /api/registry/UG/ug-0001
GET /api/stats`}</pre>
        <p className="mt-2 text-xs text-toner-2">Rate limited per IP. Job boards and messaging bots can call the same engine {BRAND.name} uses.</p>
      </section>
    </div>
  );
}
