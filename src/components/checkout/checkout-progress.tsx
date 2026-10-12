"use client";

import { Check } from "lucide-react";

/**
 * The 3-step progress row: mono caps labels, lime marker on the active step,
 * a lime tick on finished ones. Non-interactive on purpose — the steps carry
 * their own Back / Continue controls, and a progress indicator should not be a
 * navigation menu.
 */

export const CHECKOUT_STEPS = [
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEPS)[number]["id"];

export function CheckoutProgress({ current }: { current: number }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex flex-wrap items-center gap-y-2">
        {CHECKOUT_STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.id} className="flex items-center" aria-current={active ? "step" : undefined}>
              {done ? (
                <span
                  aria-hidden
                  className="flex size-5 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--ink)]"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <span
                  aria-hidden
                  className={active ? "size-1.5 rounded-full bg-[var(--lime)]" : "size-1.5 rounded-full bg-foreground/20"}
                />
              )}
              <span
                className={`lux-mono ml-2.5 text-[11px] tracking-[0.16em] uppercase ${
                  active ? "text-[var(--lime)]" : done ? "text-[var(--ivory)]" : "text-[var(--muted)]"
                }`}
              >
                {step.label}
              </span>
              {index < CHECKOUT_STEPS.length - 1 ? (
                <span aria-hidden className="mx-3 hidden h-px w-8 bg-[var(--hairline)] sm:mx-4 sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
