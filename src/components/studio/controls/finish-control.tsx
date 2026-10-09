"use client";

import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Matte↔glossy track — identical to the landing material demo. */
export const GLOSS_GRADIENT = "linear-gradient(to right, #2a2a2e, #f3f0e8)";

/**
 * Finish control — the landing page's "Material physics" bento demo, moved to
 * `components/studio/controls/`. Pointer position across the bar drives the
 * specular highlight (size, blur, opacity); `interactive` adds keyboard support
 * and a `role="slider"` for the studio panel.
 */
export function FinishControl({
  gloss,
  onGlossChange,
  interactive = false,
  label = "Finish",
  className,
}: {
  /** 0 = matte, 100 = glossy. Omit for uncontrolled decorative behaviour. */
  gloss?: number;
  onGlossChange?: (gloss: number) => void;
  interactive?: boolean;
  label?: string;
  className?: string;
}) {
  const [internal, setInternal] = useState(30);
  const trackRef = useRef<HTMLDivElement>(null);
  const value = gloss ?? internal;
  const readoutId = useId();

  // Specular highlight maths straight from the landing demo.
  const size = 6 + (value / 100) * 22;
  const blur = 12 - (value / 100) * 9;
  const word = value < 34 ? "Matte" : value > 66 ? "Glossy" : "Satin";

  function commit(next: number) {
    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    if (gloss === undefined) setInternal(clamped);
    onGlossChange?.(clamped);
  }

  function glossFromPointer(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 30;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * 100;
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="relative flex flex-1 items-center justify-center">
        <div
          className="relative size-24 rounded-full ring-1 ring-[var(--hairline-strong)] sm:size-36"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 55%), linear-gradient(160deg,#33333a,#151517)",
          }}
          aria-hidden={!interactive}
          role={interactive ? "img" : undefined}
          aria-label={interactive ? `${label}: ${word}` : undefined}
        >
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: "34%",
              top: "22%",
              filter: `blur(${blur}px)`,
              opacity: 0.35 + (value / 100) * 0.5,
            }}
            data-testid="gloss-highlight"
          />
        </div>
      </div>

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
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? 100 : undefined}
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
        onPointerLeave={() => commit(30)}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") commit(value + 5);
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") commit(value - 5);
          else if (e.key === "Home") commit(0);
          else if (e.key === "End") commit(100);
          else return;
          e.preventDefault();
        }}
      >
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--lime)] bg-[var(--ink)] shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          style={{ left: `${value}%` }}
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
