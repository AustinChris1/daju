import { BRAND_KEY } from "@/lib/brand";
import { getStore } from "@/lib/store";
import { bad, fail, json, notFound } from "../../_lib/http";

export async function GET(req: Request) {
  const key = (new URL(req.url).searchParams.get("key") ?? "").trim();
  if (key.length < 16 || key.length > 128) return bad("key is required");
  try {
    const store = getStore();
    const emp = await store.getEmployerByKey(key);
    if (!emp) return notFound("No employer for that key");
    const offers = await store.listOffers(emp.id);
    // manage_key is what the caller just sent; email_code is an internal secret. dns_token stays: the owner needs it to publish the record.
    const { manage_key: _mk, email_code: _ec, ...employer } = emp;
    void _mk;
    void _ec;
    return json({
      employer: { ...employer, dnsRecord: { host: `_${BRAND_KEY}.` + emp.domain, type: "TXT", value: emp.dns_token } },
      offers: offers.map((o) => ({ id: o.id, token: o.token, url: "/o/" + o.token, role: o.role, candidate: o.candidate, country: o.country, views: o.views, created_at: o.created_at })),
    });
  } catch (err) {
    return fail(err, "Could not load employer");
  }
}
