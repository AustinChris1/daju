import Link from "next/link";
import { ArrowRight, FileCheck2, Landmark, ScanSearch, Send } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { COUNTRIES, type Country } from "@/lib/countries";
import { registryStats } from "@/lib/registry/load";
import { allLureSources } from "@/lib/law";
import { SAMPLES } from "@/lib/samples";
import { HeroDemo } from "@/components/home/HeroDemo";
import { PhotoBand } from "@/components/home/PhotoBand";
import { CountUp, Reveal } from "@/components/home/Reveal";
import { Stamp } from "@/components/brand/Stamp";

const PROOF: { n: string; what: string; src: string; url: string }[] = [
  { n: "751", what: "Kenyans rescued from Myanmar scam compounds since 2022, plus 393 from Cambodia in the first four months of 2026", src: "Kenya MFA to the Senate, May 2026", url: "https://eastleighvoice.co.ke/news/346129/myanmar-at-centre-of-kenyas-labour-trafficking-crisis-over-750-rescued-since-2022" },
  { n: "156", what: "Nigerians rescued from online scam centres between January and July 2026, lured with fake jobs in IT, marketing and customer service", src: "NAPTIP, July 2026", url: "https://gazettengr.com/naptip-warns-social-media-fake-job-scams-fuelling-human-trafficking/" },
  { n: "275", what: "recruitment agency licences revoked by Uganda's labour ministry in one April 2026 shake-up", src: "PML Daily, April 2026", url: "https://pmldaily.com/business/2026/04/ministry-delicenses-275-recruitment-agencies-in-major-regulatory-shake-up.html" },
  { n: "8 Sept", what: "2026: Ghana announced it will publish its list of licensed recruitment agencies to curb trafficking", src: "GBC, September 2026", url: "https://www.gbcghanaonline.com/general/recruitment-ablakwa/2026/" },
];

const STEPS = [
  { icon: ScanSearch, t: "Reads the message", d: "Names, phone numbers, emails, domains, amounts, destinations and job titles, straight from what you pasted." },
  { icon: Landmark, t: "Looks up the register", d: "All four countries at once. Name on file is not enough: the number and email in the message are compared to the record." },
  { icon: FileCheck2, t: "Applies the published warnings", d: "Fee before work, Thailand customer-service, Alabuga, one-way tickets. Offer letters get six clauses checked against the labour Act, with the section." },
  { icon: Send, t: "Hands you the reply", d: "English, Pidgin, Igbo, Yoruba, Hausa, Swahili, Luganda or Twi, plus the official hotline. Send it from the card." },
];

