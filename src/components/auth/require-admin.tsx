"use client";

import { useEffect, useState } from "react";

import { SessionExpiredDialog } from "@/components/auth/session-expired-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { decideGuard, loginRedirectUrl } from "@/lib/auth/guards";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Client admin guard (plan.md Phase 1B U3) — the `/forbidden` half of the auth
 * surface: a non-admin opening an `/admin` route bounces to `/forbidden`, and a
 * signed-out visitor bounces to `/login?next=` as in `RequireAuth`.
 *
 * The docblock on `RequireAuth` applies verbatim: this is a prompt, not a
 * control. plan.md Phase 3's server-side check ("never trust a client flag") is
 * the boundary that matters; this exists so the admin screens U4–U6 have the
 * same shopper-visible gating the mock's `role` offers (D-093).
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
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
  const decision = decideGuard({ hydrated, user, expired }, "admin");

  useEffect(() => {
    if (decision === "login") {
      // The return contract matches RequireAuth: `?next=` brings the admin
      // straight back to the screen that asked for the sign-in.
      window.location.replace(loginRedirectUrl(window.location.pathname + window.location.search));
      return;
    }
    if (decision === "forbidden") {
      // Non-admin on an admin route. This client flip is a prompt; the real
      // gate is the server-side admin check from plan.md Phase 3/10.
      window.location.replace("/forbidden");
      return;
    }
    if (decision === "expired" && expiredDismissed) {
      // No session to check a role against: the login redirect is the fallback.
      window.location.replace(loginRedirectUrl(window.location.pathname + window.location.search));
    }
  }, [decision, expiredDismissed]);

  if (decision === "wait") {
    return (
      <PageShell aria-label="Admin" className="lux">
        <Skeleton role="status" aria-label="Loading admin" className="h-72 w-full rounded-[var(--card-radius)]" />
      </PageShell>
    );
  }

  if (decision === "expired" && !expiredDismissed) {
    return (
      <PageShell aria-label="Admin" className="lux">
        <Skeleton role="status" aria-label="Session expired" className="h-72 w-full rounded-[var(--card-radius)]" />
        <SessionExpiredDialog onDismiss={() => setExpiredDismissed(true)} />
      </PageShell>
    );
  }

  if (decision === "login" || decision === "expired") {
    return (
      <PageShell aria-label="Admin" className="lux">
        <Skeleton role="status" aria-label="Redirecting to sign in" className="h-72 w-full rounded-[var(--card-radius)]" />
      </PageShell>
    );
  }

  if (decision === "forbidden") {
    return (
      <PageShell aria-label="Admin" className="lux">
        <Skeleton role="status" aria-label="Redirecting to /forbidden" className="h-72 w-full rounded-[var(--card-radius)]" />
      </PageShell>
    );
  }

  return <>{children}</>;
}
