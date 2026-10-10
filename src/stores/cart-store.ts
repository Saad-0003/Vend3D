"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Configuration } from "@/lib/products/configuration";

/**
 * Client cart mirror. Phase 8 makes the server the source of truth; until then
 * this store holds the lines so the navbar badge and cart drawer work end to end.
 * `unitCents` is a snapshot taken at add-time, matching the Phase 8 contract.
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

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  /** Bumped on every add so the navbar badge can replay its pop animation. */
  pulse: number;
};

type CartActions = {
  addLine: (line: Omit<CartLine, "id" | "qty"> & { qty: number }) => void;
  setDrawerOpen: (open: boolean) => void;
  removeLine: (id: string) => void;
};

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set) => ({
      lines: [],
      drawerOpen: false,
      pulse: 0,

      addLine(input) {
        const id = `${input.slug}-${Date.now().toString(36)}`;
        set((s) => ({
          lines: [...s.lines, { ...input, id }],
          pulse: s.pulse + 1,
        }));
      },

      setDrawerOpen(open) {
        set({ drawerOpen: open });
      },

      removeLine(id) {
        set((s) => ({ lines: s.lines.filter((l) => l.id !== id) }));
      },
    }),
    {
      name: "vend3d-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);
