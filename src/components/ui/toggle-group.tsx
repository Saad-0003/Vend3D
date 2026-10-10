"use client";

import * as React from "react";
import { cn } from "cn";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

/** Pill segmented control. Matches the collection filter tabs (hairline, pill, muted → ivory). */
function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--hairline)] p-1",
        className,
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-[13px] text-[var(--muted)] outline-none transition-colors duration-300 hover:text-[var(--ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)] data-[state=on]:bg-[var(--surface-2)] data-[state=on]:text-[var(--ivory)] data-[state=on]:ring-1 data-[state=on]:ring-[var(--hairline-strong)]",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
