"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * "Continue with Google" starter (plan.md Phase 1B U3).
 *
 * Google OAuth lands with the Supabase wiring (plan.md Phase 2/14) — with only
 * the mock behind it there is no provider to redirect to, so the affordance is
 * honest instead of fake: rendered like the other auth buttons but disabled,
 * with a tooltip saying why. A working-looking stub would let a demo visitor
 * believe a flow that cannot happen happened.
 *
 * Radix reads hover/focus from the tooltip trigger, and a genuinely disabled
 * button never emits either, so the trigger is a focusable wrapper around the
 * button rather than the button itself.
 */
export function GoogleButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="flex w-full rounded-[inherit]">
            <Button
              type="button"
              disabled
              aria-label="Continue with Google (available after launch)"
              className="h-11 w-full rounded-full border border-[var(--hairline)] bg-transparent px-6 text-[15px] font-medium text-[var(--ivory)] hover:bg-[var(--surface-2)] disabled:opacity-60"
            >
              <GoogleGlyph />
              Continue with Google
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Available after launch</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** The four-colour G, inline so the faux button carries no extra dependency. */
function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="size-4">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.95a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 .95 4.95l3.01 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
