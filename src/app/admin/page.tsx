import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Demo orders, revenue, catalog and saved designs for this browser.",
};

/**
 * `/admin` — the back office's first screen (plan.md Phase 1B U4). The guard
 * lives in `admin/layout.tsx`, so admin content only ever mounts behind the
 * admin role check (client prompt; the server check is Phase 3/10).
 */
export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
