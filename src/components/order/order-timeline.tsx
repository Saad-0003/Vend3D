"use client";

import { cn } from "@/lib/utils";

/**
 * Fulfilment timeline: Placed → Processing → Shipped → Delivered.
 *
 * Horizontal on `sm` and up, vertical below it. The stages share the demo
 * vocabulary the admin updater writes (U6): a stage lights once the order's
 * status has reached it, so an admin advancing an order shows exactly the same
 * progress on the customer's `/order/[id]`. A cancelled order replaces the
 * ladder with a quiet, honest row instead of a half-lit path that will never
 * move again. Vertical and horizontal share one DOM order so screen readers
 * hear the stages in sequence either way.
 */

const STAGES = [
  { id: "Placed", label: "Placed" },
  { id: "Processing", label: "Processing" },
  { id: "Shipped", label: "Shipped" },
  { id: "Delivered", label: "Delivered" },
] as const;

export type TimelineStatus = (typeof STAGES)[number]["id"] | "Cancelled";

export function OrderTimeline({ status }: { status: TimelineStatus }) {
  if (status === "Cancelled") return <CancelledTimeline />;

  // The index of the stage the record actually attests to.
  const through = STAGES.findIndex((stage) => stage.id === status);

  return (
    <ol aria-label="Order progress" className="flex flex-col gap-6 sm:flex-row sm:gap-0">
      {STAGES.map((stage, index) => {
        const reached = index <= through;
        const active = index === through;
        const last = index === STAGES.length - 1;

        return (
          <li key={stage.id} aria-current={active ? "step" : undefined} className="relative flex flex-1 items-center gap-3 sm:flex-col sm:items-start sm:gap-3">
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
                active || reached
                  ? "bg-[var(--lime)]"
                  : "bg-[var(--surface-3)]",
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

function CancelledTimeline() {
  return (
    <div aria-label="Order progress">
      <p className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
        Cancelled
      </p>
      <p className="mt-1 max-w-md text-[14px] leading-[1.6] text-[var(--muted)]">
        This order was cancelled and will not be produced. No money was ever charged.
      </p>
    </div>
  );
}
