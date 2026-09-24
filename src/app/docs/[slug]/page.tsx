import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DOC_PAGES, renderDoc } from "@/lib/docs";
import { DocNav } from "@/components/docs/DocNav";
import { Mermaid } from "@/components/docs/Mermaid";

export function generateStaticParams() {
  return DOC_PAGES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = DOC_PAGES.find((d) => d.slug === slug);
  return { title: meta ? `${meta.title} · Docs` : "Docs" };
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const doc = renderDoc(slug);
  if (!doc) notFound();
  const i = DOC_PAGES.findIndex((d) => d.slug === slug);
  const prev = i > 0 ? DOC_PAGES[i - 1] : null;
  const next = i < DOC_PAGES.length - 1 ? DOC_PAGES[i + 1] : null;
  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 px-4 py-10 sm:px-6">
      <p className="text-sm text-toner-2">
        <Link href="/docs" className="text-toner-2 hover:text-stamp">Docs</Link> <span aria-hidden>/</span> {doc.title}
      </p>
      <article className="prose-daju mt-3 min-w-0 max-w-[72ch] break-words">
        <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">{doc.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: doc.html }} />
      </article>
      <Mermaid />
      <nav aria-label="Next and previous" className="mt-12 grid gap-3 border-t border-rule pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} className="card lift flex items-center gap-3 p-4 no-underline">
            <ArrowLeft className="h-4 w-4 shrink-0 text-stamp" aria-hidden />
            <span>
              <span className="block text-xs text-toner-2">Previous</span>
              <span className="font-bold text-toner">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/docs/${next.slug}`} className="card lift flex items-center justify-end gap-3 p-4 text-right no-underline">
            <span>
              <span className="block text-xs text-toner-2">Next</span>
              <span className="font-bold text-toner">{next.title}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-stamp" aria-hidden />
          </Link>
        )}
      </nav>
      <DocNav headings={doc.headings} docs={DOC_PAGES.map((d) => ({ slug: d.slug, title: d.title }))} current={slug} />
    </div>
  );
}
