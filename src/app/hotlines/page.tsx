import type { Metadata } from "next";
import { COUNTRIES, COUNTRY_CODES } from "@/lib/countries";
import { allHotlines } from "@/lib/law";
import { Flag } from "@/components/brand/Flag";

export const metadata: Metadata = { title: "Hotlines" };

const STEPS = [
  "Stop paying. Do not send the next instalment, even if they threaten to cancel the job.",
  "Keep everything: screenshots of the chat, the number, the account you paid into, receipts.",
  "Do not travel on a ticket you did not book yourself, and do not hand your passport to anyone.",
  "Call the register, not the message: the number on the government register is the agency's real line.",
  "Report with the evidence to the agency below for your country, then to your bank if money moved.",
];

export default function HotlinesPage() {
  const h = allHotlines();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)]">Who to call, and what to say</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">Official channels only, each with the page it was taken from. Verified on {h.as_of}.</p>

      <ol className="mt-6 max-w-[68ch] space-y-2 text-[0.95rem]">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-mono text-toner-2">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {COUNTRY_CODES.map((c) => (
          <section key={c}>
            <h2 className="condensed text-[0.8rem] text-toner-2">
              <Flag code={c} /> {COUNTRIES[c].name}
            </h2>
            <ul className="mt-3 divide-y divide-rule border-y border-rule">
              {h[c].map((x) => (
                <li key={x.org + x.value} className="py-3 text-sm">
                  <p className="font-semibold">{x.org}</p>
                  {x.channel === "phone" ? (
                    <a href={`tel:${x.value.replace(/\s/g, "")}`} className="font-mono text-stamp">{x.value}</a>
                  ) : x.channel === "email" ? (
                    <a href={`mailto:${x.value}`} className="font-mono text-stamp">{x.value}</a>
                  ) : (
                    <a href={x.value} target="_blank" rel="noreferrer" className="font-mono text-stamp break-all">{x.value}</a>
                  )}
                  <p className="mt-0.5 text-xs text-toner-2">
                    {x.verified ? "verified" : "unverified"} · <a href={x.source_url} target="_blank" rel="noreferrer" className="text-toner-2">source</a>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12 max-w-[68ch]">
        <h2 className="font-semibold">What to say when you call</h2>
        <p className="mt-2 font-mono text-sm leading-relaxed text-toner-2">
          “I received a job offer from [name] on [date] via [WhatsApp number or email]. They asked me to pay [amount] for [purpose]. I have screenshots and the payment details. I want to report it and confirm whether this agency is licensed.”
        </p>
      </section>
    </div>
  );
}
