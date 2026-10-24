"use client";

import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Matte→glossy track — identical to the landing material demo. */
export const GLOSS_GRADIENT = "linear-gradient(to right, #2a2a2e, #f3f0e8)";

/**
 * Finish control — the bar maps its full width onto the part's allowed gloss
 * range (`min`/`max`, from `part.glossRange`), so every millimetre of the track
 * moves the real surface roughness instead of clamping silently. `interactive`
 * adds keyboard support and a `role="slider"` for the studio panel.
 */
export function FinishControl({
  gloss,
  onGlossChange,
  interactive = false,
  label = "Finish",
  min = 0,
  max = 100,
  className,
}: {
  /** Current gloss, in the same scale as `min`/`max`. Omit for uncontrolled behaviour. */
  gloss?: number;
  onGlossChange?: (gloss: number) => void;
  interactive?: boolean;
  label?: string;
  /** Lower bound of the part's gloss range. */
  min?: number;
  /** Upper bound of the part's gloss range. */
  max?: number;
  className?: string;
}) {
  const [internal, setInternal] = useState(30);
  const trackRef = useRef<HTMLDivElement>(null);
  const value = gloss ?? internal;
  const readoutId = useId();
  const span = Math.max(1, max - min);
  const pct = Math.min(1, Math.max(0, (value - min) / span));
  const word = pct < 0.34 ? "Matte" : pct > 0.66 ? "Glossy" : "Satin";

  function commit(next: number) {
    const clamped = Math.min(max, Math.max(min, Math.round(next)));
    if (gloss === undefined) setInternal(clamped);
    onGlossChange?.(clamped);
  }

  function glossFromPointer(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    return min + Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * span;
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div
        ref={trackRef}
        className={cn(
          "relative h-5 w-full rounded-full ring-1 ring-[var(--hairline)]",
          interactive ? "cursor-pointer touch-none" : "cursor-crosshair",
        )}
        style={{ background: GLOSS_GRADIENT }}
        role={interactive ? "slider" : "presentation"}
        aria-hidden={interactive ? undefined : true}
        aria-label={interactive ? label : undefined}
        aria-valuemin={interactive ? min : undefined}
        aria-valuemax={interactive ? max : undefined}
        aria-valuenow={interactive ? Math.round(value) : undefined}
        aria-valuetext={interactive ? `${word}, ${Math.round(value)}%` : undefined}
        aria-describedby={interactive ? readoutId : undefined}
        tabIndex={interactive ? 0 : undefined}
        onPointerMove={(e) => {
          if (interactive && e.buttons !== 1) return;
          commit(glossFromPointer(e.clientX));
        }}
        onPointerDown={(e) => {
          if (!interactive) return;
          e.currentTarget.focus();
          commit(glossFromPointer(e.clientX));
        }}
        onPointerLeave={() => {
          if (!interactive) commit(min + span / 3);
        }}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") commit(value + 5);
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") commit(value - 5);
          else if (e.key === "Home") commit(min);
          else if (e.key === "End") commit(max);
          else return;
          e.preventDefault();
        }}
      >
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--lime)] bg-[var(--ink)] shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          style={{ left: `${pct * 100}%` }}
          data-testid="gloss-thumb"
        />
      </div>

      <div className="flex justify-between">
        <span className="lux-mono text-[11px] text-[var(--faint)] tracking-[0.14em] uppercase">
          Matte
        </span>
        <span
          id={readoutId}
          className={cn(
            "lux-mono text-[11px] tracking-[0.14em] uppercase",
            interactive ? "text-[var(--ivory)]" : "text-[var(--faint)]",
          )}
          aria-live="polite"
        >
          {interactive ? `${word} · ${Math.round(value)}%` : "Glossy"}
        </span>
      </div>
    </div>
  );
}
