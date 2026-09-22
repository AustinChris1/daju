import { z } from "zod";
import { getStore } from "@/lib/store";
import { translateReply } from "@/lib/extract/llm";
import { bad, fail, json, notFound, parseBody, rateLimit } from "../../../_lib/http";

const ID_RE = /^[A-Za-z0-9]{6,32}$/;
const Body = z.object({ lang: z.enum(["ig", "yo", "ha", "sw", "lg", "tw"]) }).strict();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id)) return bad("Invalid check id");
  const limited = rateLimit(req, "translate", 30, 10 * 60 * 1000);
  if (limited) return limited;
  const { data, res } = await parseBody(req, Body);
  if (res) return res;
  try {
    const row = await getStore().getCheck(id);
    if (!row) return notFound("No check with that id");
    const en = row.report.actions?.replies?.en;
    if (!en) return bad("This check has no English reply to translate");
    const text = await translateReply(en, data.lang);
    if (text == null) return json({ text: null, reason: "translation unavailable" });
    return json({ text });
  } catch (err) {
    return fail(err, "Translation failed");
  }
}
