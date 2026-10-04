import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StarRow } from "@/components/shared/star-row";

const specs = [
  "Heavyweight cotton",
  "Glazed stoneware",
  "Insulated flasks",
  "Structured caps",
  "Real-time UV mapping",
  "Zero minimums",
];

const swatches = ["#ffffff", "#c6f135", "#2a2a2c", "#6b6a63", "#1b1b1d"];

const chips = [
  "360° interactive view",
  "Matte 1.8/6 food-grade steel",
  "Precision laser engraving",
];

export function Hero() {
  return (
    <section className="px-4 pt-4 sm:px-6">
      <div className="from-deck via-deck to-stage ring-foreground/10 relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[28px] ring-1 sm:rounded-[32px]">
        <div
          aria-hidden
          className="from-foreground/[0.07] pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b to-transparent"
        />

        <div className="relative grid grid-cols-1 gap-12 px-6 pt-14 pb-10 lg:grid-cols-12 lg:gap-8 lg:px-14 lg:pt-20 lg:pb-12">
          <div className="flex flex-col items-start gap-7 lg:col-span-7">
            <span className="bg-foreground/[0.06] text-foreground inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.14em] uppercase">
              <span className="bg-signal size-1.5 rounded-full" />
              Next-gen realtime 3D studio
            </span>

            <h1 className="type-display-hero-mobile text-foreground leading-[0.94] font-medium tracking-[-0.04em] sm:text-[64px] lg:text-[80px]">
              See it.
              <br />
              Shape it.
              <br />
              <span className="text-signal">Own it.</span>
            </h1>

            <p className="type-body-lg text-muted-foreground max-w-md">
              Physical objects shaped and customized in real-time. Photorealistic studio preview
              with zero latency.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="type-title-md h-12 rounded-full px-8">
                <Link href="/products">Start designing</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="border-foreground/10 bg-foreground/[0.06] hover:bg-foreground/10 type-title-md h-12 rounded-full px-8"
              >
                <Link href="/products">Shop</Link>
              </Button>
            </div>

            <div className="flex w-full max-w-md items-center gap-4">
              <StarRow />
              <span className="type-title-md tabular">4.9</span>
              <span className="type-body-md text-muted-foreground">from 2,000+ makers</span>
              <span aria-hidden className="bg-border ml-auto h-px flex-1" />
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="flex h-full flex-col gap-4 pl-8 lg:pl-0">
              <div className="relative">
                <ul
                  aria-label="Available colorways"
                  className="absolute top-1/2 left-0 z-10 flex -translate-x-full -translate-y-1/2 flex-col gap-3 pr-5"
                >
                  {swatches.map((color, index) => (
                    <li key={color + index}>
                      <span
                        style={{ backgroundColor: color }}
                        className={`block size-6 rounded-full ${
                          index === 0
                            ? "ring-signal ring-offset-deck ring-2 ring-offset-2"
                            : "ring-foreground/15 ring-1"
                        }`}
                      />
                    </li>
                  ))}
                </ul>

                <div className="ring-foreground/10 relative aspect-square w-full overflow-hidden rounded-2xl ring-1">
                  <Image
                    src="/products/insulated-steel-bottle.png"
                    alt="Insulated steel bottle rendered in the 3D studio"
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 40vw"
                    className="object-cover"
                  />
                  <span className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur">
                    <span className="bg-signal size-1.5 rounded-full" />
                    Drag to rotate
                  </span>
                </div>
              </div>

              <ul className="flex flex-col items-end gap-2">
                {chips.map((chip) => (
                  <li
                    key={chip}
                    className="bg-foreground/[0.06] text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]"
                  >
                    <span className="bg-signal size-1.5 rounded-full" />
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="hairline-t mx-6 lg:mx-14">
          <ul className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-6">
            {specs.map((spec) => (
              <li
                key={spec}
                className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase"
              >
                {spec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
