import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getStore } from "@/lib/store";

import { Flag } from "@/components/brand/Flag";

export const metadata: Metadata = { title: "Verified jobs" };
export const dynamic = "force-dynamic";

const MODE: Record<string, string> = { onsite: "On site", hybrid: "Hybrid", remote: "Remote" };

export default async function JobsPage() {
  const jobs = await getStore().listJobs(100).catch((err) => {
    console.error("listJobs failed", err instanceof Error ? err.message : err);
    return [];
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-sm font-bold text-stamp">Verified jobs</p>
      <h1 className="display mt-2 text-[clamp(1.8rem,4vw,2.8rem)]">Every role here comes from an employer who proved their domain</h1>
      <p className="mt-3 max-w-[60ch] text-toner-2">
        No agency, no middleman, no fee. The apply address is on the company&apos;s own domain, and Daju checked it. If a message about one of these roles comes from anywhere else, paste it into a check.
      </p>

      {jobs.length === 0 ? (
        <div className="card mt-10 p-8 text-center">
          <p className="font-bold">No roles posted yet</p>
          <p className="mt-2 text-sm text-toner-2">Employers: verify your domain and post the first one. It takes one DNS record.</p>
          <Link href="/employers" className="lift mt-5 inline-flex items-center gap-2 rounded-full bg-stamp px-5 py-2.5 text-sm font-bold text-paper no-underline hover:bg-stamp-hover">
            Post a verified role <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="card lift flex h-full flex-col p-6 no-underline">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-toner">{j.title}</p>
                    <p className="mt-1 text-sm text-toner-2">
                      {j.employer.company} · <Flag code={j.country} /> {j.location} · {MODE[j.mode]}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-soft px-2.5 py-1 text-xs font-bold text-green">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Verified
                  </span>
                </div>
                {j.salary && <p className="mt-3 text-sm font-semibold text-toner">{j.salary}</p>}
                <p className="mt-2 line-clamp-3 text-sm text-toner-2">{j.description}</p>
                <p className="mt-auto pt-4 font-mono text-xs text-toner-2">apply: {j.apply_email}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-toner-2">
        Hiring? <Link href="/employers">Verify your domain and post a role</Link>. Job seekers: a verified listing means the sender is real; read the contract before you sign.
      </p>
    </div>
  );
}
