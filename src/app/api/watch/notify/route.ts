import { BRAND } from "@/lib/brand";
import { COUNTRIES } from "@/lib/countries";
import { getEntry, snapshot } from "@/lib/registry/load";
import { getStore, type WatchRow } from "@/lib/store";
import { fail, json } from "../../_lib/http";

// Weekly licence watch: compares every saved watch with the deployed snapshot and emails the watcher when
// the entry's status changed or it left the register. Vercel cron calls GET with the CRON_SECRET bearer.
export const maxDuration = 60;

interface Change {
  watch: WatchRow;
  from: string;
  to: string;
  stillListed: boolean;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://daju-bice.vercel.app").replace(/\/$/, "");
}

function emailFor(email: string, changes: Change[]): { subject: string; text: string } {
  const lines = changes.map((c) => {
    const country = COUNTRIES[c.watch.country];
    const link = `${siteUrl()}/registry/${c.watch.country}/${c.watch.entry_id}`;
    const what = c.stillListed ? `status went from ${c.from} to ${c.to}` : `is no longer on the register (was ${c.from})`;
    return `${c.watch.entry_name} (${country.registry.short}, ${country.name}) ${what}. Snapshot ${snapshot(c.watch.country).as_of}.\n${link}`;
  });
  const first = changes[0].watch.entry_name;
  const subject = changes.length === 1 ? `${first}: register status changed` : `${changes.length} agencies you watch changed on the register`;
  const text = [
    `You asked ${BRAND.name} to watch ${changes.length === 1 ? "an agency" : `${changes.length} agencies`}. This week's register snapshot moved:`,
    "",
    lines.join("\n\n"),
    "",
    "A status change is not proof of wrongdoing; call the number on the register before paying anyone.",
    `You get this email only when something changes. To stop, reply with the word stop. ${siteUrl()}`,
  ].join("\n");
  return { subject, text };
}

async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.RESEND_FROM ?? `${BRAND.name} <onboarding@resend.dev>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) console.error("[watch] resend", res.status, await res.text().catch(() => ""));
  return res.ok;
}

async function run(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Not found", { status: 404 });
  if ((req.headers.get("authorization") ?? "") !== `Bearer ${secret}`) return json({ error: "Unauthorized" }, 401);
  try {
    const store = getStore();
    const watches = await store.allWatches();
    const changes: Change[] = [];
    for (const w of watches) {
      const entry = getEntry(w.country, w.entry_id);
      const to = entry?.status ?? "removed";
      if (to !== w.status_at_watch) changes.push({ watch: w, from: w.status_at_watch, to, stillListed: !!entry });
    }
    const byEmail = new Map<string, Change[]>();
    for (const c of changes) byEmail.set(c.watch.email, [...(byEmail.get(c.watch.email) ?? []), c]);

    const dryRun = !process.env.RESEND_API_KEY;
    let sent = 0;
    for (const [email, list] of byEmail) {
      const { subject, text } = emailFor(email, list);
      const ok = dryRun ? false : await sendMail(email, subject, text);
      if (ok) {
        sent += 1;
        for (const c of list) await store.updateWatchStatus(c.watch.id, c.to);
      }
    }
    return json({
      ok: true,
      checked: watches.length,
      changed: changes.length,
      recipients: byEmail.size,
      sent,
      dryRun,
      changes: changes.map((c) => ({ country: c.watch.country, entry: c.watch.entry_id, name: c.watch.entry_name, from: c.from, to: c.to })),
    });
  } catch (err) {
    return fail(err, "Watch run failed");
  }
}

export const GET = run;
export const POST = run;
