import { z } from "zod";
import { shortId } from "@/lib/check/engine";
import { domainOf, normPhone } from "@/lib/registry/match";
import { getStore, type ReportRow } from "@/lib/store";
import { bad, countrySchema, fail, json, parseBody, rateLimit } from "../_lib/http";

const Body = z
  .object({
    kind: z.enum(["phone", "email", "domain", "name"]),
    value: z.string().trim().min(3).max(300),
    country: countrySchema.optional(),
    note: z.string().trim().max(1000).optional(),
    checkId: z.string().trim().regex(/^[A-Za-z0-9]{6,32}$/).optional(),
  })
  .strict();

function normalise(kind: ReportRow["kind"], value: string, country?: ReportRow["country"]): string | null {
  switch (kind) {
    case "phone": {
      const p = normPhone(value, country ?? null);
      return p.replace(/\D/g, "").length >= 9 ? p : null;
    }
    case "email": {
      const e = value.toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) ? e : null;
    }
    case "domain": {
      const d = domainOf(value);
      return d && d.includes(".") ? d : null;
    }
    case "name":
      return value.replace(/\s+/g, " ").trim() || null;
  }
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "report", 10, 10 * 60 * 1000);
  if (limited) return limited;
  const { data, res } = await parseBody(req, Body);
  if (res) return res;
  const value = normalise(data.kind, data.value, data.country);
  if (!value) return bad(`That does not look like a valid ${data.kind}`);
  try {
    const row: ReportRow = {
      id: shortId(),
      created_at: new Date().toISOString(),
      kind: data.kind,
      value,
      country: data.country ?? null,
      note: data.note || null,
      check_id: data.checkId ?? null,
    };
    await getStore().addReport(row);
    return json({ ok: true, id: row.id, value }, 201);
  } catch (err) {
    return fail(err, "Could not save report");
  }
}
