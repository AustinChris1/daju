import { getStore } from "@/lib/store";
import { bad, fail, json, notFound } from "../../_lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return bad("Invalid offer token");
  try {
    const offer = await getStore().getOffer(token);
    if (!offer) return notFound("No offer with that token");
    return json({
      offer: { role: offer.role, candidate: offer.candidate, country: offer.country, created_at: offer.created_at, views: offer.views },
      employer: { company: offer.employer.company, domain: offer.employer.domain, verified_at: offer.employer.verified_at, method: offer.employer.method },
    });
  } catch (err) {
    return fail(err, "Could not load offer");
  }
}
