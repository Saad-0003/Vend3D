"use client";

import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { hslToHex } from "@/components/home/motion";

/** Brand-lime hue, the default every control falls back to. */
export const LIME_HUE = 78;

/** hsl(78 87% 58%) → `#c6f135`. Same call the landing page used. */
export function hueColor(hue: number): string {
  return hslToHex(hue, 0.87, 0.58);
}

/** `PMS A-078`-style Pantone code derived from the hue. */
export function pmsCode(hue: number): string {
  return `PMS ${String.fromCharCode(65 + (hue % 26))}-${String(hue % 1000).padStart(3, "0")}`;
}

/** Full hue sweep — the gradient track of the landing colour demo. */
export const HUE_GRADIENT =
  "linear-gradient(to right, #f43f5e, #facc15, #c6f135, #22d3ee, #6366f1, #f43f5e)";

/**
 * Precision colour control — the landing page's "Precision color" bento demo,
 * moved verbatim (`components/studio/controls/`) so the studio reuses it instead
 * of a second hue slider. Decorative mode keeps the hover-only behaviour; a real
 * studio needs keyboard/pointer drag, so `interactive` exposes a proper
 * `role="slider"` with `aria-label` and `aria-valuetext`.
 */
export function HueColorControl({
  hue,
  onHueChange,
  interactive = false,
  label = "Hue",
  className,
}: {
  /** Controlled hue (0–360). Omit for uncontrolled decorative behaviour. */
  hue?: number;
  onHueChange?: (hue: number) => void;
  /** `true` in the studio panel: arrow keys, focus ring, aria-live readout. */
  interactive?: boolean;
  label?: string;
  className?: string;
}) {
  const [internal, setInternal] = useState(LIME_HUE);
  const trackRef = useRef<HTMLDivElement>(null);
  const value = hue ?? internal;
  const readoutId = useId();
  const color = hueColor(value);

  function commit(next: number) {
    const clamped = Math.min(360, Math.max(0, Math.round(next)));
    if (hue === undefined) setInternal(clamped);
    onHueChange?.(clamped);
  }

  function hueFromPointer(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return LIME_HUE;
    return (Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * 360);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="h-20 w-full rounded-[var(--inner-radius)] ring-1 ring-[var(--hairline)] [box-shadow:var(--inner-highlight)]"
        style={{ background: `hsl(${value} 87% 58%)` }}
        data-testid="hue-swatch"
        aria-hidden={!interactive}
        role={interactive ? "img" : undefined}
        aria-label={interactive ? `${label}: ${color}` : undefined}
      />

      <div
        ref={trackRef}
        className={cn(
          "relative h-5 w-full rounded-full ring-1 ring-[var(--hairline)]",
          interactive ? "cursor-pointer touch-none" : "cursor-crosshair",
        )}
        style={{ background: HUE_GRADIENT }}
        role={interactive ? "slider" : "presentation"}
        aria-hidden={interactive ? undefined : true}
        aria-label={interactive ? label : undefined}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? 360 : undefined}
        aria-valuenow={interactive ? Math.round(value) : undefined}
        aria-valuetext={interactive ? `${color}, ${pmsCode(value)}` : undefined}
        aria-describedby={interactive ? readoutId : undefined}
        tabIndex={interactive ? 0 : undefined}
        onPointerMove={(e) => {
          if (interactive && e.buttons !== 1) return;
          commit(hueFromPointer(e.clientX));
        }}
        onPointerDown={(e) => {
          if (!interactive) return;
          e.currentTarget.focus();
          commit(hueFromPointer(e.clientX));
        }}
        // Leaving the bar returns to brand lime — the landing behaviour.
        onPointerLeave={() => commit(LIME_HUE)}
        onKeyDown={(e) => {
          if (!interactive) return;
          const step = e.shiftKey ? 12 : 3;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") commit(value + step);
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") commit(value - step);
          else if (e.key === "Home") commit(0);
          else if (e.key === "End") commit(360);
          else return;
          e.preventDefault();
        }}
      >
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--lime)] bg-[var(--ink)] shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          style={{ left: `${(value / 360) * 100}%` }}
          data-testid="hue-thumb"
        />
      </div>

      <div className="flex items-baseline justify-between">
        <span id={readoutId} className="lux-mono lux-tabular text-[13px] text-[var(--ivory)]">
          {color}
        </span>
        <span className="lux-mono text-[11px] tracking-[0.18em] text-[var(--brass)] uppercase">
          {pmsCode(value)}
        </span>
      </div>
    </div>
  );
}
