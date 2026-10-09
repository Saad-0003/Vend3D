"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileDown } from "lucide-react";
import { hslToHex } from "@/components/home/motion";

/** Precision color: hover-driven hue bar → live swatch + hex/Pantone readout. */
export function ColorDemo() {
  const [hue, setHue] = useState(78); // brand lime hue
  const color = hslToHex(hue, 0.87, 0.58);
  const pms = `PMS ${String.fromCharCode(65 + (hue % 26))}-${(hue % 1000).toString().padStart(3, "0")}`;

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        className="h-20 w-full rounded-[var(--inner-radius)] ring-1 ring-[var(--hairline)] [box-shadow:var(--inner-highlight)]"
        style={{ background: `hsl(${hue} 87% 58%)` }}
        aria-hidden
      />
      {/* Hover-driven hue: moving the cursor across the bar sets the hue, no
          click/drag. Leaving the bar returns to the brand lime default. */}
      <div
        role="presentation"
        aria-hidden
        className="relative h-5 w-full cursor-crosshair rounded-full ring-1 ring-[var(--hairline)]"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          setHue(Math.round(t * 360));
        }}
        onPointerLeave={() => setHue(78)}
      >
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(to_right,#f43f5e,#facc15,#c6f135,#22d3ee,#6366f1,#f43f5e)]" />
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--lime)] bg-[var(--ink)] shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          style={{ left: `${(hue / 360) * 100}%` }}
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

/** Material physics: hover-driven matte↔glossy bar driving a specular highlight. */
export function MaterialDemo() {
  const [gloss, setGloss] = useState(30);
  const size = 6 + (gloss / 100) * 22;
  const blur = 12 - (gloss / 100) * 9;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="relative flex flex-1 items-center justify-center">
        <div
          className="size-24 rounded-full ring-1 ring-[var(--hairline-strong)] sm:size-36"
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
      {/* Hover-driven gloss: cursor position across the bar sets matte↔glossy,
          no click/drag. Leaving the bar returns to the 30% default. */}
      <div
        role="presentation"
        aria-hidden
        className="relative h-5 w-full cursor-crosshair rounded-full bg-[linear-gradient(to_right,#2a2a2e,#f3f0e8)] ring-1 ring-[var(--hairline)]"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          setGloss(Math.round(t * 100));
        }}
        onPointerLeave={() => setGloss(30)}
      >
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--lime)] bg-[var(--ink)] shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          style={{ left: `${gloss}%` }}
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
      className="group/dz relative flex h-24 items-center justify-center overflow-hidden rounded-[var(--inner-radius)] border border-dashed border-[var(--lime)]/40 transition-colors duration-500 hover:border-[var(--lime)] hover:bg-[var(--lime-glow)]"
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

