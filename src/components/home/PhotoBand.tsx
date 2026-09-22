import Image from "next/image";
import { StampCard } from "./StampCard";

// Two photographs from the scene the product lives in, and one authored panel the visitor can stamp.
export function PhotoBand() {
  return (
    <section className="border-y border-rule bg-paper-2" aria-label="Where the offers arrive">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <figure className="duotone relative aspect-[4/5] overflow-hidden rounded-[4px] border border-rule bg-toner">
            <Image src="/images/lagos-phones.jpg" alt="Two young people in Lagos reading a message on one phone" fill sizes="(min-width: 768px) 33vw, 100vw" className="parallax-img object-cover" priority={false} />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-toner/80 to-transparent p-4 font-mono text-xs text-paper">
              The offer arrives on WhatsApp. So does the check.
            </figcaption>
          </figure>
          <StampCard />
          <figure className="duotone relative aspect-[4/5] overflow-hidden rounded-[4px] border border-rule bg-toner">
            <Image src="/images/is-this-real.jpg" alt="A woman holding up a phone and pointing at it" fill sizes="(min-width: 768px) 33vw, 100vw" className="parallax-img object-cover object-[35%_center]" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-toner/80 to-transparent p-4 font-mono text-xs text-paper">
              “Is this one real?” Paste it and find out in the next minute.
            </figcaption>
          </figure>
        </div>
        <p className="mt-3 text-[0.65rem] text-toner-2">Photographs by Francis Odeyemi and Ahmed Nasiru on Unsplash.</p>
      </div>
    </section>
  );
}
