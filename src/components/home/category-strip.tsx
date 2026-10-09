"use client";

import { Marquee } from "@/components/ui/marquee";

const items = [
  "Heavyweight Cotton",
  "Glazed Stoneware",
  "Insulated Flasks",
  "Structured Caps",
  "Real-time UV Mapping",
  "Zero Minimums",
];

function Item({ label }: { label: string }) {
  return (
    <div className="group/mq flex items-center gap-8 px-8">
      <span className="lux-eyebrow text-[var(--muted)] transition-colors duration-500 group-hover/mq:text-[var(--ivory)]">
        {label}
      </span>
      <span
        aria-hidden
        className="bg-[var(--lime)] size-1.5 rotate-45 transition-opacity duration-500 group-hover/mq:opacity-40"
      />
    </div>
  );
}

/** Full-bleed infinite marquee category strip with edge fades. */
export function CategoryStrip() {
  return (
    <div className="relative border-y border-[var(--hairline)] bg-[var(--ink)]">
      <div className="[--fade-stop:14%] [mask-image:linear-gradient(to_right,transparent,#000_var(--fade-stop),#000_calc(100%_-_var(--fade-stop)),transparent)]">
        <Marquee
          repeat={3}
          className="lux-marquee py-6 [--duration:38s] [--gap:0px]"
        >
          {items.map((label) => (
            <Item key={label} label={label} />
          ))}
        </Marquee>
      </div>
    </div>
  );
}
