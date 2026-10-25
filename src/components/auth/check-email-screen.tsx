"use client";

import { useResendCooldown } from "@/components/auth/use-resend-cooldown";
import { Button } from "@/components/ui/button";
import { sanitizeNext } from "@/lib/auth/next";

/**
 * `/auth/check-email`'s body (plan.md Phase 1B U3).
 *
 * Reached after a mock sign-up and after `/forgot-password`. The copy echoes
 * the entered address; nothing is actually sent (the page carries the demo
 * notice), so "Resend" re-arms a 30s cooldown instead of calling any service —
 * the wait is the honest part of the demo, and the countdown makes the
 * disabled state legible instead of mysterious. `next`, when present from a
 * sign-up, rides on the "Back to sign in" link so the guarded-route return
 * contract survives the hop (D-093).
 */
export function CheckEmailScreen({ email, next }: { email: string; next: string | null }) {
  const { start, remaining, cooling } = useResendCooldown();

  const currentNext = next ? sanitizeNext(next) : null;
  const backHref = currentNext ? `/login?next=${encodeURIComponent(currentNext)}` : "/login";

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <p data-testid="check-email-copy" className="text-[14px] leading-[1.6] text-[var(--muted)]">
        We sent a demo verification link to{" "}
        <span className="text-[var(--ivory)]">{email || "your email address"}</span>. No mail is
        actually sent in this demo — nothing to open, nothing came.
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={start}
        disabled={cooling}
        aria-label={cooling ? `Resend available in ${remaining} seconds` : undefined}
        className="h-11 w-full rounded-full border-[var(--hairline)] bg-transparent px-6 text-[15px] font-medium text-[var(--ivory)] hover:bg-[var(--surface-2)] disabled:opacity-60"
      >
        {cooling ? `Resend in ${remaining}s` : "Resend"}
      </Button>

      <p className="text-center text-[13px] text-[var(--muted)]">
        {/* Same plain-anchor reasoning as the auth pages' cross links. */}
        <a
          href={backHref}
          className="text-[var(--ivory)] underline underline-offset-2 transition-colors hover:text-[var(--lime)]"
        >
          Back to sign in
        </a>
      </p>
    </div>
  );
}
