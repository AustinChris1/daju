import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ArrowRight, FileCheck2, Landmark, ScanSearch, Send } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { botLink } from "@/lib/telegram/bot";
import { COUNTRIES, type Country } from "@/lib/countries";
import { registryStats } from "@/lib/registry/load";
import { allLureSources } from "@/lib/law";
import { HeroDemo } from "@/components/home/HeroDemo";
import { PhotoBand, type Photo } from "@/components/home/PhotoBand";
import { CaseSlider } from "@/components/home/CaseSlider";
import { ScrollFx } from "@/components/home/ScrollFx";
import { Faq } from "@/components/home/Faq";
import { AppShots } from "@/components/home/AppShots";
import { Mark } from "@/components/brand/Mark";
import { CountUp, Reveal } from "@/components/home/Reveal";
import { Stamp } from "@/components/brand/Stamp";
import { Flag } from "@/components/brand/Flag";

const PROOF: { n: string; what: string; src: string; url: string }[] = [
  { n: "751", what: "Kenyans rescued from Myanmar scam compounds since 2022, plus 393 from Cambodia in the first four months of 2026", src: "Kenya MFA to the Senate, May 2026", url: "https://eastleighvoice.co.ke/news/346129/myanmar-at-centre-of-kenyas-labour-trafficking-crisis-over-750-rescued-since-2022" },
  { n: "156", what: "Nigerians rescued from online scam centres between January and July 2026, lured with fake jobs in IT, marketing and customer service", src: "NAPTIP, July 2026", url: "https://gazettengr.com/naptip-warns-social-media-fake-job-scams-fuelling-human-trafficking/" },
  { n: "275", what: "recruitment agency licences revoked by Uganda's labour ministry in one April 2026 shake-up", src: "PML Daily, April 2026", url: "https://pmldaily.com/business/2026/04/ministry-delicenses-275-recruitment-agencies-in-major-regulatory-shake-up.html" },
  { n: "8 Sept", what: "2026: Ghana announced it will publish its list of licensed recruitment agencies to curb trafficking", src: "GBC, September 2026", url: "https://www.gbcghanaonline.com/general/recruitment-ablakwa/2026/" },
];

const STEPS = [
  { icon: ScanSearch, t: "Reads the message", d: "Names, phone numbers, emails, domains, amounts, destinations and job titles, straight from what you pasted.", tone: "bg-mark text-mark-text" },
  { icon: Landmark, t: "Looks up the register", d: "All four countries at once. Name on file is not enough: the number and email in the message are compared to the record.", tone: "bg-stamp text-paper" },
  { icon: FileCheck2, t: "Applies the warnings", d: "Fee before work, Thailand customer-service, Alabuga, one-way tickets. Offer letters get six clauses checked against the labour Act.", tone: "bg-red text-paper" },
  { icon: Send, t: "Hands you the reply", d: "English, Pidgin, Igbo, Yoruba, Hausa, Swahili, Luganda or Twi, plus the official hotline. Send it from the card.", tone: "bg-green text-paper" },
];

const PHOTOS: Photo[] = [
  { src: "/images/lagos-phones.jpg", alt: "Two young people in Lagos reading a message on one phone", caption: "The offer arrives on WhatsApp. So does the check." },
  { src: "/images/nairobi-crowd.jpg", alt: "A smiling man in a leather jacket among a group of people in Nairobi", caption: "Nairobi, Kampala, Accra, Lagos: one register search." },
  { src: "/images/is-this-real.jpg", alt: "A woman holding up a phone and pointing at it", caption: "“Is this one real?” Find out in the next minute.", position: "35% center" },
];

