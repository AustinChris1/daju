"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COUNTRIES, COUNTRY_CODES, type Country } from "@/lib/countries";
import { Button, Input, Label, Select, Sheet, Textarea } from "@/components/ui";

interface Job {
  id: string;
  title: string;
  country: Country;
  location: string;
  mode: string;
  salary: string | null;
  public: boolean;
  views: number;
  created_at: string;
}

export function JobPoster({ manageKey, defaultCountry, domain }: { manageKey: string; defaultCountry: Country; domain: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", country: defaultCountry, location: "", mode: "onsite", salary: "", description: "", applyEmail: `careers@${domain}` });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employers/me?key=${encodeURIComponent(manageKey)}`)
      .then((r) => r.json())
      .then((j) => !cancelled && j.jobs && setJobs(j.jobs))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [manageKey]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manageKey, ...form, salary: form.salary || undefined }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not post");
      setJobs((list) => [{ id: j.id, title: form.title, country: form.country, location: form.location, mode: form.mode, salary: form.salary || null, public: true, views: 0, created_at: new Date().toISOString() }, ...list]);
      setForm((f) => ({ ...f, title: "", location: "", salary: "", description: "" }));
      setMsg("Posted. It is live on the Jobs page.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(job: Job) {
    const res = await fetch(`/api/jobs/${job.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ manageKey, public: !job.public }) });
    if (res.ok) setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, public: !j.public } : j)));
  }

  return (
    <Sheet>
      <h2 className="font-semibold">Post a verified role</h2>
      <p className="mt-1 max-w-[60ch] text-sm text-toner-2">Listed on the public Jobs page with your verified badge. The apply address must be on {domain}, so candidates can tell your messages from borrowed ones.</p>
      <form onSubmit={post} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="jtitle">Role title</Label>
          <Input id="jtitle" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Front-end developer" />
        </div>
        <div>
          <Label htmlFor="jcountry">Country</Label>
          <Select id="jcountry" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value as Country })}>
            {COUNTRY_CODES.map((c) => (
              <option key={c} value={c}>{COUNTRIES[c].flag} {COUNTRIES[c].name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="jlocation">Location</Label>
          <Input id="jlocation" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lekki, Lagos" />
        </div>
        <div>
          <Label htmlFor="jmode">Work mode</Label>
          <Select id="jmode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            <option value="onsite">On site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="jsalary" hint="optional">Salary</Label>
          <Input id="jsalary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="N400,000 to N500,000 monthly" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="jdesc">Description</Label>
          <Textarea id="jdesc" required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What the person will do, what you need, how you interview. No fees, ever." maxLength={2000} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="japply" hint={`must be on ${domain}`}>Apply address</Label>
          <Input id="japply" type="email" required value={form.applyEmail} onChange={(e) => setForm({ ...form, applyEmail: e.target.value })} />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>{busy ? "Posting" : "Post role"}</Button>
          {msg && <span className="text-sm text-toner-2">{msg}</span>}
        </div>
      </form>
      {jobs.length > 0 && (
        <table className="ledger mt-6 text-sm">
          <thead>
            <tr>
              <th>Role</th>
              <th>Where</th>
              <th>Opened</th>
              <th>Listed</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>
                  <Link href={`/jobs/${j.id}`}>{j.title}</Link>
                </td>
                <td>{COUNTRIES[j.country].flag} {j.location} · {j.mode}</td>
                <td className="font-mono">{j.views}</td>
                <td>
                  <button type="button" onClick={() => toggle(j)} className="text-sm underline">{j.public ? "Unlist" : "Relist"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sheet>
  );
}
