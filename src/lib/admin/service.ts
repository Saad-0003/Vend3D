import type { Product } from "@/lib/catalog";
import { listProducts } from "@/lib/catalog";
import type { OrderRecord } from "@/lib/checkout/order";
import type { SavedDesign } from "@/stores/designs-store";

import {
  computeAdminOverview,
  type AdminOverview,
} from "@/lib/admin/overview";

/**
 * The admin read seam (plan.md Phase 1B U4). Phase 10 replaces this file with
 * a server-backed implementation — the dashboard screen only ever knows this
 * interface, same swap contract as `AuthService` (D-051) and the seam rules
 * for U1/U2/U3 (D-093).
 *
 * The browser implementation reads the zustand stores' persisted payloads
 * directly: the stores own `skipHydration`, so a dashboard visit never forces
 * the storefront to hydrate them, and the JSON envelopes (`{ state, version }`)
 * are public formats the e2e suite already seeds.
 */

/** Minimal Storage surface — the same shape `createMockAuthService` takes. */
export type AdminStorage = {
  getItem(key: string): string | null;
};

export interface AdminService {
  getOverview(): Promise<AdminOverview>;
}

export type LocalAdminServiceInput = {
  /**
   * Defaults to `localStorage` in the browser. `null` is "no browser" (an
   * accidental server render) and resolves as a rejection the dashboard turns
   * into its error state; test doubles inject either shape.
   */
  storage?: AdminStorage | null;
  /** Defaults to the static catalog; Phase 4's query is a drop-in. */
  readProducts?: () => Promise<Product[]> | Product[];
};

/** Persisted wrappers — the zustand `partialize` shapes, version 0. */
export const ORDERS_STORAGE_KEY = "vend3d-orders";
export const DESIGNS_STORAGE_KEY = "vend3d-designs";

/**
 * A corrupt or partial payload reads as "no data", never as a crash: the same
 * lenience a storefront screen gets from zustand's rehydrate, and the demo
 * banner tells the admin where data comes from anyway. A *storage* that throws
 * (blocked access) is different — that propagates and surfaces as the
 * dashboard's error state with a retry, because "zero everything" would be a
 * lie about data the browser actually holds.
 */
function readRecords<T>(
  storage: AdminStorage | null,
  key: string,
  listProp: "orders" | "designs",
): T[] {
  if (!storage) return [];
  // Outside the try: a blocked getItem is an environment failure, not bad data.
  const raw = storage.getItem(key);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const state = (parsed as { state?: Record<string, unknown> } | null)?.state;
    return Array.isArray(state?.[listProp]) ? (state[listProp] as T[]) : [];
  } catch {
    return [];
  }
}

function readOrders(storage: AdminStorage | null): OrderRecord[] {
  return readRecords<OrderRecord>(storage, ORDERS_STORAGE_KEY, "orders");
}

function readDesigns(storage: AdminStorage | null): SavedDesign[] {
  return readRecords<SavedDesign>(storage, DESIGNS_STORAGE_KEY, "designs");
}

export function createLocalAdminService(
  input: LocalAdminServiceInput = {},
): AdminService {
  const readProducts = input.readProducts ?? listProducts;

  return {
    async getOverview(): Promise<AdminOverview> {
      // Resolved lazily so modules imported during SSR never touch `window`.
      const storage = input.storage === undefined ? defaultStorage() : input.storage;
      if (!storage) {
        // e.g. an accidental server render without an injected double — the
        // dashboard turns this into its error state with a retry.
        throw new Error("Admin data is only available in the browser.");
      }
      const products = await readProducts();
      return computeAdminOverview({
        orders: readOrders(storage),
        designs: readDesigns(storage),
        products,
      });
    },
  };
}

function defaultStorage(): AdminStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/** The singleton the dashboard consumes; tests build their own instance. */
export const adminService = createLocalAdminService();
