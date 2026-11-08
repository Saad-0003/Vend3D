import type { Metadata } from "next";

import { RequireAdmin } from "@/components/auth/require-admin";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Shared /admin frame (plan.md Phase 1B U4). The admin client guard wraps the
 * shell itself — the *server* check is Phase 3/10 — so no admin route can
 * forget to be guarded. A non-admin bounces to `/forbidden` before any admin
 * layout content mounts.
 */
export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
