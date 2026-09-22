import { isCountry } from "@/lib/countries";
import { getEntry, snapshot } from "@/lib/registry/load";
import { bad, fail, json, notFound } from "../../../_lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ country: string; id: string }> }) {
  const p = await params;
  const country = p.country.toUpperCase();
  const id = p.id.trim();
  if (!isCountry(country)) return bad("country must be one of NG, KE, UG, GH");
  if (!/^[A-Za-z0-9_.:-]{1,64}$/.test(id)) return bad("Invalid entry id");
  try {
    const entry = getEntry(country, id);
    if (!entry) return notFound("No register entry with that id");
    const snap = snapshot(country);
    return json({ country, entry, as_of: snap.as_of, source: snap.source });
  } catch (err) {
    return fail(err, "Could not load entry");
  }
}
