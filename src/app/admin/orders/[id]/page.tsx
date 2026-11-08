import type { Metadata } from "next";

import { OrderDetailScreen } from "@/components/admin/orders/order-detail";

export const metadata: Metadata = {
  title: "Order detail — Admin",
  description: "One demo order: items, status history, the demo updater and internal notes.",
};

type Params = Promise<{ id: string }>;

/**
 * `/admin/orders/[id]` (U6) — replaces the U4 PagePlaceholder. The shell,
 * guard and breadcrumbs (including the not-found panel) were already real;
 * `params` is awaited per the Next 15 contract the customer route follows.
 */
export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return <OrderDetailScreen id={id} />;
}
