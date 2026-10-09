"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { FileDown } from "lucide-react";
import { hslToHex } from "@/components/home/motion";

/** Precision color: draggable hue bar → live swatch + hex/Pantone readout. */
export function ColorDemo() {
  const [hue, setHue] = useState(78); // brand lime hue
  const color = hslToHex(hue, 0.87, 0.58);
  const pms = `PMS ${String.fromCharCode(65 + (hue % 26))}-${(hue % 1000).toString().padStart(3, "0")}`;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="h-28 w-full rounded-[var(--inner-radius)] ring-1 ring-[var(--hairline)] [box-shadow:var(--inner-highlight)]"
        style={{ background: `hsl(${hue} 87% 58%)` }}
        aria-hidden
      />
      <div className="lux-slider">
        <Slider
          aria-label="Precision color hue"
          value={[hue]}
          min={0}
          max={360}
          step={1}
          onValueChange={(v) => setHue(v[0] ?? 0)}
          className="[&>span:first-child]:bg-[linear-gradient(to_right,#f43f5e,#facc15,#c6f135,#22d3ee,#6366f1,#f43f5e)]"
        />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="lux-mono lux-tabular text-[13px] text-[var(--ivory)]">{color}</span>
        <span className="lux-mono text-[11px] tracking-[0.18em] text-[var(--brass)] uppercase">
          {pms}
        </span>
      </div>
    </div>
  );
}

/** Material physics: matte↔glossy slider driving a specular highlight. */
export function MaterialDemo() {
  const [gloss, setGloss] = useState(30);
  const size = 6 + (gloss / 100) * 22;
  const blur = 12 - (gloss / 100) * 9;

  return (
    <div className="flex h-full min-h-[13rem] flex-col gap-4">
      <div className="relative flex flex-1 items-center justify-center">
        <div
          className="size-32 rounded-full bg-gradient-to-br from-[#3a3a3f] to-[#1a1a1d] ring-1 ring-[var(--hairline-strong)] sm:size-44"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 55%), linear-gradient(160deg,#33333a,#151517)",
            filter: `blur(0px)`,
          }}
          aria-hidden
        >
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: "34%",
              top: "22%",
              filter: `blur(${blur}px)`,
              opacity: 0.35 + (gloss / 100) * 0.5,
            }}
          />
        </div>
      </div>
      <div className="lux-slider">
        <Slider
          aria-label="Material gloss"
          value={[gloss]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => setGloss(v[0] ?? 30)}
        />
      </div>
      <div className="flex justify-between">
        <span className="lux-mono text-[11px] text-[var(--faint)] uppercase tracking-[0.14em]">
          Matte
        </span>
        <span className="lux-mono text-[11px] text-[var(--faint)] uppercase tracking-[0.14em]">
          Glossy
        </span>
      </div>
    </div>
  );
}

/** Custom decals: dashed dropzone, floating file icon on a loop. Decorative only. */
export function DecalsDemo() {
  const reduced = useReducedMotion();
  return (
    <div
      className="group/dz relative flex h-28 items-center justify-center overflow-hidden rounded-[var(--inner-radius)] border border-dashed border-[var(--lime)]/40 transition-colors duration-500 hover:border-[var(--lime)] hover:bg-[var(--lime-glow)]"
      style={{ borderColor: "color-mix(in srgb, var(--lime) 45%, transparent)" }}
    >
      <motion.div
        className="flex flex-col items-center gap-2 text-[var(--muted)]"
        animate={reduced ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <FileDown className="size-7 text-[var(--lime)]" strokeWidth={1.5} />
        <span className="lux-mono text-[11px] tracking-[0.16em] uppercase">SVG / PNG</span>
      </motion.div>
    </div>
  );
}

/** Laser engraving: typewriter chip + sweeping lime line on brushed steel. */
export function LaserDemo() {
  const text = "DEPTH: 0.12mm FIBER";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduced) {
      setCount(text.length);
      return;
    }
    if (!inView) return;
    if (count >= text.length) return;
    const t = setTimeout(() => setCount((c) => Math.min(c + 1, text.length)), 45);
    return () => clearTimeout(t);
  }, [inView, count, text.length, reduced]);

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <div className="relative h-28 overflow-hidden rounded-[var(--inner-radius)] lux-brushed ring-1 ring-[var(--hairline)]">
        <motion.div
          aria-hidden
          className="absolute top-0 h-full w-24"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--lime-glow), var(--lime), var(--lime-glow), transparent)",
            filter: "blur(0.5px)",
          }}
          animate={reduced ? { x: "10%" } : { x: ["-30%", "420%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
        />
      </div>
      <span className="lux-mono lux-tabular text-[12px] tracking-[0.16em] text-[var(--ivory)]">
        {text.slice(0, count)}
        {count < text.length && <span className="text-[var(--lime)]">▍</span>}
      </span>
    </div>
  );
}
