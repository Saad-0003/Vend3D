import type { Metadata } from "next";

import { OrdersScreen } from "@/components/admin/orders/orders-screen";

export const metadata: Metadata = {
  title: "Orders — Admin",
  description: "The demo orders this browser has placed, with their demo status updater.",
};

/** `/admin/orders` (plan.md Phase 1B U6) — list screen. */
export default function AdminOrdersPage() {
  return <OrdersScreen />;
}
