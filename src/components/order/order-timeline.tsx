"use client";

import { cn } from "@/lib/utils";

/**
 * Fulfilment timeline: Placed → Proofing → Production → Dispatched.
 *
 * Horizontal on `sm` and up, vertical below it. The first stage is the only one
 * the order record actually attests to (`status: "Placed"`); the rest is the
 * production path a demo order is shown walking, so they stay dim rather than
 * claiming progress the store does not have. Vertical and horizontal share one
 * DOM order so screen readers hear the stages in sequence either way.
 */

const STAGES = [
  { id: "placed", label: "Placed" },
  { id: "proofing", label: "Proofing" },
  { id: "production", label: "Production" },
  { id: "dispatched", label: "Dispatched" },
] as const;

export function OrderTimeline() {
  return (
    <ol aria-label="Order progress" className="flex flex-col gap-6 sm:flex-row sm:gap-0">
      {STAGES.map((stage, index) => {
        const active = index === 0;
        const last = index === STAGES.length - 1;

        return (
          <li key={stage.id} className="relative flex flex-1 items-center gap-3 sm:flex-col sm:items-start sm:gap-3">
            {/* Connector to the next stage. Vertical by default, horizontal from `sm`. */}
            {!last ? (
              <span
                aria-hidden
                className={cn(
                  "absolute bg-[var(--hairline)]",
                  "top-3 left-[5px] h-[calc(100%+1.5rem-0.75rem)] w-px",
                  "sm:top-[5px] sm:left-3 sm:h-px sm:w-[calc(100%-1.5rem)]",
                )}
              />
            ) : null}

            <span
              aria-hidden
              data-active={active ? "true" : "false"}
              className={cn(
                "relative z-10 size-3 shrink-0 rounded-full ring-4 ring-[var(--surface-1)]",
                active ? "bg-[var(--lime)]" : "bg-[var(--surface-3)]",
              )}
            />

            <span
              className={cn(
                "lux-mono text-[11px] tracking-[0.16em] uppercase",
                active ? "text-[var(--ivory)]" : "text-[var(--muted)]",
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
