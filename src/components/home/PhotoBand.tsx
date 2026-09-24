import Image from "next/image";
import { StampCard } from "./StampCard";

export interface Photo {
  src: string;
  alt: string;
  caption: string;
  position?: string;
}

// Photographs from the scene the product lives in, and one authored panel the visitor can stamp.
export function PhotoBand({ photos }: { photos: Photo[] }) {
  const [first, ...rest] = photos;
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-label="Where the offers arrive">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {first && <PhotoFigure p={first} speed={0.1} />}
        <StampCard />
        {rest.map((p, i) => (
          <PhotoFigure key={p.src} p={p} speed={0.16 + i * 0.06} />
        ))}
      </div>
      <p className="mt-3 text-[0.7rem] text-toner-2">Photographs by Francis Odeyemi, Ahmed Nasiru and Dwayne Joe on Unsplash.</p>
    </section>
  );
}

// Each photograph is taller than its frame and drifts at its own speed as the page scrolls.
function PhotoFigure({ p, speed }: { p: Photo; speed: number }) {
  return (
    <figure className="relative aspect-4/5 overflow-hidden rounded-2xl bg-paper-2">
      <div data-fx="drift" data-speed={speed} className="absolute inset-x-0 -inset-y-[14%]">
        <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" style={p.position ? { objectPosition: p.position } : undefined} />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#171528]/85 to-transparent p-4 pt-10 text-sm font-semibold text-[#f4f1ea]">{p.caption}</figcaption>
    </figure>
  );
}
