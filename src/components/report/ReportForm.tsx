"use client";

import { useState } from "react";
import { COUNTRIES, COUNTRY_CODES, type Country } from "@/lib/countries";
import { Button, Input, Label, Select, Sheet, Textarea } from "@/components/ui";

function guessKind(v: string): "phone" | "email" | "domain" | "name" {
  const t = v.trim();
  if (t.includes("@")) return "email";
  if (/^\+?[\d\s()-]{9,}$/.test(t)) return "phone";
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(t)) return "domain";
  return "name";
}

export function ReportForm() {
  const [value, setValue] = useState("");
  const [country, setCountry] = useState<Country>("NG");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const kind = guessKind(value);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);
    try {
      const res = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, value: value.trim(), country, note: note.trim() || undefined }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not save");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <Sheet>
        <p className="font-semibold text-green">Reported. Thank you.</p>
        <p className="mt-1 text-sm text-toner-2">The next check that sees this contact will show it. Report another if you have one.</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => { setValue(""); setNote(""); setState("idle"); }}>Report another</Button>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="value" hint={`reads as: ${kind}`}>Phone, email, domain or name</Label>
          <Input id="value" required value={value} onChange={(e) => setValue(e.target.value)} placeholder="+234 803... or hr@... or agency-name.com" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <div>
            <Label htmlFor="rcountry">Country</Label>
            <Select id="rcountry" value={country} onChange={(e) => setCountry(e.target.value as Country)}>
              {COUNTRY_CODES.map((c) => (
                <option key={c} value={c}>{COUNTRIES[c].flag} {COUNTRIES[c].name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="note" hint="optional, never shown publicly">What happened</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Asked for N20,000 registration fee, then blocked me." maxLength={500} />
          </div>
        </div>
        {error && <p className="border border-red bg-red-soft px-3 py-2 text-sm">{error}</p>}
        <Button type="submit" disabled={state === "busy" || value.trim().length < 3}>{state === "busy" ? "Saving" : "Report this contact"}</Button>
      </form>
    </Sheet>
  );
}
