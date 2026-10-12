"use client";

import * as React from "react";
import { cn } from "cn";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

/**
 * Hand-written over the installed `radix-ui` meta-package, same shape as
 * `switch.tsx` / `checkbox.tsx` (DECISIONS.md D-044). The item is a full row
 * pill (44px touch target) so the label is part of the control; the active
 * marker is the brand lime, with a lime ring around the dot.
 */
function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group/radio flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-transparent transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "data-[state=checked]:border-signal",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="size-2.5 rounded-full bg-signal"
      />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
