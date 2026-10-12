import type { Metadata } from "next";

import { AccountScreen } from "@/components/account/account-screen";
import { RequireAuth } from "@/components/auth/require-auth";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Vend3D profile, orders and saved designs.",
};

/**
 * `/account` — the signed-in home plan.md Phase 3 sends `?next=` to by default.
 *
 * Guarded by `RequireAuth`, which bounces a signed-out shopper to
 * `/login?next=/account` and returns them here after a successful sign-in.
 * plan.md puts route protection in `middleware.ts`; until that exists this is a
 * client-side convenience guard only, and the docblock on `RequireAuth` says so
 * rather than implying a server-verified boundary.
 */
export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountScreen />
    </RequireAuth>
  );
}
