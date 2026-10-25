"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loginRedirectUrl } from "@/lib/auth/guards";

/**
 * "Your session expired" recovery dialog (plan.md Phase 1B U3).
 *
 * Rendered by the route guards when the mock session has run past its lifetime
 * (D-093). The action is a plain anchor, deliberately not `next/link`: the
 * guarded page it leaves is unmounting its own UI, and the login form needs a
 * fully loaded document to be interactive (same reasoning as the auth pages'
 * cross links). `?next=` is captured at open time so "Sign in again" returns to
 * the exact screen the expiry interrupted.
 */
export function SessionExpiredDialog({ onDismiss }: { onDismiss: () => void }) {
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    setNext(window.location.pathname + window.location.search);
  }, []);

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        className="lux rounded-[var(--card-radius)] border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:max-w-[400px]"
        aria-describedby={undefined}
      >
        <DialogHeader className="gap-1 text-center sm:text-center">
          <DialogTitle className="lux-display text-[20px] text-[var(--ivory)]">
            Your session expired
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-[1.6] text-[var(--muted)]">
            Sign in again to continue. Your designs and cart stay in this browser.
          </DialogDescription>
        </DialogHeader>

        <Button asChild className="h-11 w-full rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90">
          <a href={loginRedirectUrl(next)}>Sign in again</a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