export default async function Home() {
  const telegram = await botLink();
  const stats = registryStats();
  const total = stats.reduce((a, s) => a + s.count, 0);
  const sources = allLureSources();
  const photos = PHOTOS.filter((p) => existsSync(join(process.cwd(), "public", p.src)));

  return (
    <div>
      <section className="field-violet">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-20">
          <div>
            <p className="muted text-sm font-semibold">{BRAND.meaning}</p>
            <h1 className="display mt-3 text-[clamp(2.5rem,7.5vw,5rem)] leading-[0.95]">
              Is this sender <span className="mark rounded-md px-2">on file?</span>
            </h1>
            <p className="muted mt-6 max-w-[40ch] text-base leading-relaxed sm:text-lg">
              Paste the job message. {BRAND.name} checks the name, number and email against four government registers<span className="hidden sm:inline"> in Nigeria, Kenya, Uganda and Ghana</span>, and hands you the reply to send.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/check" className="lift inline-flex items-center gap-2 rounded-full bg-mark px-6 py-3.5 text-sm font-bold text-mark-text no-underline hover:brightness-95">
                Check an offer <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/employers" className="lift inline-flex items-center gap-2 rounded-full bg-[#f4f1ea]/15 px-6 py-3.5 text-sm font-bold text-[#f4f1ea] no-underline ring-1 ring-inset ring-[#f4f1ea]/40 hover:bg-[#f4f1ea]/25">
                I&apos;m an employer
              </Link>
            </div>
            {telegram && (
              <a href={telegram} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f4f1ea] no-underline opacity-90 hover:underline hover:opacity-100">
                <Send className="h-4 w-4" aria-hidden /> On your phone? Forward the message to the Telegram bot
              </a>
            )}
            <p className="muted mt-6 text-sm">Free. No sign-up. It never says safe.</p>
          </div>
          <div className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-toner shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
              <div data-fx="hero-photo" className="absolute -inset-y-[10%] inset-x-0">
                <Image src="/images/lagos-phones.jpg" alt="Two young people in Lagos reading a message on one phone" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              </div>
            </div>
            <div data-fx="hero-card" className="relative -mt-16 ml-4 mr-0 sm:-mt-24 sm:ml-10 lg:-mt-28 lg:-mr-6">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <CaseSlider />
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card overflow-hidden">
          <div className="grid gap-px bg-rule/60 sm:grid-cols-4">
            {stats.map((s, i) => {
              const c = COUNTRIES[s.country as Country];
              return (
                <Reveal as="div" key={s.country} delay={i * 70} className="bg-paper p-6">
                  <p className="text-4xl font-extrabold tracking-tight text-stamp">
                    <CountUp value={s.count} />
                  </p>
                  <p className="mt-2 font-bold">
                    <Flag code={c.code} /> {c.registry.short}
                  </p>
                  <p className="mt-1 text-sm text-toner-2">
                    {c.registry.what}. Snapshot {s.as_of}.{s.active !== s.count ? ` ${s.active.toLocaleString()} active.` : ""}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-sm text-toner-2">
          {total.toLocaleString()} records on file, re-read every Monday, never scraped during a check. <Link href="/radar">Live radar</Link> · <Link href="/method">Method and caveats</Link>.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <h2 className="display text-[clamp(1.8rem,4vw,2.8rem)]">What <span className="sweep" data-fx="sweep">one check</span> does</h2>
        </Reveal>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 90} className="card p-6">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${s.tone}`}>
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-toner-2">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <AppShots />

      <PhotoBand photos={photos} />

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card overflow-hidden lg:grid lg:grid-cols-[1fr_1fr]">
          <Reveal className="p-8 sm:p-10">
            <p className="text-sm font-bold text-stamp">For employers and recruiters</p>
            <h2 className="display mt-2 text-[clamp(1.8rem,4vw,2.6rem)]">Issue offers <span className="sweep" data-fx="sweep">nobody can borrow</span></h2>
            <p className="mt-4 max-w-[50ch] leading-relaxed text-toner-2">
              Scammers reuse your company name with their own WhatsApp number. Prove you control your domain once, with one DNS record, and every offer link you issue shows the candidate a verified sender the moment they paste it into a check.
            </p>
            <ol className="mt-6 space-y-3 text-sm">
              {["Register your company domain. No account, one key.", "Add the TXT record we give you. Verification is automatic.", "Issue an offer link per candidate. Their check stamps it as verified."].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stamp text-xs font-bold text-paper">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <Link href="/employers" className="lift mt-7 inline-flex items-center gap-2 rounded-full bg-stamp px-6 py-3 text-sm font-bold text-paper no-underline hover:bg-stamp-hover">
              Verify my company <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
          <Reveal delay={120} className="field-violet flex flex-col justify-center p-8 sm:p-10">
            <p className="muted text-xs font-bold uppercase tracking-wide">What the candidate sees</p>
            <div className="sheet mt-4 p-5 text-toner">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">Verified sender, no lure signals found</p>
                  <p className="mt-1 text-sm text-toner-2">The company proved control of its domain by DNS record. A verified sender can still send a bad contract; read the clauses.</p>
                </div>
                <Stamp level="on_file" size="sm" animate={false} />
              </div>
            </div>
            <p className="muted mt-4 text-xs">Illustrative card. Real cards carry the check id, the snapshot dates and the verification date.</p>
          </Reveal>
        </div>
      </section>

      <section className="field-dark">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="display text-[clamp(1.8rem,4vw,2.8rem)]">Why a check, and <span className="sweep" data-fx="sweep">why now</span></h2>
          </Reveal>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROOF.map((p, i) => (
              <Reveal as="li" key={p.n} delay={i * 80}>
                <p data-fx="pop" className="text-5xl font-extrabold tracking-tight text-mark">{/^\d+$/.test(p.n) ? <CountUp value={parseInt(p.n, 10)} /> : p.n}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#f4f1ea]/85">{p.what}</p>
                <a href={p.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#f4f1ea]/60">
                  {p.src}
                </a>
              </Reveal>
            ))}
          </ul>
          <p className="mt-10 max-w-[68ch] text-sm text-[#f4f1ea]/70">
            The lure rules in every check cite the official warning they come from. {sources.length} sources on file, quoted verbatim on the{" "}
            <Link href="/method" className="text-[#f4f1ea]">
              method page
            </Link>
            .
          </p>
        </div>
      </section>

      <Faq />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card field-violet relative flex flex-col items-start gap-6 overflow-hidden p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div data-fx="seal" className="pointer-events-none absolute -right-10 -top-10 opacity-0 sm:right-1/3" aria-hidden>
            <Mark size={220} ink="rgba(244,241,234,0.14)" title="" />
          </div>
          <div className="relative">
            <h2 className="display text-[clamp(1.6rem,3.5vw,2.4rem)]">Before you reply, <span className="sweep" data-fx="sweep">be sure.</span></h2>
            <p className="muted mt-2 max-w-[48ch]">Dájú is Yoruba for certain. The check takes the time it takes to read the message.</p>
          </div>
          <Link href="/check" className="lift relative inline-flex items-center gap-2 rounded-full bg-mark px-6 py-3.5 text-sm font-bold text-mark-text no-underline hover:brightness-95">
            Check an offer <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
      <ScrollFx />
    </div>
  );
}
