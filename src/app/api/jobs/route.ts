import { z } from "zod";
import { getStore, type JobRow } from "@/lib/store";
import { shortId } from "@/lib/check/engine";
import { domainOf } from "@/lib/registry/match";
import { bad, countrySchema, fail, json, notFound, parseBody, rateLimit } from "../_lib/http";

const Body = z
  .object({
    manageKey: z.string().min(16).max(128),
    title: z.string().trim().min(3).max(120),
    country: countrySchema,
    location: z.string().trim().min(2).max(120),
    mode: z.enum(["onsite", "hybrid", "remote"]),
    salary: z.string().trim().max(120).optional(),
    description: z.string().trim().min(20).max(2000),
    applyEmail: z.string().trim().toLowerCase().email().max(200),
  })
  .strict();

export async function GET(req: Request) {
  const limit = Math.min(100, Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "50", 10) || 50));
  try {
    const jobs = await getStore().listJobs(limit);
    return json({ jobs });
  } catch (err) {
    return fail(err, "Could not list jobs");
  }
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "jobs", 20, 10 * 60 * 1000);
  if (limited) return limited;
  const { data, res } = await parseBody(req, Body);
  if (res) return res;
  try {
    const store = getStore();
    const emp = await store.getEmployerByKey(data.manageKey);
    if (!emp) return notFound("No employer for that key");
    if (!emp.verified_at) return bad("Verify your domain before posting a role", 403);
    const applyDomain = domainOf(data.applyEmail);
    if (!applyDomain || (applyDomain !== emp.domain && !applyDomain.endsWith("." + emp.domain))) return bad(`The apply address must be on ${emp.domain}`);
    const row: JobRow = {
      id: shortId(),
      created_at: new Date().toISOString(),
      employer_id: emp.id,
      title: data.title,
      country: data.country,
      location: data.location,
      mode: data.mode,
      salary: data.salary || null,
      description: data.description,
      apply_email: data.applyEmail,
      public: true,
      views: 0,
    };
    await store.createJob(row);
    return json({ id: row.id, url: `/jobs/${row.id}` }, 201);
  } catch (err) {
    return fail(err, "Could not post the role");
  }
}
