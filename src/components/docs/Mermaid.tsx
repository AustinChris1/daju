"use client";

import { useEffect } from "react";

// Turns ```mermaid blocks from the markdown into SVG on the client, themed to match light or dark mode.
export function Mermaid() {
  useEffect(() => {
    const blocks = [...document.querySelectorAll<HTMLElement>("pre > code.language-mermaid")];
    if (!blocks.length) return;
    let cancelled = false;
    const dark = document.documentElement.dataset.theme === "dark" || (document.documentElement.dataset.theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    import("mermaid").then(async ({ default: mermaid }) => {
      if (cancelled) return;
      const css = getComputedStyle(document.documentElement);
      const v = (name: string) => css.getPropertyValue(name).trim();
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        fontFamily: "var(--font-archivo), system-ui, sans-serif",
        themeVariables: {
          primaryColor: v("--stamp-soft"),
          primaryTextColor: v("--toner"),
          primaryBorderColor: v("--stamp"),
          lineColor: v("--toner-2"),
          secondaryColor: v("--paper-2"),
          tertiaryColor: v("--paper"),
          background: v("--paper"),
          mainBkg: v("--stamp-soft"),
          nodeBorder: v("--stamp"),
          clusterBkg: v("--paper-2"),
          clusterBorder: v("--rule"),
          titleColor: v("--toner"),
          edgeLabelBackground: v("--paper"),
          fontSize: "14px",
          darkMode: dark,
        },
      });
      for (const [i, code] of blocks.entries()) {
        const pre = code.parentElement;
        if (!pre) continue;
        try {
          const { svg } = await mermaid.render(`daju-diagram-${i}`, code.textContent ?? "");
          if (cancelled) return;
          const fig = document.createElement("figure");
          fig.className = "diagram";
          fig.innerHTML = svg;
          pre.replaceWith(fig);
        } catch (err) {
          console.error("mermaid", err);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
