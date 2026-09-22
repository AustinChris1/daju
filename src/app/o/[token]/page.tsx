import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { getStore } from "@/lib/store";
import { COUNTRIES } from "@/lib/countries";
import { OfficialBox, Sheet } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export async function generateMetadata({ params }: PageProps<"/o/[token]">): Promise<Metadata> {
  const { token } = await params;
  const o = await getStore().getOffer(token);
  return { title: o ? `Offer from ${o.employer.company}` : "Offer not found" };
}

export default async function OfferPage({ params }: PageProps<"/o/[token]">) {
  const { token } = await params;
  const store = getStore();
  const o = await store.getOffer(token);
  if (!o) notFound();
  await store.bumpOfferViews(token);
  const verified = !!o.employer.verified_at;
  const c = COUNTRIES[o.country];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Sheet>
        <p className="condensed text-[0.7rem] text-toner-2">{BRAND.name} offer link</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display text-2xl">{o.role}</h1>
            <p className="mt-1 text-toner-2">
              from <strong className="text-toner">{o.employer.company}</strong> · {c.flag} {c.name}
              {o.candidate ? ` · for ${o.candidate}` : ""}
            </p>
          </div>
          {verified ? (
            <p className="inline-flex items-center gap-2 border border-stamp bg-stamp-soft px-3 py-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-stamp" aria-hidden /> Verified sender
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 border border-amber bg-amber-soft px-3 py-2 text-sm">
              <ShieldOff className="h-5 w-5 text-amber" aria-hidden /> Sender not verified
            </p>
          )}
        </div>
        <p className="mt-5 max-w-[60ch] text-sm leading-relaxed">
          {verified
            ? `${o.employer.company} proved control of ${o.employer.domain} by ${o.employer.method?.toUpperCase()} record on ${o.employer.verified_at!.slice(0, 10)}. This link was issued through that verified account. Any message about this role should come from an address on that domain.`
            : `The company that issued this link has not completed domain verification. Treat it like any other message: check it.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/check?o=${token}`} className="bg-stamp px-4 py-2.5 text-sm font-bold tab text-paper no-underline hover:bg-stamp-hover">
            Check a message about this offer
          </Link>
          <Link href="/employers" className="border border-toner px-4 py-2.5 text-sm font-bold tab text-toner no-underline hover:bg-paper-2">
            How employers verify
          </Link>
        </div>
        <div className="mt-8">
          <OfficialBox rows={[["Offer", token], ["Issued", o.created_at.slice(0, 10)], ["Domain", o.employer.domain], ["Opened", String(o.views + 1)]]} />
        </div>
      </Sheet>
    </div>
  );
}
