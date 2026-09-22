import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTRIES, isCountry } from "@/lib/countries";
import { getEntry, snapshot } from "@/lib/registry/load";
import { OfficialBox } from "@/components/ui";
import { WatchForm } from "@/components/registry/WatchForm";

export async function generateMetadata({ params }: PageProps<"/registry/[country]/[id]">): Promise<Metadata> {
  const { country, id } = await params;
  if (!isCountry(country)) return { title: "Not on file" };
  const e = getEntry(country, id);
  return { title: e ? `${e.name} · ${COUNTRIES[country].registry.short}` : "Not on file" };
}

export default async function EntryPage({ params }: PageProps<"/registry/[country]/[id]">) {
  const { country, id } = await params;
  if (!isCountry(country)) notFound();
  const e = getEntry(country, id);
  if (!e) notFound();
  const c = COUNTRIES[country];
  const snap = snapshot(country);
  const prefill = encodeURIComponent(`${e.name}\n${[...e.emails, ...e.phones].join("\n")}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="condensed text-[0.7rem] text-toner-2">
        {c.flag} {c.registry.short} · {c.registry.what}
      </p>
      <h1 className="display mt-2 text-[clamp(1.5rem,4vw,2.2rem)]">{e.name}</h1>
      <p className={`mt-2 text-lg ${e.status === "active" ? "text-green" : e.status === "unknown" ? "text-toner-2" : "text-red"}`}>
        Status on the register: <strong>{e.status}</strong>
        {e.valid_to && <span className="text-toner-2"> · valid to {e.valid_to}</span>}
      </p>

      <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
        {e.license_no && (<><dt className="text-toner-2">Licence number</dt><dd className="font-mono">{e.license_no}</dd></>)}
        <dt className="text-toner-2">Contacts on file</dt>
        <dd className="font-mono">{[...e.phones, ...e.emails].join("\n") ? [...e.phones, ...e.emails].map((v) => <div key={v}>{v}</div>) : "none published"}</dd>
        {e.website && (<><dt className="text-toner-2">Website</dt><dd className="font-mono"><a href={e.website.startsWith("http") ? e.website : `https://${e.website}`} target="_blank" rel="noreferrer">{e.website}</a></dd></>)}
        {e.address && (<><dt className="text-toner-2">Address</dt><dd>{e.address}</dd></>)}
        {e.valid_from && (<><dt className="text-toner-2">Licence valid from</dt><dd className="font-mono">{e.valid_from}</dd></>)}
        {e.cac_verified !== null && (<><dt className="text-toner-2">CAC verified</dt><dd>{e.cac_verified ? "yes" : "no"}</dd></>)}
        {e.type && (<><dt className="text-toner-2">Type</dt><dd>{e.type}</dd></>)}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/check?text=${prefill}&country=${country}`} className="bg-stamp px-4 py-2.5 text-sm font-bold tab text-paper no-underline hover:bg-stamp-hover">
          Check a message claiming to be them
        </Link>
        <a href={c.registry.url} target="_blank" rel="noreferrer" className="border border-toner px-4 py-2.5 text-sm font-bold tab text-toner no-underline hover:bg-paper-2">
          Open the official register
        </a>
      </div>

      <section className="mt-10 border-t border-rule pt-6">
        <h2 className="font-semibold">Watch this licence</h2>
        <p className="mt-1 max-w-[60ch] text-sm text-toner-2">Uganda revoked 275 licences in one month. Leave an email and, when the next snapshot shows this entry changed status or dropped off the register, you will know.</p>
        <WatchForm country={country} entryId={e.id} />
      </section>

      <div className="mt-10">
        <OfficialBox rows={[["Register", snap.source.name], ["Snapshot", snap.as_of], ["Source", snap.source.url], ["Entry id", e.id]]} />
      </div>
    </div>
  );
}
