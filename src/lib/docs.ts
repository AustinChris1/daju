import "server-only";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

export const DOC_PAGES: { slug: string; title: string; blurb: string }[] = [
  { slug: "how-it-works", title: "How a check works", blurb: "What happens to a pasted message, step by step, and what a card cannot tell you." },
  { slug: "how-to-use", title: "How to use Daju", blurb: "For job seekers, for employers, and for developers calling the API." },
  { slug: "architecture", title: "Architecture", blurb: "Modules, data flow, storage, verification, deployment, tests." },
  { slug: "data-and-limits", title: "Data sources and limits", blurb: "The four registers, the law, the warnings, and what Daju does not know." },
  { slug: "business-model", title: "Business model", blurb: "Who pays, and what is not for sale." },
];

const DIR = join(process.cwd(), "docs");

export function docExists(slug: string): boolean {
  return DOC_PAGES.some((d) => d.slug === slug) && existsSync(join(DIR, `${slug}.md`));
}

export function renderDoc(slug: string): { title: string; html: string } | null {
  const meta = DOC_PAGES.find((d) => d.slug === slug);
  if (!meta || !existsSync(join(DIR, `${slug}.md`))) return null;
  const md = readFileSync(join(DIR, `${slug}.md`), "utf8").replace(/^# .*\n/, "");
  const html = marked.parse(md, { async: false }) as string;
  return { title: meta.title, html };
}
