import { Crop, PenLine, SlidersHorizontal, Sun } from "lucide-react";

type Feature = {
  icon: typeof PenLine;
  title: string;
  body: string;
  visual: React.ReactNode;
};

const features: Feature[] = [
  {
    icon: PenLine,
    title: "Precision color",
    body: "Calibrated Pantone spectral matches across all substrates.",
    visual: (
      <div className="bg-foreground/10 relative h-2 w-full overflow-hidden rounded-full">
        <div className="from-foreground/5 via-signal/70 to-foreground/5 absolute inset-0 bg-gradient-to-r" />
      </div>
    ),
  },
  {
    icon: Sun,
    title: "Material physics",
    body: "Real-time dielectric roughness and specular sheen shaders.",
    visual: (
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-[11px]">Matte 20%</span>
        <span className="bg-foreground/10 relative h-1.5 w-24 rounded-full">
          <span className="bg-signal absolute top-1/2 left-[20%] size-3.5 -translate-y-1/2 rounded-full" />
        </span>
        <span className="text-muted-foreground text-[11px]">Glossy</span>
      </div>
    ),
  },
  {
    icon: Crop,
    title: "Custom decals",
    body: "Zero-loss vector upload with automatic seam avoidance.",
    visual: (
      <span className="border-signal/60 text-signal inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1.5 text-[11px]">
        <Crop className="size-3" strokeWidth={1.5} />
        Drag SVG or PNG
      </span>
    ),
  },
  {
    icon: SlidersHorizontal,
    title: "Laser engraving",
    body: "Micron-level fiber laser etching on brushed and powder-coated steel.",
    visual: (
      <span className="bg-foreground/[0.06] text-muted-foreground inline-flex rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.08em]">
        DEPTH: 0.12mm FIBER
      </span>
    ),
  },
];

/** Centered eyebrow + headline + four capability cards (landing section 2). */
export function PrecisionGrid() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 py-24 md:px-8">
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="text-signal text-[11px] tracking-[0.18em] uppercase">
          Engineered precision
        </span>
        <h2 className="type-headline-lg-mobile md:type-headline-lg tracking-headline font-medium">
          Built for tactile perfection.
        </h2>
        <p className="type-body-lg text-muted-foreground">
          High fidelity physics engine simulating fabric gravity and pigment interaction.
        </p>
      </header>

      <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <li
            key={feature.title}
            className="bg-card ring-foreground/10 flex flex-col gap-4 rounded-[20px] p-6 ring-1"
          >
            <feature.icon className="text-signal size-5" strokeWidth={1.5} />
            <div className="min-h-6">{feature.visual}</div>
            <h3 className="type-title-md">{feature.title}</h3>
            <p className="type-body-md text-muted-foreground">{feature.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
