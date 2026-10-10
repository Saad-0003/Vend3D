"use client";

import * as React from "react";
import { cn } from "cn";
import { Switch as SwitchPrimitive } from "radix-ui";

/** Landing-page pill switch: hairline track, lime when on, ink thumb. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-[var(--surface-3)] ring-1 ring-[var(--hairline-strong)] transition-colors duration-300 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)] data-[state=checked]:bg-[var(--lime)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-[var(--ivory)] shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-[var(--ink)]"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
