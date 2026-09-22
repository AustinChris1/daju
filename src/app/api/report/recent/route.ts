import { getStore, type ReportRow } from "@/lib/store";
import { fail, json } from "../../_lib/http";

// Middle-masks a reported value so the feed shows a shape, not a full identifier.
function mask(kind: ReportRow["kind"], v: string): string {
  if (kind === "phone") {
    const digits = v.replace(/\D/g, "");
    if (digits.length < 8) return v.slice(0, 2) + "***";
    const head = v.startsWith("+") ? "+" + digits.slice(0, 4) : digits.slice(0, 4);
    return head + "***" + digits.slice(-4);
  }
  if (kind === "email") {
    const at = v.indexOf("@");
    if (at <= 0) return "***";
    return v[0] + "***@" + v.slice(at + 1);
  }
  if (kind === "domain") {
    const dot = v.lastIndexOf(".");
    if (dot <= 1) return v[0] + "***";
    return v[0] + "***" + v.slice(Math.max(dot - 1, 1));
  }
  // name: keep the first word, mask the rest
  const words = v.split(" ");
  return words.length > 1 ? words[0] + " ***" : v.slice(0, 3) + "***";
}

export async function GET() {
  try {
    const rows = await getStore().recentReports(20);
    return json({
      reports: rows.map((r) => ({ kind: r.kind, value: mask(r.kind, r.value), country: r.country, created_at: r.created_at })),
    });
  } catch (err) {
    return fail(err, "Could not load recent reports");
  }
}
