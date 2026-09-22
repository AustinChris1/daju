"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Mark";
import { ThemeToggle } from "@/components/ThemeToggle";

const TABS: { href: string; label: string; hint: string }[] = [
  { href: "/check", label: "Check", hint: "Paste an offer" },
  { href: "/registry", label: "Registers", hint: "Four countries, one search" },
  { href: "/employers", label: "Employers", hint: "Verified sender links" },
  { href: "/report", label: "Report", hint: "Warn the next person" },
  { href: "/hotlines", label: "Hotlines", hint: "Who to call" },
  { href: "/method", label: "Method", hint: "How a check is made" },
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
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-[2px]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="no-underline" aria-label="Daju home">
          <Wordmark />
        </Link>
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 sm:flex">
          <nav aria-label="Primary" className="-mb-3 flex min-w-0 gap-0">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`tab shrink-0 border-b-2 px-3 pb-3 pt-1 no-underline transition-colors duration-150 ${isActive(t.href) ? "border-stamp text-stamp" : "border-transparent text-toner-2 hover:text-toner"}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-xs p-2 text-toner"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className="menu-sheet sm:hidden"
        data-closed={open ? undefined : ""}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label="Primary mobile" className="mx-auto max-w-5xl px-4 pb-6 pt-2">
          <ul className="divide-y divide-rule border-y border-rule">
            {TABS.map((t, i) => (
              <li key={t.href} className="menu-item" style={{ animationDelay: open ? `${60 + i * 40}ms` : "0ms" }}>
                <Link href={t.href} onClick={() => setOpen(false)} className={`flex items-baseline justify-between py-3.5 no-underline ${isActive(t.href) ? "text-stamp" : "text-toner"}`}>
                  <span className="tab text-base">{t.label}</span>
                  <span className="text-xs text-toner-2">{t.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-toner-2">It never says safe. Call the number on the register, not the one in the message.</p>
        </nav>
      </div>
      {open && <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 top-[57px] z-30 bg-toner/30 sm:hidden" />}
    </header>
  );
}
