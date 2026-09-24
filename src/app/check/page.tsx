import type { Metadata } from "next";
import { CheckFlow } from "@/components/check/CheckFlow";
import { isCountry } from "@/lib/countries";
import { getStore } from "@/lib/store";
import { botLink } from "@/lib/telegram/bot";
import { Send } from "lucide-react";

export const metadata: Metadata = { title: "Check an offer" };

export default async function CheckPage({ searchParams }: PageProps<"/check">) {
  const sp = await searchParams;
  const text = typeof sp.text === "string" ? sp.text : "";
  const country = typeof sp.country === "string" && isCountry(sp.country) ? sp.country : "auto";
  let prefill = text;
  if (typeof sp.o === "string") {
    const offer = await getStore().getOffer(sp.o);
    if (offer) prefill = `Offer link: ${process.env.NEXT_PUBLIC_SITE_URL || ""}/o/${sp.o}\nRole: ${offer.role}\nFrom: ${offer.employer.company} (${offer.employer.domain})`;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const telegram = await botLink();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)]">Check an offer before you reply</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">Paste the message. The check reads the names, numbers and amounts, looks them up in four government registers, and hands you a reply.</p>
      {telegram && (
        <a href={telegram} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-stamp-soft px-4 py-2 text-sm font-bold text-stamp no-underline hover:bg-stamp hover:text-paper">
          <Send className="h-4 w-4" aria-hidden /> Or forward it to the Telegram bot
        </a>
      )}
      <div className="mt-6">
        <CheckFlow initialText={prefill} initialCountry={country} siteUrl={siteUrl} />
      </div>
    </div>
  );
}
