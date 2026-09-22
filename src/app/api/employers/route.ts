import { BRAND_KEY } from "@/lib/brand";
import { z } from "zod";
import { shortId } from "@/lib/check/engine";
import { domainOf, isFreeMail } from "@/lib/registry/match";
import { getStore, type EmployerRow } from "@/lib/store";
import { bad, countrySchema, fail, json, parseBody, randomAlnum, randomToken } from "../_lib/http";

const DOMAIN_RE = /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const Body = z
  .object({
    company: z.string().trim().min(2).max(120),
    domain: z.string().trim().min(3).max(253),
    country: countrySchema,
    contactEmail: z.string().trim().max(200),
  })
  .strict();

export async function POST(req: Request) {
  const { data, res } = await parseBody(req, Body);
  if (res) return res;

  const domain = data.domain.toLowerCase().replace(/\/.*$/, "").replace(/^www\./, "");
  if (/^[a-z]+:\/\//i.test(data.domain) || data.domain.includes("/")) return bad("domain must be a bare host like example.com, no protocol or path");
  if (!domain.includes(".") || !DOMAIN_RE.test(domain)) return bad("domain must be a valid host name containing a dot");
  if (isFreeMail(domain)) return bad("Free-mail domains cannot be verified as an employer. Use your company's own domain.");

  const contactEmail = data.contactEmail.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(contactEmail)) return bad("contactEmail must be a valid email address");
  const emailDomain = domainOf(contactEmail);
  if (emailDomain !== domain && !(emailDomain ?? "").endsWith("." + domain)) return bad(`contactEmail must be on ${domain}`);

  try {
    const row: EmployerRow = {
      id: shortId(),
      created_at: new Date().toISOString(),
      company: data.company,
      domain,
      country: data.country,
      contact_email: contactEmail,
      method: null,
      verified_at: null,
      dns_token: `${BRAND_KEY}-verify=` + randomAlnum(24),
      email_code: null,
      manage_key: randomToken(32),
    };
    await getStore().createEmployer(row);
    return json(
      {
        employerId: row.id,
        manageKey: row.manage_key,
        dnsRecord: { host: `_${BRAND_KEY}.` + domain, type: "TXT", value: row.dns_token },
      },
      201,
    );
  } catch (err) {
    return fail(err, "Could not register employer");
  }
}
