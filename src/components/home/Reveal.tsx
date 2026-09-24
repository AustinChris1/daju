"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Direction the page is moving, shared by every Reveal so an element entering from above plays the reverse cut.
let lastY = 0;
let dir: "down" | "up" = "down";
let tracking = false;
function track() {
  if (tracking || typeof window === "undefined") return;
  tracking = true;
  lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 2) dir = y > lastY ? "down" : "up";
      lastY = y;
    },
    { passive: true },
  );
}

// Plays its cut each time the element enters the viewport, from below on the way down and from above on the way up.
export function Reveal({ children, className = "", as: Tag = "div", delay = 0 }: { children: ReactNode; className?: string; as?: "div" | "li" | "section"; delay?: number }) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<{ visible: boolean; dir: "down" | "up" }>({ visible: false, dir: "down" });
  useEffect(() => {
    track();
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setState({ visible: true, dir });
          // Only hide again once the element is well outside the viewport, so nothing flickers at the edge.
          else if (e.boundingClientRect.top > window.innerHeight + 80 || e.boundingClientRect.bottom < -80) setState((s) => (s.visible ? { visible: false, dir } : s));
        }
      },
      { rootMargin: "-60px 0px -60px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as React.RefObject<HTMLDivElement>} className={`reveal ${className}`} data-visible={state.visible ? "" : undefined} data-dir={state.dir} style={delay ? { transitionDelay: state.visible ? `${delay}ms` : "0ms" } : undefined}>
      {children}
    </Comp>
  );
}

// Counts from 0 to the value once it is on screen. Tabular digits keep the width stable.
export function CountUp({ value, duration = 900, className = "" }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((entries) => {
      // Start when on screen, or once the reader has scrolled past it.
      if (!entries.some((e) => e.isIntersecting || e.boundingClientRect.top < window.innerHeight)) return;
      io.disconnect();
      if (reduce) return setN(value);
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(value * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {n.toLocaleString()}
    </span>
  );
}
