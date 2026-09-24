import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getStore } from "@/lib/store";
import { COUNTRIES } from "@/lib/countries";
import { OfficialBox } from "@/components/ui";

export const dynamic = "force-dynamic";
const MODE: Record<string, string> = { onsite: "On site", hybrid: "Hybrid", remote: "Remote" };

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = await getStore().getJob(id);
  return { title: job ? `${job.title} at ${job.employer.company}` : "Job not found" };
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = await getStore().getJob(id);
  if (!job || !job.public || !job.employer.verified_at) notFound();
  const c = COUNTRIES[job.country];
  const subject = encodeURIComponent(`Application: ${job.title}`);
  const checkPrefill = encodeURIComponent(`${job.employer.company}\n${job.apply_email}`);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/jobs" className="text-sm text-toner-2">All verified jobs</Link>
      <div className="card mt-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)]">{job.title}</h1>
            <p className="mt-2 text-toner-2">
              {job.employer.company} · {c.flag} {job.location} · {MODE[job.mode]}
              {job.salary ? ` · ${job.salary}` : ""}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1.5 text-sm font-bold text-green">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Verified sender
          </span>
        </div>
        <p className="mt-6 whitespace-pre-wrap text-[0.95rem] leading-relaxed">{job.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`mailto:${job.apply_email}?subject=${subject}`} className="lift inline-flex items-center gap-2 rounded-full bg-stamp px-5 py-2.5 text-sm font-bold text-paper no-underline hover:bg-stamp-hover">
            Apply to {job.apply_email}
          </a>
          <Link href={`/check?text=${checkPrefill}&country=${job.country}`} className="inline-flex items-center gap-2 rounded-full border border-toner px-5 py-2.5 text-sm font-bold text-toner no-underline hover:bg-paper-2">
            Check a message about this role
          </Link>
        </div>
        <p className="mt-6 max-w-[60ch] text-sm text-toner-2">
          {job.employer.company} proved control of <span className="font-mono">{job.employer.domain}</span> by {job.employer.method?.toUpperCase() ?? "DNS"} record on {job.employer.verified_at!.slice(0, 10)}. Only messages from that domain are from them. Nobody hiring for this role will ask you for a fee.
        </p>
        <div className="mt-8">
          <OfficialBox rows={[["Job", job.id], ["Posted", job.created_at.slice(0, 10)], ["Domain", job.employer.domain], ["Verified", job.employer.verified_at!.slice(0, 10)], ["Opened", String(job.views)]]} />
        </div>
      </div>
    </div>
  );
}
