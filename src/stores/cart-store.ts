"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Configuration } from "@/lib/products/configuration";

/**
 * Client cart mirror. Phase 8 makes the server the source of truth; until then
 * this store holds the lines so the navbar badge, drawer and /cart work end to
 * end. `unitCents` is a snapshot taken at add-time, matching the Phase 8 contract.
 */
export type CartLine = {
  id: string;
  slug: string;
  name: string;
  configuration: Configuration;
  /** `data:` URL of the stage snapshot, or empty when capture was unavailable. */
  thumbnail: string;
  qty: number;
  unitCents: number;
};

export const CART_QTY_MAX = 10;

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  /** Bumped on every add so the navbar badge can replay its pop animation. */
  pulse: number;
  /** False until localStorage has been read, so the UI never shows a stale empty cart. */
  hydrated: boolean;
};

type CartActions = {
  addLine: (line: Omit<CartLine, "id" | "qty"> & { qty: number }) => string;
  setDrawerOpen: (open: boolean) => void;
  removeLine: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  hydrate: () => void;
};

let idSeq = 0;
function newLineId(slug: string): string {
  idSeq += 1;
  return `${slug}-${Date.now().toString(36)}-${idSeq.toString(36)}`;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      lines: [],
      drawerOpen: false,
      pulse: 0,
      hydrated: false,

      addLine(input) {
        const id = newLineId(input.slug);
        const qty = Math.min(CART_QTY_MAX, Math.max(1, Math.round(input.qty)));
        set((s) => ({
          lines: [...s.lines, { ...input, qty, id }],
          pulse: s.pulse + 1,
        }));
        return id;
      },

      setDrawerOpen(open) {
        set({ drawerOpen: open });
      },

      removeLine(id) {
        set((s) => ({ lines: s.lines.filter((l) => l.id !== id) }));
      },

      setQty(id, qty) {
        const clamped = Math.min(CART_QTY_MAX, Math.max(1, Math.round(qty)));
        set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, qty: clamped } : l)) }));
      },

      hydrate() {
        if (get().hydrated) return;
        void useCartStore.persist.rehydrate();
        set({ hydrated: true });
      },
    }),
    {
      name: "vend3d-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Only the lines persist. Drawer state and the pulse counter are per-visit.
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

/** Count shown on the navbar badge: total units, not distinct lines. */
export function selectCartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function selectSubtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitCents * l.qty, 0);
}
