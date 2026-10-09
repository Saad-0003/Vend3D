"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Crop, PenLine, Sun } from "lucide-react";
import { Section } from "@/components/home/section";
import { EASE, viewportOnce, useIsTouch } from "@/components/home/motion";
import { ColorDemo, DecalsDemo, MaterialDemo } from "@/components/home/precision-demos";

const headingWords = ["Built", "for", "tactile", "perfection."];

type BentoCardProps = {
  icon: React.ElementType;
  title: string;
  body: string;
  demo: React.ReactNode;
  className?: string;
  /** Cursor-following spotlight border. Only the SVG-upload card enables it. */
  glow?: boolean;
};

/** Card with a 4px hover lift; spotlight border is opt-in via `glow`. */
function BentoCard({ icon: Icon, title, body, demo, className, glow = false }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });
  const spotlight = useTransform(
    [sx, sy],
    ([cx, cy]: number[]) =>
      `radial-gradient(220px circle at ${cx}% ${cy}%, var(--lime-glow), transparent 70%)`,
  );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={viewportOnce}
      transition={{ duration: 0.8, ease: EASE }}
      whileHover={reduced ? undefined : { y: -4 }}
      onPointerMove={(e) => {
        if (isTouch || reduced || !glow) return;
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - rect.left) / rect.width) * 100);
        y.set(((e.clientY - rect.top) / rect.height) * 100);
      }}
      className={`group relative overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] transition-colors duration-500 hover:border-[var(--hairline-strong)] ${className ?? ""}`}
    >
      {glow && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: spotlight }}
        />
      )}
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-[var(--lime)]" strokeWidth={1.5} aria-hidden />
          <h3 className="lux-display text-[20px] text-[var(--ivory)]">{title}</h3>
        </div>
        <p className="max-w-sm text-[15px] leading-[1.6] text-[var(--muted)]">{body}</p>
        <div className="flex flex-1 flex-col pt-2">{demo}</div>
      </div>
    </motion.div>
  );
}

/** Engineered Precision — 12-column bento with live micro-demos. */
export function PrecisionBento() {
  return (
    <Section band>
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <motion.span
          className="lux-eyebrow text-[var(--lime)]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Engineered precision
        </motion.span>
        <h2 className="lux-h2 lux-display flex flex-wrap justify-center gap-x-4 gap-y-1 text-[var(--ivory)]">
          {headingWords.map((w, i) => (
            <motion.span
              key={w}
              initial={{ opacity: 0, filter: "blur(10px)", y: 12 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.09 }}
            >
              {w}
            </motion.span>
          ))}
        </h2>
        <motion.p
          className="max-w-lg text-[17px] leading-[1.6] text-[var(--muted)]"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
        >
          High fidelity physics engine simulating fabric gravity and pigment interaction.
        </motion.p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12">
        <BentoCard
          icon={Sun}
          title="Material physics"
          body="Real-time dielectric roughness and specular sheen shaders."
          demo={<MaterialDemo />}
          className="md:col-span-7 md:row-span-2"
        />
        <BentoCard
          icon={PenLine}
          title="Precision color"
          body="Calibrated Pantone spectral matches across all substrates."
          demo={<ColorDemo />}
          className="md:col-span-5"
        />
        <BentoCard
          icon={Crop}
          title="Custom decals"
          body="Zero-loss vector upload with automatic seam avoidance."
          demo={<DecalsDemo />}
          className="md:col-span-5"
          glow
        />
      </div>
    </Section>
  );
}

