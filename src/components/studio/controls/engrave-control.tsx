"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

/** Materials the laser-engraving spec supports (`docs/ui-reference/HOMEPAGE.md`). */
export type EngraveMaterial = "FIBER" | "STEEL" | "CERAMIC";

/**
 * Laser-engraving control — mono depth chip `DEPTH: 0.12mm FIBER` (per the UI
 * reference) plus a `.lux-slider` depth track. Reads like the landing page's
 * other technical readouts: mono, uppercase, wide tracking, hairline enclosure.
 */
export function EngraveControl({
  depthMm = 0.12,
  material = "FIBER",
  onDepthChange,
  className,
}: {
  depthMm?: number;
  material?: EngraveMaterial;
  onDepthChange?: (depthMm: number) => void;
  className?: string;
}) {
  const readoutId = useId();
  const rangeId = useId();
  const pct = ((depthMm - 0.05) / (0.4 - 0.05)) * 100;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="lux-eyebrow text-[var(--muted)]">Laser engraving</span>
        <span
          id={readoutId}
          aria-live="polite"
          className="lux-mono lux-tabular rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] tracking-[0.16em] text-[var(--ivory)] uppercase ring-1 ring-[var(--hairline)]"
        >
          Depth: {depthMm.toFixed(2)}mm {material}
        </span>
      </div>

      <label htmlFor={rangeId} className="sr-only">
        Engraving depth in millimetres
      </label>
      <input
        id={rangeId}
        type="range"
        min={0.05}
        max={0.4}
        step={0.01}
        value={depthMm}
        aria-valuetext={`${depthMm.toFixed(2)} millimetres`}
        onChange={(e) => onDepthChange?.(Number(e.target.value))}
        className="h-2.5 w-full cursor-pointer touch-none appearance-none rounded-full accent-[var(--lime)]"
        style={{
          background: `linear-gradient(to right, var(--lime) ${pct}%, var(--surface-3) ${pct}%)`,
        }}
      />

      <div className="flex justify-between">
        <span className="lux-mono text-[11px] text-[var(--faint)] tracking-[0.14em] uppercase">
          0.05mm
        </span>
        <span className="lux-mono text-[11px] text-[var(--faint)] tracking-[0.14em] uppercase">
          0.40mm
        </span>
      </div>
    </div>
  );
}
