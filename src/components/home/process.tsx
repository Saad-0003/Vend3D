"use client";

import { motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, MousePointerClick, SlidersHorizontal } from "lucide-react";
import { Section } from "@/components/home/section";
import { EASE, viewportOnce } from "@/components/home/motion";

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

/* ---- tiny looping SVG illustrations (paused when off-screen via useInView) ---- */

function PickIllo() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();
  return (
    <span ref={ref} className="flex h-10 items-center gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-6 w-6 rounded-full border border-[var(--hairline-strong)]"
          style={{ borderColor: i === 1 ? "var(--lime)" : undefined }}
        />
      ))}
      <motion.svg
        width="24"
        height="16"
        viewBox="0 0 24 16"
        animate={reduced || !inView ? { x: 0, y: 0 } : { x: [0, 12, 24], y: [8, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.4 }}
        className="text-[var(--lime)]"
      >
        <path d="M2 2 L2 14 L7 11 L10 14 L10 8 L6 7 Z" fill="currentColor" />
      </motion.svg>
    </span>
  );
}

function ShapeIllo() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const loop = reduced || !inView;
  return (
    <span ref={ref} className="flex h-10 flex-col justify-center gap-3" aria-hidden>
      {[0, 1].map((i) => (
        <span key={i} className="relative block h-px w-28 bg-[var(--hairline-strong)]">
          <motion.span
            className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-[var(--lime)]"
            animate={loop ? { left: "10%" } : { left: ["10%", "90%", "10%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.4, delay: i * 0.2 }}
          />
        </span>
      ))}
    </span>
  );
}

function OwnIllo() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduced = useReducedMotion();
  return (
    <span ref={ref} className="flex h-10 items-center" aria-hidden>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="14"
          fill="none"
          stroke="var(--hairline-strong)"
          strokeWidth="1.5"
        />
        <motion.circle
          cx="20"
          cy="20"
          r="14"
          fill="none"
          stroke="var(--lime)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="88"
          initial={{ strokeDashoffset: 88, rotate: -90 }}
          animate={reduced || !inView ? { strokeDashoffset: 88 } : { strokeDashoffset: 0 }}
          style={{ originX: "20px", originY: "20px" }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.6, ease: EASE }}
        />
      </svg>
    </span>
  );
}

const illustrations = [<PickIllo key="p" />, <ShapeIllo key="s" />, <OwnIllo key="o" />];

/** Pick → Shape → Own with a self-drawing connector line and tiny loops. */
export function Process() {
  const trackRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.8", "end 0.6"],
  });
  const pathLength = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  return (
    <Section>
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="lux-eyebrow text-[var(--lime)]">Three simple steps</span>
        <h2 className="lux-h2 lux-display text-[var(--ivory)]">From 3D viewport to your studio.</h2>
      </header>

      <div className="relative mt-14">
        {/* Desktop connector: line draws with scroll, lime dot travels. */}
        <svg
          aria-hidden
          viewBox="0 0 1200 4"
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-[3.25rem] right-0 left-0 hidden h-1 md:block"
        >
          <motion.line
            x1="0"
            y1="2"
            x2="1200"
            y2="2"
            stroke="var(--hairline-strong)"
            strokeWidth="1"
          />
          <motion.line
            x1="0"
            y1="2"
            x2="1200"
            y2="2"
            stroke="var(--lime)"
            strokeWidth="1"
            style={{ pathLength }}
          />
        </svg>

        <ol
          ref={trackRef}
          className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6"
        >
          {steps.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
              className="group relative flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-7 [box-shadow:var(--inner-highlight)] transition-colors duration-500 hover:border-[var(--lime)]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--inner-radius)] bg-[var(--surface-3)] text-[var(--lime)] ring-1 ring-[var(--hairline)] transition-shadow duration-500 group-hover:shadow-[0_0_20px_var(--lime-glow)]">
                  <step.icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                {/* Small mono numeral, tucked top-right where it can never collide
                    with the title or body copy below it. */}
                <span className="lux-mono lux-tabular shrink-0 text-[10px] tracking-[0.18em] text-[var(--faint)]">
                  {step.number}
                </span>
              </div>

              {/* Fixed-height illustration well: identical in all three cards, so
                  the copy block below starts on the same baseline. */}
              <span className="flex h-10 items-center" aria-hidden>
                {illustrations[i]}
              </span>

              <div className="mt-auto">
                <h3 className="lux-display text-[22px] text-[var(--ivory)]">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-[var(--muted)]">{step.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

