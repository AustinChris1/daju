import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { Mark, Wordmark } from "@/components/brand/Mark";
import { BrandBoard } from "@/components/brand/BrandBoard";
import { Stamp } from "@/components/brand/Stamp";

export const metadata: Metadata = { title: "Brand" };

const TOKENS: { name: string; light: string; dark: string; role: string }[] = [
  { name: "paper", light: "#f7f6f2", dark: "#141416", role: "Ground: the photocopy, or the carbon copy" },
  { name: "toner", light: "#121212", dark: "#edebe6", role: "Text and rules" },
  { name: "stamp", light: "#5e35a1", dark: "#b49be8", role: "One action per screen and the seal itself" },
  { name: "mark", light: "#fff06a", dark: "#c9b93a", role: "Highlighter, only on evidence" },
  { name: "red ink", light: "#b3261e", dark: "#f28b82", role: "The Stop stamp, nothing else" },
];

const DOWNLOADS: { file: string; label: string }[] = [
  { file: "daju-mark.svg", label: "Mark, SVG" },
  { file: "daju-mark-1024.png", label: "Mark, violet on transparent" },
  { file: "daju-mark-white-1024.png", label: "Mark, cream on transparent" },
  { file: "daju-icon-512.png", label: "App icon" },
  { file: "daju-wordmark-light.png", label: "Wordmark for light surfaces" },
  { file: "daju-wordmark-dark.png", label: "Wordmark for dark surfaces" },
  { file: "daju-cover-1500x500.png", label: "Cover, 1500 by 500" },
  { file: "daju-social-1200x630.png", label: "Social card, 1200 by 630" },
  { file: "daju-post-1080x1080.png", label: "Square post" },
  { file: "daju-story-1080x1920.png", label: "Story" },
];

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="condensed text-[0.7rem] text-toner-2">{BRAND.meaning}</p>
      <h1 className="display mt-2 text-[clamp(1.6rem,4vw,2.4rem)]">The mark</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">{BRAND.markMeaning}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-end gap-6">
          <Mark size={120} />
          <Mark size={48} />
          <Mark size={24} />
          <Mark size={16} />
        </div>
        <div className="space-y-4">
          <Wordmark size={44} />
          <div className="flex flex-wrap items-center gap-3">
            <Stamp level="on_file" size="sm" animate={false} />
            <Stamp level="caution" size="sm" animate={false} />
            <Stamp level="stop" size="sm" animate={false} />
            <Stamp level="unknown" size="sm" animate={false} />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">Why the tone marks</h2>
        <p className="mt-2 max-w-[68ch] text-[0.95rem] leading-relaxed">
          Written without tones, <span className="font-mono">daju</span> is four letters. With two high tones it is <span className="wordmark">dájú</span>: certain. Everyone else types the word without them. The identity keeps them, in ink, because they are the difference between a word and its meaning, the way a seal is the difference between a photocopy and a certified true copy.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">Palette</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-5">
          {TOKENS.map((t) => (
            <li key={t.name} className="border border-rule">
              <div className="flex h-14">
                <div className="flex-1" style={{ background: t.light }} />
                <div className="flex-1" style={{ background: t.dark }} />
              </div>
              <div className="p-2 text-xs">
                <p className="font-semibold">{t.name}</p>
                <p className="font-mono text-toner-2">{t.light} · {t.dark}</p>
                <p className="mt-1 text-toner-2">{t.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">Type</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="border border-rule p-4">
            <p className="condensed text-[0.7rem] text-toner-2">Stamps and labels</p>
            <p className="condensed mt-2 text-2xl">Archivo 800, width 75</p>
          </div>
          <div className="border border-rule p-4">
            <p className="condensed text-[0.7rem] text-toner-2">Headings and body</p>
            <p className="display mt-2 text-2xl">Archivo, width 92</p>
          </div>
          <div className="border border-rule p-4">
            <p className="condensed text-[0.7rem] text-toner-2">Evidence and quotes</p>
            <p className="mt-2 font-mono text-2xl">Courier Prime</p>
          </div>
        </div>
      </section>

      <BrandBoard />
      <section className="mt-10">
        <h2 className="condensed text-[0.8rem] text-toner-2">Downloads</h2>
        <p className="mt-2 max-w-[68ch] text-sm text-toner-2">The pack for posts, headers and the submission form. Rendered from the same mark and type as the site.</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOWNLOADS.map((d) => (
            <li key={d.file}>
              <a href={`/brand/${d.file}`} download className="card lift block overflow-hidden no-underline">
                <div className={`flex h-28 items-center justify-center p-3 ${/white|dark/.test(d.file) ? "bg-[#171528]" : "bg-paper-2"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/brand/${d.file}`} alt={d.label} className="max-h-full max-w-full object-contain" loading="lazy" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-toner">{d.label}</p>
                  <p className="font-mono text-xs text-toner-2">{d.file}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
