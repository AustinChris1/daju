"use client";

import { useEffect, useState } from "react";
import { Copy, ShieldCheck } from "lucide-react";
import { COUNTRIES, COUNTRY_CODES, type Country } from "@/lib/countries";
import { Button, Input, Label, OfficialBox, Select, Sheet } from "@/components/ui";
import { setStored, storageKey, useStoredValue } from "@/lib/useStored";

interface Employer {
  id: string;
  company: string;
  domain: string;
  country: Country;
  contact_email: string;
  method: string | null;
  verified_at: string | null;
  dns_token: string;
  dnsRecord: { host: string; type: string; value: string };
}
interface Offer {
  token: string;
  url: string;
  role: string;
  candidate: string | null;
  country: Country;
  views: number;
  created_at: string;
}

const KEY = storageKey("employerKey");

export function EmployerConsole({ siteUrl }: { siteUrl: string }) {
  const key = useStoredValue(KEY);
  const setKey = (k: string | null) => setStored(KEY, k);
  const [emp, setEmp] = useState<Employer | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ company: "", domain: "", country: "NG" as Country, contactEmail: "" });
  const [offer, setOffer] = useState({ role: "", candidate: "", country: "NG" as Country });
  const [existingKey, setExistingKey] = useState("");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/employers/me?key=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.employer) {
          setEmp(j.employer);
          setOffers(j.offers ?? []);
          setOffer((o) => ({ ...o, country: j.employer.country }));
        } else {
          setMsg(j.error ?? "That key is not on file.");
          setStored(KEY, null);
        }
      })
      .catch(() => !cancelled && setMsg("Could not load your company."));
    return () => {
      cancelled = true;
    };
  }, [key]);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/employers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setKey(j.manageKey);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!key) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/employers/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manageKey: key }) });
      const j = await res.json();
      if (j.verified) {
        setEmp((e) => (e ? { ...e, verified_at: j.verifiedAt, method: j.method } : e));
        setMsg("Verified. You can issue offer links now.");
      } else {
        setMsg(j.reason ?? "Not verified yet.");
      }
    } catch {
      setMsg("Verification request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    if (!key) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/offers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manageKey: key, role: offer.role, candidate: offer.candidate || undefined, country: offer.country }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setOffers((o) => [{ token: j.token, url: j.url, role: offer.role, candidate: offer.candidate || null, country: offer.country, views: 0, created_at: new Date().toISOString() }, ...o]);
      setOffer((o) => ({ ...o, role: "", candidate: "" }));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not issue the offer");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setKey(null);
    setEmp(null);
    setOffers([]);
  }

  if (!key || !emp) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Sheet>
          <form onSubmit={register} className="space-y-4">
            <div>
              <Label htmlFor="company">Company or agency name</Label>
              <Input id="company" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="As it appears on your letterhead" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="domain" hint="no free mail domains">Company domain</Label>
                <Input id="domain" required value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="company.com.ng" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value as Country })}>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c} value={c}>
                      {COUNTRIES[c].flag} {COUNTRIES[c].name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="contactEmail" hint="must be on that domain">HR contact email</Label>
              <Input id="contactEmail" type="email" required value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="hr@company.com.ng" />
            </div>
            {msg && <p className="border border-red bg-red-soft px-3 py-2 text-sm">{msg}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Registering" : "Get my DNS record"}</Button>
          </form>
        </Sheet>
        <div className="text-sm text-toner-2">
          <p className="condensed text-[0.7rem]">Already registered?</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setKey(existingKey.trim());
            }}
            className="mt-2 flex gap-2"
          >
            <Input value={existingKey} onChange={(e) => setExistingKey(e.target.value)} placeholder="Paste your manage key" aria-label="Manage key" />
            <Button type="submit" variant="secondary">Open</Button>
          </form>
          <p className="mt-6 max-w-[48ch]">Why DNS and not an email code: anyone can open a mailbox, but only the domain owner can publish a record on it. The same proof registrars and Google use.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Sheet>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="condensed text-[0.7rem] text-toner-2">{COUNTRIES[emp.country].flag} {emp.company}</p>
            <p className="font-mono text-lg">{emp.domain}</p>
          </div>
          {emp.verified_at ? (
            <p className="inline-flex items-center gap-2 border border-stamp bg-stamp-soft px-3 py-1.5 text-sm">
              <ShieldCheck className="h-4 w-4 text-stamp" aria-hidden /> Verified by {emp.method?.toUpperCase()} on {emp.verified_at.slice(0, 10)}
            </p>
          ) : (
            <p className="border border-amber bg-amber-soft px-3 py-1.5 text-sm">Not verified yet</p>
          )}
        </div>

        {!emp.verified_at && (
          <div className="mt-6">
            <p className="text-sm">Add this TXT record at your DNS provider, then press verify. Propagation can take minutes to a few hours.</p>
            <OfficialBox rows={[["Host", emp.dnsRecord.host], ["Type", emp.dnsRecord.type], ["Value", emp.dnsRecord.value]]} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(emp.dnsRecord.value)}>
                <Copy className="h-4 w-4" aria-hidden /> Copy value
              </Button>
              <Button type="button" onClick={verify} disabled={busy}>{busy ? "Checking DNS" : "Verify now"}</Button>
            </div>
          </div>
        )}
        {msg && <p className="mt-4 border border-rule bg-paper-2 px-3 py-2 text-sm">{msg}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-toner-2">
          <span className="font-mono">manage key: {key.slice(0, 6)}…{key.slice(-4)}</span>
          <button type="button" onClick={() => navigator.clipboard.writeText(key)} className="underline">copy key</button>
          <button type="button" onClick={signOut} className="underline">forget this device</button>
        </div>
      </Sheet>

      {emp.verified_at && (
        <Sheet>
          <h2 className="font-semibold">Issue an offer link</h2>
          <form onSubmit={issue} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" required value={offer.role} onChange={(e) => setOffer({ ...offer, role: e.target.value })} placeholder="Front-end developer" />
            </div>
            <div>
              <Label htmlFor="candidate" hint="optional">Candidate</Label>
              <Input id="candidate" value={offer.candidate} onChange={(e) => setOffer({ ...offer, candidate: e.target.value })} placeholder="First name" />
            </div>
            <div>
              <Label htmlFor="ocountry">Country</Label>
              <Select id="ocountry" value={offer.country} onChange={(e) => setOffer({ ...offer, country: e.target.value as Country })}>
                {COUNTRY_CODES.map((c) => (
                  <option key={c} value={c}>{COUNTRIES[c].name}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={busy}>Issue</Button>
          </form>
          {offers.length > 0 && (
            <table className="ledger mt-6 text-sm">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Candidate</th>
                  <th>Link</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.token}>
                    <td>{o.role}</td>
                    <td>{o.candidate ?? ""}</td>
                    <td className="font-mono text-xs">
                      <a href={o.url}>{siteUrl}{o.url}</a>
                      <button type="button" onClick={() => navigator.clipboard.writeText(`${siteUrl}${o.url}`)} className="ml-2 underline">copy</button>
                    </td>
                    <td className="font-mono">{o.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-4 max-w-[60ch] text-xs text-toner-2">Put the link in the offer email or letter. When the candidate pastes it into a check, the card shows your company as a verified sender. Opens are counted so you know it reached them.</p>
        </Sheet>
      )}
    </div>
  );
}
