"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { setStored, storageKey, useStoredValue } from "@/lib/useStored";

const KEY = storageKey("theme");

function apply(t: string | null) {
  const root = document.documentElement;
  if (t === "dark" || t === "light") root.setAttribute("data-theme", t);
  else root.removeAttribute("data-theme");
  root.classList.toggle("dark", t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches));
}

export function ThemeToggle() {
  const stored = useStoredValue(KEY);

  useEffect(() => {
    let t = stored;
    try {
      const q = new URLSearchParams(window.location.search).get("theme");
      if (q === "dark" || q === "light") t = q;
    } catch {}
    apply(t);
  }, [stored]);

  function toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    setStored(KEY, isDark ? "light" : "dark");
  }

  return (
    <button type="button" onClick={toggle} className="rounded-xs p-2 text-toner-2 hover:text-toner" aria-label="Switch between the photocopy and the carbon copy" title="Theme">
      <Sun className="h-4 w-4 dark:hidden" aria-hidden />
      <Moon className="hidden h-4 w-4 dark:block" aria-hidden />
    </button>
  );
}
