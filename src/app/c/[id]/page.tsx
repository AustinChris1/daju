import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { ReportCard } from "@/components/check/ReportCard";
import { verdictLabel } from "@/lib/check/verdict";
import { BRAND } from "@/lib/brand";

export async function generateMetadata({ params }: PageProps<"/c/[id]">): Promise<Metadata> {
  const { id } = await params;
  const row = await getStore().getCheck(id);
  if (!row) return { title: "Check not found" };
  const r = row.report;
  return {
    title: `${verdictLabel(r.verdict.level)}: ${r.verdict.headline}`,
    description: r.verdict.lines[0],
    openGraph: { title: `${BRAND.name} · ${verdictLabel(r.verdict.level)}`, description: r.verdict.headline },
  };
}

export default async function CardPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const row = await getStore().getCheck(id);
  if (!row) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ReportCard report={row.report} shareUrl={`${siteUrl}/c/${id}`} animate />
      <p className="mt-6 text-sm text-toner-2">
        Someone shared this card with you. <Link href="/check" className="text-stamp">Check your own message</Link>.
      </p>
    </div>
  );
}
