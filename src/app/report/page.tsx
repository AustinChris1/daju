import type { Metadata } from "next";
import { getStore } from "@/lib/store";
import { ReportForm } from "@/components/report/ReportForm";

export const metadata: Metadata = { title: "Report a contact" };

function mask(kind: string, v: string) {
  if (kind === "phone") {
    const d = v.replace(/\D/g, "");
    return (v.startsWith("+") ? "+" : "") + d.slice(0, 4) + "***" + d.slice(-4);
  }
  if (kind === "email") return v[0] + "***" + v.slice(v.indexOf("@"));
  if (kind === "domain") return v[0] + "***" + v.slice(v.lastIndexOf(".") - 1);
  return v.split(" ")[0] + " ***";
}

export default async function ReportPage() {
  const recent = await getStore().recentReports(20);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)]">Warn the next person</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">Report the number, email, domain or name that scammed you or someone you know. Every later check that sees the same contact shows the count. Reports are stored masked and never show who reported.</p>
      <div className="mt-6">
        <ReportForm />
      </div>
      <section className="mt-10">
        <p className="condensed text-[0.7rem] text-toner-2">Latest reports</p>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-toner-2">No reports yet on this instance.</p>
        ) : (
          <table className="ledger mt-3 text-sm">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Contact</th>
                <th>Country</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td>{r.kind}</td>
                  <td className="font-mono">{mask(r.kind, r.value)}</td>
                  <td>{r.country ?? ""}</td>
                  <td className="font-mono text-xs text-toner-2">{r.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
