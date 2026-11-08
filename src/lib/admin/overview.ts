import type { Product } from "@/lib/catalog";
import { sortOrdersNewest, type OrderRecord } from "@/lib/checkout/order";
import type { SavedDesign } from "@/stores/designs-store";

/**
 * Dashboard aggregation (plan.md Phase 1B U4). Pure, so the numbers the
 * back-office opens with are unit-testable without a DOM and Phase 10 can
 * swap the input for server queries without touching the screen.
 *
 * Money stays integer cents end to end; `formatCents` is the only formatter.
 */

/** The flattened row the recent-orders table renders. */
export type AdminOrderRow = {
  id: string;
  /** The checkout contact — the closest thing a browser-local demo has to a customer. */
  customer: string;
  status: OrderRecord["status"];
  createdAt: string;
  itemCount: number;
  totalCents: number;
};

export type AdminOverview = {
  totalOrders: number;
  /** Sum of every order's total, cents. */
  revenueCents: number;
  productCount: number;
  designCount: number;
  recentOrders: AdminOrderRow[];
};

export const RECENT_ORDER_LIMIT = 5;

/** The customer name an order history lists; no account record exists yet on this seam. */
function orderCustomer(order: OrderRecord): string {
  return order.address.fullName || order.address.email;
}

export function toAdminOrderRow(order: OrderRecord): AdminOrderRow {
  return {
    id: order.id,
    customer: orderCustomer(order),
    status: order.status,
    createdAt: order.createdAt,
    itemCount: order.itemCount,
    totalCents: order.totalCents,
  };
}

/**
 * The dashboard's numbers. `limit` exists for tests; the screen uses the
 * module default so "latest 5" has one source of truth.
 */
export function computeAdminOverview(
  input: { orders: OrderRecord[]; designs: SavedDesign[]; products: Product[] },
  limit: number = RECENT_ORDER_LIMIT,
): AdminOverview {
  // `sortOrdersNewest` is the one ordering rule (lib/orders/history.ts reuses
  // it for the same reason): never invent a second newest-first sort.
  const newest = sortOrdersNewest(input.orders);
  return {
    totalOrders: input.orders.length,
    revenueCents: input.orders.reduce((sum, order) => sum + order.totalCents, 0),
    productCount: input.products.length,
    designCount: input.designs.length,
    recentOrders: newest.slice(0, Math.max(0, limit)).map(toAdminOrderRow),
  };
}
