"use client";

import { motion } from "framer-motion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Section } from "@/components/home/section";
import { EASE } from "@/components/home/motion";

type Column = {
  value: React.ReactNode;
  label: string;
  body: string;
};

const columns: Column[] = [
  {
    value: <span>1</span>,
    label: "Zero minimums",
    body: "True DTC single-piece drops with the per-unit economics of high-volume runs.",
  },
  {
    value: (
      <span className="inline-flex items-baseline gap-1.5">
        <NumberTicker value={4000} className="!text-inherit" />
        <span className="text-[0.45em] font-medium tracking-wider text-[var(--muted)]">DPI</span>
      </span>
    ),
    label: "Sub-millimeter print",
    body: "Precision industrial dye-sub and vector UV printing calibrated up to 4000 DPI.",
  },
  {
    value: (
      <span className="inline-flex items-baseline gap-2">
        Real-time
        <span className="lux-pulse-dot bg-[var(--lime)] mb-[0.45em] size-[0.14em] rounded-full" />
      </span>
    ),
    label: "Real-time proofing",
    body: "Photorealistic physics based rendering ensures the physical blank matches the viewport.",
  },
  {
    value: (
      <span className="inline-flex items-baseline">
        <NumberTicker value={100} className="!text-inherit" />
        %
      </span>
    ),
    label: "Carbon neutral dispatch",
    body: "Eco-certified automated fulfillment centers powered 100% by renewable energy.",
  },
];

/** Metrics band — rounded dark panel, dot-matrix backdrop, centered header. */
export function Benefits() {
  return (
    <Section>
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-1)] px-6 py-14 sm:px-10 md:px-14"
        style={{
          // Ultra-low-opacity dot matrix (dark theme preserved).
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* Centered header. */}
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Production-grade, from a single unit.
          </h2>
          <p className="text-sm text-[var(--muted)] sm:text-base">
            Precision printing, real-time proofing, and carbon-neutral dispatch — with no minimum
            order.
          </p>
        </div>

        {/* Metrics row: 1 col (horizontal dividers) → 4 cols (vertical dividers). */}
        <div className="grid grid-cols-1 md:grid-cols-4">
          {columns.map((col, i) => (
            <motion.div
              key={col.label}
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
              className={`flex flex-col items-center gap-2 px-4 text-center ${
                i < columns.length - 1
                  ? "border-b border-[var(--hairline)] pb-8 md:border-r md:border-b-0 md:pb-0"
                  : ""
              } ${i < columns.length - 1 ? "md:pr-8" : ""}`}
            >
              {/* Large metric value — modern sans, white. */}
              <div className="text-3xl leading-none font-bold text-white sm:text-4xl">
                {col.value}
              </div>

              {/* Mono uppercase label. */}
              <span className="mt-2 font-mono text-xs tracking-wider text-[var(--faint)] uppercase">
                {col.label}
              </span>

              <p className="mt-1 max-w-[15rem] text-sm leading-relaxed text-[var(--muted)]">
                {col.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}


