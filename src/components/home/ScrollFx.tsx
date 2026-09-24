"use client";

import { useEffect } from "react";

// Scroll-scrubbed motion for the landing page. Scrubbing follows the scrollbar, so every effect plays forwards on
// the way down and backwards on the way up. Elements opt in with data-fx; nothing here touches layout properties.
export function ScrollFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let cleanup = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        // Photographs drift slower than the page, each at its own speed.
        gsap.utils.toArray<HTMLElement>("[data-fx='drift']").forEach((el) => {
          const speed = parseFloat(el.dataset.speed ?? "0.12");
          gsap.fromTo(el, { yPercent: -speed * 100 }, { yPercent: speed * 100, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } });
        });
        // The hero photo sinks as the visitor leaves it, and the replay card rides up over it.
        const heroPhoto = document.querySelector<HTMLElement>("[data-fx='hero-photo']");
        if (heroPhoto) gsap.to(heroPhoto, { yPercent: 14, ease: "none", scrollTrigger: { trigger: heroPhoto, start: "top top", end: "bottom top", scrub: true } });
        const heroCard = document.querySelector<HTMLElement>("[data-fx='hero-card']");
        if (heroCard) gsap.to(heroCard, { yPercent: -8, ease: "none", scrollTrigger: { trigger: heroCard, start: "top 80%", end: "bottom top", scrub: true } });
        // Highlighter sweeps across the key phrase of each heading as it comes into view.
        // Light text turns to ink as the yellow covers it, so the phrase stays readable at every point of the sweep.
        const ink = getComputedStyle(document.documentElement).getPropertyValue("--mark-text").trim() || "#121212";
        gsap.utils.toArray<HTMLElement>("[data-fx='sweep']").forEach((el) => {
          gsap.fromTo(el, { backgroundSize: "0% 48%", color: getComputedStyle(el).color }, { backgroundSize: "100% 48%", color: ink, ease: "none", scrollTrigger: { trigger: el, start: "top 88%", end: "top 55%", scrub: 0.4 } });
        });
        // Big numbers in the proof band tighten into place.
        gsap.utils.toArray<HTMLElement>("[data-fx='pop']").forEach((el, i) => {
          gsap.fromTo(el, { transform: "translateY(24px) scale(0.94)", opacity: 0.4 }, { transform: "translateY(0px) scale(1)", opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: `top ${92 - i * 2}%`, end: "top 62%", scrub: 0.3 } });
        });
        // The seal in the closing band turns with the page, like a stamp being set down.
        const seal = document.querySelector<HTMLElement>("[data-fx='seal']");
        if (seal) gsap.fromTo(seal, { rotate: -18, scale: 0.9, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: seal, start: "top 95%", end: "top 55%", scrub: 0.4 } });
      });
      cleanup = () => ctx.revert();
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  return null;
}
