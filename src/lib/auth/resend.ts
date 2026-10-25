/**
 * The resend cooldown behind `/auth/check-email` (plan.md Phase 1B U3).
 *
 * The math is split from the component so the "cannot spam resend" promise is
 * unit-tested on its own: the screen only reads `remainingCooldownSeconds` even
 * when the clock jumps, stalls or skews.
 */

/** One resend per half minute; long enough to matter, short enough to wait. */
export const RESEND_COOLDOWN_MS = 30_000;

/**
 * Whole seconds left before another resend is allowed, floored at 0.
 *
 * `now` earlier than `startedAt` (system clock jumped back mid-cooldown) is
 * treated as a full window — never negative and never "already over".
 */
export function remainingCooldownSeconds(startedAt: number, now: number): number {
  const remainingMs = RESEND_COOLDOWN_MS - (now - startedAt);
  if (remainingMs >= RESEND_COOLDOWN_MS) return Math.ceil(RESEND_COOLDOWN_MS / 1000);
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}
