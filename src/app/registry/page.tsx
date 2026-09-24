import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRIES, COUNTRY_CODES, isCountry, type Country } from "@/lib/countries";
import { listEntries, registryStats, searchByName } from "@/lib/registry/load";
import { describe, latestChanges } from "@/lib/registry/changes";
import { Input, Select } from "@/components/ui";

export const metadata: Metadata = { title: "Registers" };

const PAGE = 50;

export default async function RegistryPage({ searchParams }: PageProps<"/registry">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const country = typeof sp.country === "string" && isCountry(sp.country) ? sp.country : null;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const stats = registryStats();
  const moved = latestChanges();

  const searchAll = q.length >= 3 && !country;
  const hits = searchAll ? searchByName(q, { limit: 40, min: 0.5 }) : [];
  const list = country ? listEntries(country, { q, status, offset: (page - 1) * PAGE, limit: PAGE }) : null;
  const pages = list ? Math.max(1, Math.ceil(list.total / PAGE)) : 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)]">Is this agency on file?</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">The four government registers, searchable in one place. Every row links to what the register holds, including the contact you should call instead of the one in the message.</p>

      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_12rem_10rem_auto]" action="/registry" method="get">
        <Input name="q" defaultValue={q} placeholder="Agency name, email or phone" aria-label="Search" />
        <Select name="country" defaultValue={country ?? ""} aria-label="Country">
          <option value="">All four countries</option>
          {COUNTRY_CODES.map((c) => (
            <option key={c} value={c}>
              {COUNTRIES[c].flag} {COUNTRIES[c].name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
          <option value="unknown">Unknown</option>
        </Select>
        <button type="submit" className="bg-stamp px-4 py-2.5 text-sm font-bold tab text-paper hover:bg-stamp-hover">Search</button>
      </form>

      <ul className="mt-6 flex flex-wrap gap-2 text-sm">
        {stats.map((s) => (
          <li key={s.country}>
            <Link href={`/registry?country=${s.country}`} className={`inline-block border px-3 py-1.5 no-underline ${country === s.country ? "border-stamp text-stamp" : "border-rule text-toner-2 hover:text-toner"}`}>
              {COUNTRIES[s.country as Country].flag} {COUNTRIES[s.country as Country].registry.short} · {s.count.toLocaleString()} · {s.as_of}
            </Link>
          </li>
        ))}
      </ul>

      {moved && !searchAll && !list && (
        <section className="mt-8 card p-5" aria-labelledby="moved">
          <p id="moved" className="text-sm font-bold text-stamp">What moved on {moved.date}</p>
          <p className="mt-1 text-sm text-toner-2">Every register is re-read weekly and the difference is committed. Watch an entry to hear when its line changes.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {moved.countries.map((c) => {
              const named = [...c.status_changes.map((e) => ({ ...e, note: `${e.from} to ${e.to}` })), ...c.removed.map((e) => ({ ...e, note: "left the register" })), ...c.added.map((e) => ({ ...e, note: "new" }))].slice(0, 4);
              return (
                <li key={c.country} className="text-sm">
                  <p className="font-semibold text-toner">
                    {COUNTRIES[c.country].flag} {COUNTRIES[c.country].registry.short}: {describe(c)}
                  </p>
                  <p className="text-xs text-toner-2">{c.as_of_before} to {c.as_of_after} · {c.count_before.toLocaleString()} to {c.count_after.toLocaleString()} entries</p>
                  <ul className="mt-1 space-y-0.5">
                    {named.map((e) => (
                      <li key={e.id + e.note} className="flex justify-between gap-3">
                        {e.note === "left the register" ? <span className="text-toner-2 line-through">{e.name}</span> : <Link href={`/registry/${c.country}/${e.id}`}>{e.name}</Link>}
                        <span className="shrink-0 font-mono text-xs text-toner-2">{e.note}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {searchAll && (
        <section className="mt-8">
          <p className="text-sm text-toner-2">
            {hits.length} closest entries for “{q}” across all registers. Similar names are shown on purpose: impersonators change one word.
          </p>
          <ResultsTable rows={hits.map((h) => ({ country: h.country, entry: h.entry, score: h.score }))} />
        </section>
      )}

      {list && (
        <section className="mt-8">
          <p className="text-sm text-toner-2">
            {list.total.toLocaleString()} entries in {COUNTRIES[country!].registry.short}, {COUNTRIES[country!].registry.what.toLowerCase()}. Source: <a href={list.source.url} target="_blank" rel="noreferrer" className="text-toner-2">{list.source.name}</a>, snapshot {list.as_of}.
            {country === "GH" && " GLMIS publishes no licence status; Ghana announced a licensed list on 8 Sept 2026."}
            {country === "KE" && " Kenya's register lists licence numbers and expiry; expired entries are shown as such."}
            {country === "NG" && " NELEX lists CAC-verified agencies with email only; no phone numbers are published."}
          </p>
          <ResultsTable rows={list.rows.map((e) => ({ country: country!, entry: e }))} />
          {pages > 1 && (
            <nav className="mt-4 flex items-center gap-3 text-sm" aria-label="Pages">
              {page > 1 && <Link href={`/registry?country=${country}&q=${encodeURIComponent(q)}&status=${status}&page=${page - 1}`}>Previous</Link>}
              <span className="font-mono text-toner-2">page {page} of {pages}</span>
              {page < pages && <Link href={`/registry?country=${country}&q=${encodeURIComponent(q)}&status=${status}&page=${page + 1}`}>Next</Link>}
            </nav>
          )}
        </section>
      )}

      {!searchAll && !list && (
        <p className="mt-8 text-sm text-toner-2">Type at least three letters of a name, or pick a country to browse its register.</p>
      )}
    </div>
  );
}

function ResultsTable({ rows }: { rows: { country: Country; entry: { id: string; name: string; status: string; emails: string[]; phones: string[]; valid_to: string | null; license_no: string | null; address: string | null }; score?: number }[] }) {
  if (!rows.length) return <p className="mt-4 text-sm text-toner-2">Nothing on file for that. Try fewer words.</p>;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="ledger text-sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Register</th>
            <th>Status</th>
            <th>On file</th>
            {rows[0].score !== undefined && <th>Match</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.country + r.entry.id}>
              <td>
                <Link href={`/registry/${r.country}/${r.entry.id}`} className="font-semibold text-toner">
                  {r.entry.name}
                </Link>
                {r.entry.license_no && <div className="font-mono text-xs text-toner-2">{r.entry.license_no}</div>}
              </td>
              <td className="whitespace-nowrap">
                {COUNTRIES[r.country].flag} {COUNTRIES[r.country].registry.short}
              </td>
              <td className={r.entry.status === "active" ? "text-green" : r.entry.status === "unknown" ? "text-toner-2" : "text-red"}>
                {r.entry.status}
                {r.entry.valid_to && <div className="font-mono text-xs text-toner-2">to {r.entry.valid_to}</div>}
              </td>
              <td className="font-mono text-xs text-toner-2">{[...r.entry.phones, ...r.entry.emails].slice(0, 2).join(", ") || "no contact published"}</td>
              {r.score !== undefined && <td className="font-mono text-xs text-toner-2">{Math.round(r.score * 100)}%</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
