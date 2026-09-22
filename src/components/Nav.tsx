"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Mark";
import { ThemeToggle } from "@/components/ThemeToggle";

const TABS: { href: string; label: string; hint: string }[] = [
  { href: "/check", label: "Check", hint: "Paste an offer" },
  { href: "/registry", label: "Registers", hint: "Four countries, one search" },
  { href: "/employers", label: "Employers", hint: "Verified sender links" },
  { href: "/hotlines", label: "Hotlines", hint: "Who to call" },
  { href: "/docs", label: "Docs", hint: "How it works" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

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

  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="no-underline" aria-label="Daju home">
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={`pill text-sm no-underline ${isActive(t.href) ? "bg-stamp text-paper" : "text-toner hover:bg-paper-2"}`}>
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/check" className="lift inline-flex items-center gap-1.5 rounded-full bg-toner px-4 py-2 text-sm font-bold text-paper no-underline hover:bg-stamp">
            Check an offer <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} className="rounded-full p-2 text-toner hover:bg-paper-2">
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="menu-sheet md:hidden" data-closed={open ? undefined : ""} aria-hidden={!open} inert={!open}>
        <nav aria-label="Primary mobile" className="mx-auto max-w-6xl px-4 pb-6 pt-2">
          <ul className="space-y-1">
            {TABS.map((t, i) => (
              <li key={t.href} className="menu-item" style={{ animationDelay: open ? `${60 + i * 40}ms` : "0ms" }}>
                <Link href={t.href} onClick={() => setOpen(false)} className={`flex items-center justify-between rounded-xl px-3 py-3 no-underline ${isActive(t.href) ? "bg-stamp text-paper" : "text-toner hover:bg-paper-2"}`}>
                  <span className="font-bold">{t.label}</span>
                  <span className={`text-xs ${isActive(t.href) ? "text-paper/80" : "text-toner-2"}`}>{t.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/check" onClick={() => setOpen(false)} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-toner px-4 py-3 text-sm font-bold text-paper no-underline">
            Check an offer <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </nav>
      </div>
      {open && <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 top-[60px] z-30 bg-toner/30 md:hidden" />}
    </header>
  );
}
