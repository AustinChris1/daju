"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, List, X } from "lucide-react";

export interface DocHeading {
  id: string;
  text: string;
}
export interface DocLink {
  slug: string;
  title: string;
}

// Floating navigator for a docs page: sections of this page, then the other docs. Sits at the bottom right so
// a reader who has scrolled deep can jump without going back to the top.
export function DocNav({ headings, docs, current }: { headings: DocHeading[]; docs: DocLink[]; current: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Scroll spy: the last heading that has crossed the top third of the viewport is the active one.
  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  const jump = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="doc-nav"
        className="lift fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-toner px-4 py-3 text-sm font-bold text-paper shadow-lg hover:bg-stamp sm:right-6"
      >
        {open ? <X className="h-4 w-4" aria-hidden /> : <List className="h-4 w-4" aria-hidden />}
        {open ? "Close" : "Navigate"}
      </button>

      {open && <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-toner/40 backdrop-blur-[2px]" />}

      <nav
        id="doc-nav"
        aria-label="Documentation"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-x-0 bottom-0 z-40 max-h-[78vh] overflow-y-auto rounded-t-3xl bg-paper p-5 pb-24 shadow-2xl sm:inset-x-auto sm:bottom-20 sm:right-6 sm:w-80 sm:rounded-3xl sm:pb-5 ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
        style={{ transition: "transform 240ms var(--ease-out), opacity 200ms var(--ease-out)" }}
      >
        {headings.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-toner-2">On this page</p>
            <ul className="mt-2 space-y-0.5">
              {headings.map((h) => (
                <li key={h.id}>
                  <button type="button" onClick={() => jump(h.id)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${active === h.id ? "bg-stamp-soft font-bold text-stamp" : "text-toner hover:bg-paper-2"}`}>
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className={headings.length ? "mt-5" : ""}>
          <p className="text-xs font-bold uppercase tracking-wide text-toner-2">Other docs</p>
          <ul className="mt-2 space-y-0.5">
            {docs.map((d) => (
              <li key={d.slug}>
                <Link href={`/docs/${d.slug}`} onClick={() => setOpen(false)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline ${d.slug === current ? "bg-stamp text-paper" : "text-toner hover:bg-paper-2"}`}>
                  <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {d.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/docs" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-toner-2 no-underline hover:bg-paper-2">
                All docs
              </Link>
            </li>
          </ul>
        </section>
      </nav>
    </>
  );
}
