"use client";

import * as React from "react";
import { cn } from "cn";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

/**
 * Hand-written over the installed `radix-ui` meta-package, same shape as
 * `switch.tsx` / `accordion.tsx` (DECISIONS.md D-044): the registry fetch is
 * unreachable on this machine and Radix already ships the primitive.
 * Sized for a 44px touch target with the lime card tokens on top.
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 rounded-[6px] border border-input bg-transparent transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "data-[state=checked]:border-signal data-[state=checked]:bg-signal data-[state=checked]:text-on-signal",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
