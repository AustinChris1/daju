import Image from "next/image";
import { Reveal } from "./Reveal";

// Real screens of the live app, captured by scripts/app-shots.mjs. Nothing here is a mock-up.
const SHOTS: { src: string; alt: string; title: string; note: string; tilt: string; speed: number }[] = [
  { src: "/images/app-card.png", alt: "A Daju card stamped STOP: name is on file, contact is not", title: "The card", note: "The register row, the contact on file, the stamp.", tilt: "lg:-rotate-3 lg:translate-y-6", speed: 0.05 },
  { src: "/images/app-registers.png", alt: "The registers page showing what moved this week", title: "What moved", note: "Four registers re-read every Monday. Five Ugandan licences left last week.", tilt: "", speed: 0.09 },
  { src: "/images/app-radar.png", alt: "The radar page with live counts of checks and stamps", title: "Radar", note: "Every stamp, counted live.", tilt: "lg:rotate-3 lg:translate-y-6", speed: 0.05 },
];

export function AppShots() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="shots">
      <Reveal>
        <h2 id="shots" className="display text-[clamp(1.8rem,4vw,2.8rem)]">
          Less talk. <span className="sweep" data-fx="sweep">Here it is.</span>
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-5">
        {SHOTS.map((s, i) => (
          <Reveal key={s.src} delay={i * 90} className={`flex flex-col items-center ${s.tilt}`}>
            <div className="phone" data-fx="drift" data-speed={s.speed}>
              <div className="phone-screen">
                <Image src={s.src} alt={s.alt} width={390} height={780} unoptimized className="block h-auto w-full" />
              </div>
            </div>
            <p className="mt-5 font-bold">{s.title}</p>
            <p className="mt-1 max-w-[30ch] text-center text-sm text-toner-2">{s.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
