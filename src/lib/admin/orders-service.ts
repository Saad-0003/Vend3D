import { z } from "zod";

import {
  isOrderStatus,
  normalizeOrder,
  nextOrderStatuses,
  sortOrdersNewest,
  type OrderNote,
  type OrderRecord,
  type OrderStatus,
  type OrderStatusEvent,
} from "@/lib/checkout/order";

/**
 * The admin orders seam (U6). Reads and writes the SAME
 * `vend3d-orders` `{ state, version }` envelope the checkout's
 * `useOrdersStore` persists — the admin advances histories and appends notes
 * in place, so the customer-facing `/order/[id]` timeline sees the change on
 * its next hydrate. Phase 10's server admin actions replace this file's
 * internals; the screens only ever know this interface.
 *
 * Lenience rules match D-094/D-095: a corrupt payload reads as empty demo
 * data, a blocked storage propagates into the screens' error state with a
 * retry. Every write is validated — a status change is an append to
 * `statusHistory` plus the status flip, both rejected for unknown ids.
 */

export const ORDERS_STORAGE_KEY = "vend3d-orders";

/** Minimal Storage surface — the same shape every admin/auth service takes. */
export type AdminOrdersStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

export type AdminOrdersWriteResult =
  | { ok: true; order: OrderRecord }
  | { ok: false; error: string };

export interface AdminOrdersService {
  /** Normalized records, newest first. */
  listOrders(): Promise<OrderRecord[]>;
  getOrder(id: string): Promise<OrderRecord | null>;
  /** Limited to the demo transition map; appends a timestamped history entry. */
  setOrderStatus(id: string, status: OrderStatus): Promise<AdminOrdersWriteResult>;
  /** Back-office note; newest first on read. */
  addOrderNote(id: string, body: string): Promise<AdminOrdersWriteResult>;
}

export type LocalAdminOrdersServiceInput = {
  storage?: AdminOrdersStorage | null;
  /** Test seam only; defaults to `Date.now().toISOString()`. */
  now?: () => string;
};

const noteSchema = z.object({
  body: z.string().trim().min(1, "Write a note first").max(500, "Keep notes under 500 characters"),
});

/** A friendly, user-actionable rejection thrown inside `mapOrder`'s mapper. */
class DomainError extends Error {}

export function createLocalAdminOrdersService(input: LocalAdminOrdersServiceInput = {}): AdminOrdersService {
  const now = input.now ?? (() => new Date().toISOString());

  const defaultStorage = (): AdminOrdersStorage | null =>
    typeof window === "undefined"
      ? null
      : {
          getItem: (key) => window.localStorage.getItem(key),
          setItem: (key, value) => window.localStorage.setItem(key, value),
        };

  function storage(): AdminOrdersStorage {
    const s = input.storage === undefined ? defaultStorage() : input.storage;
    if (!s) throw new Error("Admin orders are only available in the browser.");
    return s;
  }

  function readRecords(): OrderRecord[] {
    const s = storage();
    const raw = s.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      const orders = (parsed as { state?: { orders?: unknown[] } } | null)?.state?.orders;
      if (!Array.isArray(orders)) return [];
      // Structural lenience here: the orders store owns the record shape and
      // runtime validation, so we only re-order and normalize history.
      return (orders as OrderRecord[])
        .filter((o) => typeof o?.id === "string" && typeof o?.status === "string")
        .map(normalizeOrder);
    } catch {
      return []; // corrupt payload reads as "no demo orders" — same as D-094.
    }
  }

  function writeOrders(next: OrderRecord[]): void {
    try {
      storage().setItem(ORDERS_STORAGE_KEY, JSON.stringify({ state: { orders: next }, version: 0 }));
    } catch {
      throw new Error("Saving failed: this browser's local storage is full. Free some space and try again.");
    }
  }

  function mapOrder(
    id: string,
    run: (order: OrderRecord) => OrderRecord,
  ): AdminOrdersWriteResult {
    try {
      const records = readRecords();
      const current = records.find((o) => o.id === id);
      if (!current) {
        return {
          ok: false,
          error: `Order "${id}" is not in this browser's demo history. Reload the list.`,
        };
      }
      const next = run(current);
      writeOrders([...records.filter((o) => o.id !== id), next]);
      return { ok: true, order: next };
    } catch (error) {
      if (error instanceof DomainError) return { ok: false, error: error.message };
      if (error instanceof Error && error.message.startsWith("Saving failed:")) {
        return { ok: false, error: error.message };
      }
      return {
        ok: false,
        error: "Saving failed: this browser is blocking its local stores. Try again later.",
      };
    }
  }

  return {
    async listOrders() {
      return sortOrdersNewest(readRecords());
    },

    async getOrder(id) {
      return readRecords().find((o) => o.id === id) ?? null;
    },

    async setOrderStatus(id, status) {
      if (!isOrderStatus(status)) {
        return { ok: false, error: `Unknown status "${status}".` };
      }
      return mapOrder(id, (order) => {
        const allowed = nextOrderStatuses(order.status);
        if (!allowed.includes(status)) {
          throw new DomainError(
            allowed.length === 0
              ? `A ${order.status.toLowerCase()} order is final in the demo — it cannot move again.`
              : `From ${order.status} the demo allows: ${allowed.join(", ")}.`,
          );
        }
        const event: OrderStatusEvent = { status, at: now() };
        return {
          ...order,
          status,
          statusHistory: [...order.statusHistory, event],
        };
      });
    },

    async addOrderNote(id, body) {
      const parsed = noteSchema.safeParse({ body });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Write a note first" };
      }
      return mapOrder(id, (order) => {
        const note: OrderNote = {
          id: `note-${Date.parse(order.createdAt)}-${order.notes?.length ?? 0}-${Math.random().toString(36).slice(2, 8)}`,
          body: parsed.data.body,
          at: now(),
        };
        return { ...order, notes: [...(order.notes ?? []), note] };
      });
    },
  };
}

/** The singleton the screens consume; tests build their own instance. */
export const adminOrdersService = createLocalAdminOrdersService();
