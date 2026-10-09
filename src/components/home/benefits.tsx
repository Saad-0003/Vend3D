"use client";

import { motion } from "framer-motion";
import { Clock, Globe, Infinity as InfinityIcon, Truck } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Section } from "@/components/home/section";
import { EASE } from "@/components/home/motion";

type Column = {
  icon: typeof Clock;
  figure: React.ReactNode;
  label: string;
  body: string;
};

const columns: Column[] = [
  {
    icon: InfinityIcon,
    figure: <span className="lux-display">1</span>,
    label: "unit",
    body: "True DTC single-piece drops with the per-unit economics of high-volume runs.",
  },
  {
    icon: Clock,
    figure: (
      <span className="flex items-baseline gap-2">
        <NumberTicker value={4000} className="!text-inherit" />
        <span className="lux-mono text-[0.3em] tracking-[0.2em] text-[var(--muted)]">DPI</span>
      </span>
    ),
    label: "sub-millimeter print",
    body: "Precision industrial dye-sub and vector UV printing calibrated up to 4000 DPI.",
  },
  {
    icon: Globe,
    figure: (
      <span className="flex items-baseline gap-2">
        <span className="lux-display">Real-time</span>
        <span className="lux-pulse-dot bg-[var(--lime)] mb-[0.5em] size-[0.14em] rounded-full" />
      </span>
    ),
    label: "proofing",
    body: "Photorealistic physics based rendering ensures the physical blank matches the viewport.",
  },
  {
    icon: Truck,
    figure: (
      <span className="flex items-baseline gap-1">
        <NumberTicker value={100} className="!text-inherit" />
        <span className="lux-display">%</span>
      </span>
    ),
    label: "carbon neutral dispatch",
    body: "Eco-certified automated fulfillment centers powered 100% by renewable energy.",
  },
];

/** Benefits "spec strip" — one wide band split by vertical hairlines + grain. */
export function Benefits() {
  return (
    <Section band className="!py-0">
      <div className="lux-grain border-y border-[var(--hairline)]">
        <div className="grid grid-cols-1 divide-y divide-[var(--hairline)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {columns.map((col, i) => (
            <motion.div
              key={col.label}
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
              className={`group relative flex flex-col items-start gap-4 px-8 py-14 transition-colors duration-500 hover:bg-[var(--surface-2)] ${
                i > 0 ? "sm:border-l sm:border-[var(--hairline)]" : ""
              }`}
            >
              <col.icon className="size-5 text-[var(--lime)]" strokeWidth={1.5} aria-hidden />

              <div className="flex flex-col gap-1">
                <div className="text-[var(--ivory)] text-[clamp(2.5rem,3.5vw,3.75rem)] leading-none">
                  {col.figure}
                </div>
                <span className="lux-eyebrow text-[var(--brass)]">{col.label}</span>
              </div>

              <p className="max-w-xs text-[15px] leading-[1.6] text-[var(--muted)]">{col.body}</p>

              {/* Lime underline draws left→right on hover. */}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[var(--lime)] transition-all duration-500 ease-out group-hover:w-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

