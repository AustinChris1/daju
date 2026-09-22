import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOC_PAGES, renderDoc } from "@/lib/docs";

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
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-bold uppercase tracking-wide text-toner-2">Docs</p>
        <ul className="mt-3 space-y-1">
          {DOC_PAGES.map((d) => (
            <li key={d.slug}>
              <Link href={`/docs/${d.slug}`} className={`block rounded-lg px-3 py-2 text-sm no-underline ${d.slug === slug ? "bg-stamp text-paper" : "text-toner hover:bg-paper-2"}`}>
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <article className="prose-daju max-w-[72ch]">
        <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">{doc.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: doc.html }} />
      </article>
    </div>
  );
}
