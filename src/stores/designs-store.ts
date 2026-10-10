"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Configuration } from "@/lib/products/configuration";

/** Client design library mirror. Phase 7 moves saves to the server with ownership checks. */
export type SavedDesign = {
  id: string;
  name: string;
  slug: string;
  productName: string;
  configuration: Configuration;
  thumbnail: string;
  updatedAt: string;
};

type DesignsState = {
  designs: SavedDesign[];
};

type DesignsActions = {
  saveDesign: (design: Omit<SavedDesign, "id" | "updatedAt">) => SavedDesign;
  removeDesign: (id: string) => void;
};

const MAX_DESIGNS = 50;

export const useDesignsStore = create<DesignsState & DesignsActions>()(
  persist(
    (set) => ({
      designs: [],

      saveDesign(input) {
        const saved: SavedDesign = {
          ...input,
          id: `d-${Date.now().toString(36)}`,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ designs: [saved, ...s.designs].slice(0, MAX_DESIGNS) }));
        return saved;
      },

      removeDesign(id) {
        set((s) => ({ designs: s.designs.filter((d) => d.id !== id) }));
      },
    }),
    {
      name: "vend3d-designs",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ designs: s.designs }),
    },
  ),
);
