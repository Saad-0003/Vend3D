import { CheckCircle2, MousePointerClick, SlidersHorizontal } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

const steps = [
  {
    number: "01",
    icon: MousePointerClick,
    title: "Pick",
    body: "Select from ethically milled heavy blanks, custom dyed caps, and precision ceramics.",
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    title: "Shape",
    body: "Adjust materials, calibrate pigments, and apply custom vector artwork in live photoreal 3D.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Own",
    body: "Precision laser-etched or screenprinted, quality-checked, and dispatched in 48 hours.",
  },
];

export function Steps() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 py-24 md:px-8">
      <BlurFade inView direction="up">
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="text-signal text-[11px] tracking-[0.18em] uppercase">
            Three simple steps
          </span>
          <h2 className="type-headline-lg-mobile md:type-headline-lg tracking-headline font-medium">
            From 3D viewport to your studio.
          </h2>
        </header>
      </BlurFade>

      <BlurFade inView direction="up" delay={0.08}>
        <ol className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="bg-card ring-foreground/10 relative flex min-h-[260px] flex-col gap-4 overflow-hidden rounded-[20px] p-8 ring-1"
            >
              <span
                aria-hidden
                className="text-foreground/[0.05] tabular pointer-events-none absolute right-5 bottom-1 text-[96px] leading-none font-medium tracking-tight"
              >
                {step.number}
              </span>
              <span className="bg-foreground/[0.06] text-signal flex size-10 items-center justify-center rounded-xl">
                <step.icon className="size-5" strokeWidth={1.5} />
              </span>
              <h3 className="type-title-md">{step.title}</h3>
              <p className="type-body-md text-muted-foreground mt-auto max-w-xs">{step.body}</p>
            </li>
          ))}
        </ol>
      </BlurFade>
    </section>
  );
}
