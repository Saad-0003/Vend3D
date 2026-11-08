import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Order detail",
};

/**
 * `/admin/orders/[id]` — reached from the dashboard's recent-orders table.
 * The real detail view is U6 (list + detail + status updater, plan.md), so
 * this keeps the linked route navigable in the same placeholder the /admin
 * tree itself used before U4 (D-019's pattern): the shell, guard and
 * breadcrumbs are real; the screen is not yet.
 */
export default function AdminOrderDetailPage() {
  return (
    <PagePlaceholder
      eyebrow="Orders"
      title="Order detail"
      description="The orders list and this detail view arrive with U6 — status history, line items and the limited demo status updater."
    />
  );
}
