"use client";

import { useCallback, useEffect, useState } from "react";

import { remainingCooldownSeconds } from "@/lib/auth/resend";

/**
 * Cooldown state for the "Resend" affordance on `/auth/check-email` (plan.md
 * Phase 1B U3): `start()` begins a 30s window, `remaining` ticks down to 0 and
 * `cooling` tells the button when to disable itself.
 *
 * The remaining-time math lives in `lib/auth/resend.ts` so the rule is unit
 * testable; this hook only contributes the ticking clock (a 250 ms interval,
 * stopped as soon as the window is over).
 */
export function useResendCooldown() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const remaining =
    startedAt === null || now === null ? 0 : remainingCooldownSeconds(startedAt, now);

  const start = useCallback(() => {
    const instant = Date.now();
    setStartedAt(instant);
    setNow(instant);
  }, []);

  return { start, remaining, cooling: remaining > 0 };
}
