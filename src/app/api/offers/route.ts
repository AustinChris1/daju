import { z } from "zod";
import { shortId } from "@/lib/check/engine";
import { getStore, type OfferRow } from "@/lib/store";
import { countrySchema, fail, json, notFound, parseBody, rateLimit, randomToken } from "../_lib/http";

const Body = z
  .object({
    manageKey: z.string().trim().min(16).max(128),
    role: z.string().trim().min(2).max(160),
    candidate: z.string().trim().max(160).optional(),
    country: countrySchema,
  })
  .strict();

export async function POST(req: Request) {
  const limited = rateLimit(req, "offers", 60, 10 * 60 * 1000);
  if (limited) return limited;
  const { data, res } = await parseBody(req, Body);
  if (res) return res;
  try {
    const store = getStore();
    const emp = await store.getEmployerByKey(data.manageKey);
    if (!emp) return notFound("No employer for that manage key");
    if (!emp.verified_at) return json({ error: "Employer is not verified yet. Publish the DNS record and call /api/employers/verify first." }, 403);
    const row: OfferRow = {
      id: shortId(),
      created_at: new Date().toISOString(),
      token: randomToken(16),
      employer_id: emp.id,
      role: data.role,
      candidate: data.candidate || null,
      country: data.country,
      views: 0,
    };
    await store.createOffer(row);
    return json({ token: row.token, url: "/o/" + row.token, id: row.id }, 201);
  } catch (err) {
    return fail(err, "Could not create offer");
  }
}
