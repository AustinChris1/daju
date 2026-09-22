import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DOC_PAGES } from "@/lib/docs";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Docs" };

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-bold text-stamp">Documentation</p>
      <h1 className="display mt-2 text-[clamp(1.8rem,4vw,2.8rem)]">How {BRAND.name} works, and how to use it</h1>
      <p className="mt-3 max-w-[60ch] text-toner-2">Plain explanations of what a check does, where the data comes from, what it cannot know, and how the pieces fit together. The same files live in the repository under <span className="font-mono">docs/</span>.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {DOC_PAGES.map((d) => (
          <li key={d.slug}>
            <Link href={`/docs/${d.slug}`} className="card lift flex h-full flex-col p-6 no-underline">
              <h2 className="text-lg font-bold text-toner">{d.title}</h2>
              <p className="mt-2 text-sm text-toner-2">{d.blurb}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-stamp">
                Read <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
