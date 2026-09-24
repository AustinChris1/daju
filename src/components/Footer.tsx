import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Wordmark } from "@/components/brand/Mark";
import { SocialIcon, type SocialName } from "@/components/brand/SocialIcon";

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/check", label: "Check an offer" },
      { href: "/registry", label: "Registers" },
      { href: "/jobs", label: "Verified jobs" },
      { href: "/employers", label: "For employers" },
      { href: "/report", label: "Report a contact" },
      { href: "/hotlines", label: "Hotlines" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/radar", label: "Radar: live counts" },
      { href: "/method", label: "How a check is made" },
      { href: "/docs/data-and-limits", label: "Data sources and limits" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/docs/business-model", label: "Business model" },
      { href: "/brand", label: "Brand" },
      { href: "https://github.com/AustinChris1/daju", label: "GitHub", external: true },
    ],
  },
];

export function Footer({ asOf, telegram }: { asOf: { country: string; date: string }[]; telegram?: string | null }) {
  const year = new Date().getFullYear();
  const socials: { href: string | undefined; name: SocialName; label: string }[] = [
    { href: telegram ?? undefined, name: "telegram", label: "Telegram bot" },
    { href: "https://github.com/AustinChris1/daju", name: "github", label: "GitHub" },
    { href: process.env.NEXT_PUBLIC_SOCIAL_X, name: "x", label: "X" },
    { href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, name: "linkedin", label: "LinkedIn" },
    { href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, name: "instagram", label: "Instagram" },
  ];
  return (
    <footer className="mt-20 bg-paper-2">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size={28} />
            <p className="mt-4 max-w-[36ch] text-sm text-toner-2">{BRAND.meaning}. {BRAND.description}</p>
            <p className="mt-4 max-w-[36ch] text-sm text-toner-2">Built in Lagos for job seekers and employers in Nigeria, Kenya, Uganda and Ghana.</p>
            <div className="mt-5 flex items-center gap-2">
              {socials.map((s) =>
                s.href ? (
                  <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label} className="lift inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper text-toner no-underline hover:bg-stamp hover:text-paper">
                    <SocialIcon name={s.name} />
                  </a>
                ) : null,
              )}
            </div>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-toner-2">{c.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="text-toner no-underline hover:text-stamp">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-toner no-underline hover:text-stamp">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-rule pt-6 text-xs text-toner-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {BRAND.name}. Register snapshots: {asOf.map((a) => `${a.country} ${a.date}`).join(" · ")}.</p>
          <p className="max-w-[60ch]">{BRAND.name} shows what public registers and published warnings say, as of the dates above. It never says an offer is safe and it is not legal advice.</p>
        </div>
      </div>
    </footer>
  );
}