export default function Home() {
  const stats = registryStats();
  const total = stats.reduce((a, s) => a + s.count, 0);
  const sources = allLureSources();

  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <p className="condensed text-[0.7rem] text-toner-2">{BRAND.meaning}</p>
            <h1 className="display mt-3 text-[clamp(2.3rem,7vw,4.4rem)] leading-[0.96]">{BRAND.tagline}</h1>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-toner-2">
              Paste a job ad, a recruiter&apos;s WhatsApp message or an offer letter. {BRAND.name} reads the name, number and email, looks them up in the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana, and hands you the reply to send.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/check" className="lift inline-flex items-center gap-2 bg-stamp px-5 py-3 text-sm font-bold tab text-paper no-underline hover:bg-stamp-hover">
                Check an offer <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/employers" className="lift inline-flex items-center gap-2 border border-toner px-5 py-3 text-sm font-bold tab text-toner no-underline hover:bg-paper-2">
                I&apos;m an employer
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm">
              <span className="stamp text-stamp text-base">On file</span>
              <span className="stamp text-red text-base">Stop</span>
              <span className="text-toner-2">It never says safe.</span>
            </div>
          </div>
          <div>
            <HeroDemo />
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLES.slice(0, 3).map((s) => (
                <Link key={s.id} href={`/check?text=${encodeURIComponent(s.text)}&country=${s.country}`} className="rounded-xs border border-rule px-2.5 py-1 text-xs text-toner-2 no-underline hover:border-toner hover:text-toner">
                  Run it: {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-rule bg-paper-2">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="condensed text-[0.7rem] text-toner-2">Registers on file, snapshot dates included</p>
          <ul className="mt-4 grid gap-5 sm:grid-cols-4">
            {stats.map((s, i) => {
              const c = COUNTRIES[s.country as Country];
              return (
                <Reveal as="li" key={s.country} delay={i * 70} className="border-l border-rule pl-3">
                  <p className="font-mono text-3xl">
                    <CountUp value={s.count} />
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {c.flag} {c.registry.short}
                  </p>
                  <p className="text-xs text-toner-2">
                    {c.registry.what}. As of {s.as_of}.{s.active !== s.count ? ` ${s.active.toLocaleString()} active.` : ""}
                  </p>
                </Reveal>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-toner-2">
            {total.toLocaleString()} records, re-snapshotted by script, never scraped during a check. <Link href="/method" className="text-toner-2">Method and caveats</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,3.5vw,2.3rem)]">What one check does</h2>
        </Reveal>
        <ol className="mt-8 grid gap-8 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 90}>
              <div className="reveal-line h-px w-full bg-toner" />
              <div className="mt-4 flex items-center gap-2">
                <span className="font-mono text-sm text-toner-2">{i + 1}.</span>
                <s.icon className="h-5 w-5 text-stamp" aria-hidden />
              </div>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-toner-2">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <PhotoBand />

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-16 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,3.5vw,2.3rem)]">Employers: issue offers nobody can borrow</h2>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-toner-2">
            Scammers reuse your company name with their own WhatsApp number. Prove you control your domain once, with one DNS record, and every offer you issue gets a link that shows the candidate a verified sender the moment they paste it into a check.
          </p>
          <ol className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3"><span className="font-mono text-toner-2">1.</span> Register your company domain. No account, one key.</li>
            <li className="flex gap-3"><span className="font-mono text-toner-2">2.</span> Add the TXT record we give you. Verification is automatic.</li>
            <li className="flex gap-3"><span className="font-mono text-toner-2">3.</span> Issue an offer link per candidate. Their check stamps it as verified.</li>
          </ol>
          <Link href="/employers" className="lift mt-6 inline-flex items-center gap-2 bg-stamp px-4 py-2.5 text-sm font-bold tab text-paper no-underline hover:bg-stamp-hover">
            Verify my company <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
        <Reveal delay={120} className="sheet p-6">
          <p className="condensed text-[0.7rem] text-toner-2">What the candidate sees</p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">Verified sender, no lure signals found</p>
              <p className="mt-1 text-sm text-toner-2">Sender verified: the company proved control of its domain by DNS record. A verified sender can still send a bad contract; read the clauses.</p>
            </div>
            <Stamp level="on_file" size="sm" animate={false} />
          </div>
          <p className="mt-5 text-xs text-toner-2">Illustrative card. Real cards carry the check id, the snapshot dates and the verification date.</p>
        </Reveal>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <Reveal>
            <h2 className="display text-[clamp(1.6rem,3.5vw,2.3rem)]">Why a check, and why now</h2>
          </Reveal>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {PROOF.map((p, i) => (
              <Reveal as="li" key={p.n} delay={i * 80}>
                <div className="reveal-line h-px w-full bg-toner" />
                <p className="display mt-4 text-4xl">{/^\d+$/.test(p.n) ? <CountUp value={parseInt(p.n, 10)} /> : p.n}</p>
                <p className="mt-2 max-w-[48ch] text-sm leading-relaxed">{p.what}</p>
                <a href={p.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-toner-2">
                  {p.src}
                </a>
              </Reveal>
            ))}
          </ul>
          <p className="mt-8 max-w-[68ch] text-sm text-toner-2">
            The lure rules in every check cite the official warning they come from. {sources.length} sources on file, quoted verbatim on the <Link href="/method" className="text-toner-2">method page</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
