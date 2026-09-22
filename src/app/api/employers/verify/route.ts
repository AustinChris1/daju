import { BRAND_KEY } from "@/lib/brand";
import { resolveTxt } from "node:dns/promises";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { fail, json, notFound, parseBody, rateLimit } from "../../_lib/http";

const Body = z.object({ manageKey: z.string().trim().min(16).max(128) }).strict();

// Resolves TXT records for a host, flattening chunked records. Never throws; a
// missing or broken host just yields an empty list with a reason.
async function txtRecords(host: string, timeoutMs = 5000): Promise<{ records: string[]; reason: string | null }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("ETIMEOUT")), timeoutMs);
  });
  try {
    const raw = await Promise.race([resolveTxt(host), timeout]);
    return { records: raw.map((chunks) => chunks.join("").trim()), reason: null };
  } catch (err) {
    const code = (err as { code?: string })?.code ?? (err instanceof Error ? err.message : "lookup failed");
    return { records: [], reason: code };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const FRIENDLY: Record<string, string> = {
  ENOTFOUND: "no such host yet",
  ENODATA: "host exists but has no TXT records",
  ETIMEOUT: "DNS lookup timed out",
  ESERVFAIL: "the DNS server failed to answer",
  EREFUSED: "the DNS server refused the query",
};

export async function POST(req: Request) {
  const limited = rateLimit(req, "employers-verify", 20, 10 * 60 * 1000);
  if (limited) return limited;
  const { data, res } = await parseBody(req, Body);
  if (res) return res;
  try {
    const store = getStore();
    const emp = await store.getEmployerByKey(data.manageKey);
    if (!emp) return notFound("No employer for that manage key");

    const hosts = [`_${BRAND_KEY}.` + emp.domain, emp.domain];
    const results = await Promise.all(hosts.map((h) => txtRecords(h)));
    const found = results.flatMap((r) => r.records).filter((r) => new RegExp(`^${BRAND_KEY}-verify=`, "i").test(r));
    const hit = results.some((r) => r.records.some((v) => v === emp.dns_token));

    if (hit) {
      const verified_at = emp.verified_at ?? new Date().toISOString();
      if (!emp.verified_at) await store.updateEmployer(emp.id, { verified_at, method: "dns" });
      return json({ verified: true, checked: hosts, found, verifiedAt: verified_at, method: "dns" });
    }

    const reasons = results.map((r, i) => (r.reason ? `${hosts[i]}: ${FRIENDLY[r.reason] ?? r.reason}` : `${hosts[i]}: no matching record`));
    const reason = found.length
      ? "A verification record was found but it does not match the token issued to this employer. Copy the value exactly."
      : `No matching TXT record yet (${reasons.join("; ")}). DNS changes can take a few minutes to hours to propagate.`;
    return json({ verified: false, checked: hosts, found, reason, expected: emp.dns_token });
  } catch (err) {
    return fail(err, "Verification failed");
  }
}
