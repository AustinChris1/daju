import { z } from "zod";
import { shortId } from "@/lib/check/engine";
import { getEntry } from "@/lib/registry/load";
import { getStore, type WatchRow } from "@/lib/store";
import { bad, countrySchema, fail, json, notFound, parseBody, rateLimit } from "../_lib/http";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const Body = z
  .object({
    email: z.string().trim().max(200).regex(EMAIL_RE, "email must be a valid address"),
    country: countrySchema,
    entryId: z.string().trim().regex(/^[A-Za-z0-9_.:-]{1,64}$/, "Invalid entry id"),
  })
  .strict();

export async function POST(req: Request) {
  const limited = rateLimit(req, "watch", 20, 10 * 60 * 1000);
  if (limited) return limited;
  const { data, res } = await parseBody(req, Body);
  if (res) return res;
  try {
    const entry = getEntry(data.country, data.entryId);
    if (!entry) return notFound("No register entry with that id");
    const email = data.email.toLowerCase();
    const store = getStore();
    const existing = (await store.listWatches(email)).find((w) => w.country === data.country && w.entry_id === entry.id);
    if (existing) return json({ ok: true, id: existing.id, already: true });
    const row: WatchRow = {
      id: shortId(),
      created_at: new Date().toISOString(),
      email,
      country: data.country,
      entry_id: entry.id,
      entry_name: entry.name,
      status_at_watch: entry.status,
    };
    await store.addWatch(row);
    return json({ ok: true, id: row.id }, 201);
  } catch (err) {
    return fail(err, "Could not save watch");
  }
}

export async function GET(req: Request) {
  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return bad("email is required");
  try {
    const rows = await getStore().listWatches(email);
    const watches = rows.map((w) => {
      const entry = getEntry(w.country, w.entry_id);
      const currentStatus = entry?.status ?? "unknown";
      return {
        id: w.id,
        country: w.country,
        entryId: w.entry_id,
        entryName: w.entry_name,
        statusAtWatch: w.status_at_watch,
        currentStatus,
        changed: currentStatus !== w.status_at_watch,
        stillListed: !!entry,
        created_at: w.created_at,
      };
    });
    return json({ email, watches });
  } catch (err) {
    return fail(err, "Could not load watches");
  }
}
