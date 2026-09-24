"use client";

import { useState } from "react";
import { COUNTRIES, COUNTRY_CODES, type Country } from "@/lib/countries";
import { SAMPLES } from "@/lib/samples";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import type { Report } from "@/lib/check/types";
import { ScreenshotInput } from "./ScreenshotInput";

interface Props {
  initialText?: string;
  initialCountry?: Country | "auto";
  compact?: boolean;
  onResult: (r: Report) => void;
}

export function CheckForm({ initialText = "", initialCountry = "auto", compact = false, onResult }: Props) {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [country, setCountry] = useState<Country | "auto">(initialCountry);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = text.trim().length > 0 || url.trim().length > 0 || name.trim().length > 0 || contact.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, string> = { country };
      if (text.trim()) body.text = text.trim();
      if (url.trim()) body.url = url.trim();
      if (name.trim()) body.name = name.trim();
      if (contact.trim()) {
        if (contact.includes("@")) body.email = contact.trim();
        else body.phone = contact.trim();
      }
      const res = await fetch("/api/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "The check could not run");
      onResult(j.report as Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The check could not run");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="relative" aria-busy={busy}>
      <div className="relative">
        <Label htmlFor="text" hint="the ad, the WhatsApp message, or the whole offer letter">Paste the message</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}

          rows={compact ? 6 : 10}
          placeholder="Paste exactly what you received. Names, numbers, emails and amounts are what the check reads."
          maxLength={20000}
        />
        {busy && <div className="scanbar" aria-hidden />}
      </div>
      <div className="mt-2">
        <ScreenshotInput disabled={busy} dropTargetId="text" onText={(t) => setText((cur) => (cur.trim() ? `${cur.trim()}

${t}` : t))} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-toner-2">Try an example:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setText(s.text);
              setCountry(s.country);
            }}
            className="rounded-xs border border-rule px-2 py-1 text-xs text-toner-2 hover:border-toner hover:text-toner"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="country" hint="picks which register and hotline to lead with">Your country</Label>
          <Select id="country" value={country} onChange={(e) => setCountry(e.target.value as Country | "auto")}>
            <option value="auto">Detect from the message</option>
            {COUNTRY_CODES.map((c) => (
              <option key={c} value={c}>
                {COUNTRIES[c].flag} {COUNTRIES[c].name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={() => setMore((m) => !m)} className="pb-2.5 text-sm text-toner-2 underline hover:text-toner">
            {more ? "Fewer fields" : "Add a link, name or number"}
          </button>
        </div>
      </div>

      {more && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="url">Job link</Label>
            <Input id="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="name">Company or agency</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As written in the message" />
          </div>
          <div>
            <Label htmlFor="contact">Phone or email</Label>
            <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+234... or hr@..." />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 border border-red bg-red-soft px-3 py-2 text-sm text-toner">
          {error}. Paste the message again or add the company name.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canSubmit || busy} className="min-w-40">
          {busy ? "Checking the registers" : "Check this offer"}
        </Button>
        <span className="text-xs text-toner-2">Nothing you paste is shown publicly unless you share the card link.</span>
      </div>
    </form>
  );
}
