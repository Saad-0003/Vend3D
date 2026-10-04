import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRow } from "@/components/shared/star-row";

const testimonials = [
  {
    quote:
      "Vend3D completely transformed our merchandise workflow. We designed, proofed, and launched 4 high-demand drops in 48 hours without touching sample freight.",
    name: "CyberProto Studios",
  },
  {
    quote:
      "The real-time WebGL proofing is unmatched. Colors calibrated 11 with industrial UV sublimation on our heavyweight tees. Zero surprises on arrival.",
    name: "Kaelen Vance, Studio V",
  },
  {
    quote:
      "Very appreciative of how high the build quality is. Single-piece MOQ lets us run limited hyper-exclusive preorder drops with zero dead stock risk.",
    name: "Marcus Ray, Apex DTC",
  },
];

export function LaunchBanner() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 py-24 md:px-8">
      <div className="ring-foreground/10 relative overflow-hidden rounded-[28px] ring-1">
        <Image
          src="/images/studio-scene.png"
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1400px) 100vw, 1400px"
          className="object-cover opacity-70"
        />
        <div
          aria-hidden
          className="from-stage/95 via-stage/70 to-stage/25 absolute inset-0 bg-gradient-to-r"
        />

        <div className="relative flex flex-col gap-8 p-8 md:p-14">
          <div className="flex flex-col items-start gap-6">
            <span className="text-signal inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase">
              <StarRow />
              5.0 (28)
            </span>
            <h2 className="type-headline-lg-mobile md:type-headline-lg tracking-headline max-w-xl font-medium">
              Creators launch drops without waiting.
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                variant="secondary"
                className="border-foreground/10 bg-foreground/[0.06] hover:bg-foreground/10 h-11 rounded-full px-6"
              >
                <Link href="/products">
                  See all reviews
                  <ArrowUpRight className="size-4" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button
                asChild
                className="bg-signal text-on-signal hover:bg-signal/90 h-11 rounded-full px-6"
              >
                <Link href="/products">Launch Your Canvas</Link>
              </Button>
            </div>
          </div>

          <ul className="hairline-t grid grid-cols-1 gap-4 pt-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <li
                key={testimonial.name}
                className="bg-foreground/[0.04] ring-foreground/10 flex flex-col gap-4 rounded-2xl p-5 ring-1 backdrop-blur"
              >
                <StarRow />
                <p className="type-body-md text-foreground/90 flex-1">“{testimonial.quote}”</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="type-label-md">{testimonial.name}</span>
                  <Link
                    href="/products"
                    className="text-signal text-[11px] tracking-[0.1em] uppercase"
                  >
                    Read all
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
