"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AccountMenu } from "@/components/auth/account-menu";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Navbar auth wiring (plan.md Phase 3).
 *
 * Signed out: the avatar opens `AuthDialog` instead of dead-ending on `/login`.
 * Signed in: the same button opens the account `Popover` menu. The trigger's
 * size, colour and pill shape are the header's existing ones — this file only
 * changes what the button does, per the brief's "wiring changes, no redesign".
 *
 * The root header is a server component and this is the one client island in
 * it, so the sticky shell still renders without JavaScript.
 *
 * Deliberately no `useSearchParams()` here: the hook needs a Suspense boundary,
 * and this component is rendered on every route including the statically
 * generated ones. The `?next=` contract belongs to the full pages (`/login`,
 * `/signup`), which read `next` server-side and pass it to the form; the navbar
 * dialog always lands on `/account`, which is that default anyway.
 */
export function NavAuthButton() {
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={user ? "Account menu" : "Sign in"}
      className="bg-primary text-primary-foreground hover:bg-primary/85 size-8 rounded-full"
    >
      <User className="size-4" strokeWidth={1.5} aria-hidden />
    </Button>
  );

  return (
    <>
      {user ? (
        <AccountMenu>{trigger}</AccountMenu>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign in"
          onClick={() => setDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/85 size-8 rounded-full"
        >
          <User className="size-4" strokeWidth={1.5} aria-hidden />
        </Button>
      )}

      <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Keeps the avatar reachable without JS: the dialog needs it, this does not. */}
      <Link href="/login" className="sr-only" tabIndex={user ? -1 : 0}>
        Sign in
      </Link>
    </>
  );
}
