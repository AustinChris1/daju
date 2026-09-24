import { z } from "zod";
import { getStore } from "@/lib/store";
import { bad, fail, json, notFound, parseBody } from "../../_lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9]{6,20}$/.test(id)) return bad("Invalid job id");
  try {
    const job = await getStore().getJob(id);
    if (!job || !job.public) return notFound("No such job");
    return json({ job });
  } catch (err) {
    return fail(err, "Could not load the job");
  }
}

const Patch = z.object({ manageKey: z.string().min(16).max(128), public: z.boolean() }).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, res } = await parseBody(req, Patch);
  if (res) return res;
  try {
    const store = getStore();
    const emp = await store.getEmployerByKey(data.manageKey);
    if (!emp) return notFound("No employer for that key");
    await store.setJobPublic(id, emp.id, data.public);
    return json({ ok: true });
  } catch (err) {
    return fail(err, "Could not update the job");
  }
}
