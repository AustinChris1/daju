import { isCountry } from "@/lib/countries";
import { listEntries, searchByName } from "@/lib/registry/load";
import { bad, fail, intParam, json } from "../_lib/http";

const STATUSES = new Set(["all", "active", "inactive", "expired", "revoked", "unknown"]);

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 200);
  const countryRaw = (sp.get("country") ?? "").trim().toUpperCase();
  const status = (sp.get("status") ?? "all").trim().toLowerCase();
  const offset = intParam(sp.get("offset"), 0, 0, 1_000_000);
  const limit = intParam(sp.get("limit"), 50, 1, 200);

  if (countryRaw && !isCountry(countryRaw)) return bad("country must be one of NG, KE, UG, GH");
  if (!STATUSES.has(status)) return bad("status must be one of all, active, inactive, expired, revoked, unknown");

  try {
    if (q && !countryRaw) {
      if (q.length < 3) return bad("q must be at least 3 characters");
      const hits = searchByName(q, { limit });
      return json({
        mode: "search",
        q,
        total: hits.length,
        rows: hits.map((h) => ({ country: h.country, score: h.score, entry: h.entry })),
      });
    }
    if (!isCountry(countryRaw)) return bad("country is required unless q is given");
    const out = listEntries(countryRaw, { q: q || undefined, status, offset, limit });
    return json({ mode: "list", country: countryRaw, offset, limit, ...out });
  } catch (err) {
    return fail(err, "Registry lookup failed");
  }
}
