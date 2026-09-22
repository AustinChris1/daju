import { getStore } from "@/lib/store";
import { bad, fail, json, notFound } from "../../_lib/http";

const ID_RE = /^[A-Za-z0-9]{6,32}$/;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id)) return bad("Invalid check id");
  try {
    const row = await getStore().getCheck(id);
    if (!row) return notFound("No check with that id");
    return json({ report: row.report });
  } catch (err) {
    return fail(err, "Could not load check");
  }
}
