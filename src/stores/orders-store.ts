"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { buildOrderRecord, ORDER_STATUS, type OrderRecord } from "@/lib/checkout/order";

/**
 * Placed orders. Phase 9 moves this to the server (`placeOrder` action, DB
 * transaction); until then it is a client mirror in the shape D-041
 * established — same idempotency contract, same field set, so the swap is a
 * store body change and not a caller change.
 *
 * Idempotency: one order per `checkoutKey`. A double-submit, a retried network
 * call or a second tab on the same attempt returns the order that already
 * exists instead of creating a second one (ARCHITECTURE.md §3.3).
 */

export type { OrderRecord };

type OrdersState = {
  orders: OrderRecord[];
  /** False until localStorage has been read, so the UI never shows "not found" too early. */
  hydrated: boolean;
};

type OrdersActions = {
  /** Returns the existing order when `checkoutKey` was already used. */
  placeOrder: (input: Omit<Parameters<typeof buildOrderRecord>[0], "id" | "createdAt"> & {
    id: string;
  }) => OrderRecord;
  findOrder: (id: string) => OrderRecord | undefined;
  hydrate: () => void;
};

const MAX_ORDERS = 50;

/**
 * localStorage is a shared, quota-limited bucket (~5MB per origin, also
 * carrying `vend3d-cart` and `vend3d-designs`). A write that throws
 * `QuotaExceededError` must never fail an order that already succeeded, so the
 * wrapper swallows write errors and keeps the order in memory.
 */
const safeStorage = createJSONStorage(() => {
  const store = localStorage;
  return {
    getItem: (name: string) => store.getItem(name),
    setItem: (name: string, value: string) => {
      try {
        store.setItem(name, value);
      } catch {
        // Losing reload durability is better than failing the order.
      }
    },
    removeItem: (name: string) => store.removeItem(name),
  };
});

/**
 * Thumbnails are excluded from persistence: `JSON.stringify` drops `undefined`
 * properties, so a full-canvas PNG data URL (commonly megabytes at the studio's
 * `dpr`) is never written. A reloaded order falls back to the product image,
 * which is the same fallback the cart already uses for an uncaptured snapshot.
 */
function persistedOrders(orders: OrderRecord[]): OrderRecord[] {
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item, thumbnail: undefined })),
  }));
}

export const useOrdersStore = create<OrdersState & OrdersActions>()(
  persist(
    (set, get) => ({
      orders: [],
      hydrated: false,

      placeOrder(input) {
        const existing = get().orders.find((o) => o.checkoutKey === input.checkoutKey);
        if (existing) return existing;

        const record = buildOrderRecord(input);
        set((s) => ({ orders: [record, ...s.orders].slice(0, MAX_ORDERS) }));
        return record;
      },

      findOrder(id) {
        return get().orders.find((o) => o.id === id);
      },

      hydrate() {
        if (get().hydrated) return;
        void useOrdersStore.persist.rehydrate();
        set({ hydrated: true });
      },
    }),
    {
      name: "vend3d-orders",
      storage: safeStorage,
      skipHydration: true,
      partialize: (s) => ({ orders: persistedOrders(s.orders) }),
    },
  ),
);

export { ORDER_STATUS };
