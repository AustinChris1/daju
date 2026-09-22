"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Mark";
import { ThemeToggle } from "@/components/ThemeToggle";

const TABS: { href: string; label: string }[] = [
  { href: "/check", label: "Check" },
  { href: "/registry", label: "Registers" },
  { href: "/employers", label: "Employers" },
  { href: "/report", label: "Report" },
  { href: "/hotlines", label: "Hotlines" },
  { href: "/method", label: "Method" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="no-underline">
          <Wordmark />
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <nav aria-label="Primary" className="-mb-3 flex min-w-0 gap-0 overflow-x-auto [scrollbar-width:none] sm:[mask-image:none] [mask-image:linear-gradient(to_right,black_88%,transparent)]">
          {TABS.map((t) => {
            const active = path === t.href || (t.href !== "/" && path.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`tab shrink-0 border-b-2 px-3 pb-3 pt-1 no-underline transition-colors ${active ? "border-stamp text-stamp" : "border-transparent text-toner-2 hover:text-toner"}`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
