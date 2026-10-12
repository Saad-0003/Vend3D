"use client";

import { useEffect, useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { loginUrlWithNext } from "@/lib/auth/next";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Client session guard for `/account` (plan.md Phase 3).
 *
 * plan.md puts route protection in `middleware.ts` — the only place it can be
 * trusted, because a client guard is a convenience, not a control. Phase 3
 * builds that middleware over the real Supabase session; until it exists this
 * gives `/account` the correct behaviour (bounce to `/login?next=`, return
 * after) using the same `sanitizeNext` rule the middleware will need.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // Wait for the session read before deciding: redirecting on the first paint
    // would bounce a signed-in shopper whose session had not loaded yet.
    if (!hydrated || user) return;

    const target = `${window.location.pathname}${window.location.search}`;
    setRedirecting(true);
    window.location.replace(loginUrlWithNext(target));
  }, [hydrated, user]);

  if (!hydrated) {
    return (
      <PageShell aria-label="Account" className="lux">
        <Skeleton role="status" aria-label="Loading account" className="h-72 w-full rounded-[var(--card-radius)]" />
      </PageShell>
    );
  }

  if (redirecting || !user) {
    return (
      <PageShell aria-label="Account" className="lux">
        <Skeleton role="status" aria-label="Redirecting to sign in" className="h-72 w-full rounded-[var(--card-radius)]" />
      </PageShell>
    );
  }

  return <>{children}</>;
}
