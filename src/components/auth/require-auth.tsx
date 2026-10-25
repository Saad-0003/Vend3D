"use client";

import { useEffect, useState } from "react";

import { SessionExpiredDialog } from "@/components/auth/session-expired-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { decideGuard, loginRedirectUrl } from "@/lib/auth/guards";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Client session guard for `/account` (plan.md Phase 3).
 *
 * plan.md puts route protection in `middleware.ts` — the only place it can be
 * trusted, because a client guard is a convenience, not a control. Phase 3
 * builds that middleware over the real Supabase session; until it exists this
 * gives `/account` the correct behaviour (bounce to `/login?next=`, return
 * after) using the same `sanitizeNext` rule the middleware will need.
 *
 * An *expired* session (mock TTL, D-093) is shown the `SessionExpiredDialog`
 * instead of a redirect, so "Sign in again" can return to the exact screen the
 * shopper was on. Dismissing the dialog falls through to the normal
 * signed-out redirect.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const expired = useAuthStore((s) => s.expired);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [expiredDismissed, setExpiredDismissed] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // The decision drives both rendering and navigation, so the two can never
  // disagree about what the current state means.
  const decision = decideGuard({ hydrated, user, expired }, "session");

  useEffect(() => {
    if (decision === "login") {
      // The target is captured here (not during render) so SSR never touches
      // `window`, and it rides in `?next=` for the return trip.
      window.location.replace(loginRedirectUrl(window.location.pathname + window.location.search));
      return;
    }
    if (decision === "expired" && expiredDismissed) {
      // Dismissing the expired dialog falls back to the plain signed-out path.
      window.location.replace(loginRedirectUrl(window.location.pathname + window.location.search));
    }
  }, [decision, expiredDismissed]);

  if (decision === "wait") {
    return (
      <PageShell aria-label="Account" className="lux">
        <Skeleton role="status" aria-label="Loading account" className="h-72 w-full rounded-[var(--card-radius)]" />
      </PageShell>
    );
  }

  if (decision === "expired" && !expiredDismissed) {
    return (
      <PageShell aria-label="Account" className="lux">
        <Skeleton role="status" aria-label="Session expired" className="h-72 w-full rounded-[var(--card-radius)]" />
        <SessionExpiredDialog onDismiss={() => setExpiredDismissed(true)} />
      </PageShell>
    );
  }

  if (decision === "login" || decision === "expired") {
    return (
      <PageShell aria-label="Account" className="lux">
        <Skeleton role="status" aria-label="Redirecting to sign in" className="h-72 w-full rounded-[var(--card-radius)]" />
      </PageShell>
    );
  }

  return <>{children}</>;
}
