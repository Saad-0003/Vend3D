"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Configuration } from "@/lib/products/configuration";

/**
 * Client design library. Phase 7 moves this to the server with ownership checks;
 * until then it is a per-browser anonymous list, because plan.md's auth phase is
 * not built yet. `status` is derived from whether the design has been ordered.
 */
export type SavedDesign = {
  id: string;
  name: string;
  slug: string;
  productName: string;
  configuration: Configuration;
  /** `data:` URL of the stage snapshot, or empty when capture was unavailable. */
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  /** Set when a cart line for this design was checked out. Drafts have none. */
  orderedAt?: string;
};

type DesignsState = {
  designs: SavedDesign[];
};

type DesignsActions = {
  saveDesign: (design: Pick<SavedDesign, "name" | "slug" | "productName" | "configuration" | "thumbnail">) => SavedDesign;
  renameDesign: (id: string, name: string) => void;
  duplicateDesign: (id: string) => SavedDesign | null;
  removeDesign: (id: string) => SavedDesign | null;
  restoreDesign: (design: SavedDesign) => void;
  markOrdered: (id: string) => void;
};

const MAX_DESIGNS = 50;

export const useDesignsStore = create<DesignsState & DesignsActions>()(
  persist(
    (set, get) => ({
      designs: [],

      saveDesign(input) {
        const now = new Date().toISOString();
        const saved: SavedDesign = {
          ...input,
          id: `d-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ designs: [saved, ...s.designs].slice(0, MAX_DESIGNS) }));
        return saved;
      },

      renameDesign(id, name) {
        const trimmed = name.trim().slice(0, 50);
        if (!trimmed) return;
        set((s) => ({
          designs: s.designs.map((d) =>
            d.id === id ? { ...d, name: trimmed, updatedAt: new Date().toISOString() } : d,
          ),
        }));
      },

      duplicateDesign(id) {
        const source = get().designs.find((d) => d.id === id);
        if (!source) return null;
        const now = new Date().toISOString();
        const copy: SavedDesign = {
          ...source,
          id: `d-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          name: `${source.name} copy`.slice(0, 50),
          createdAt: now,
          updatedAt: now,
          orderedAt: undefined,
        };
        set((s) => ({ designs: [copy, ...s.designs].slice(0, MAX_DESIGNS) }));
        return copy;
      },

      removeDesign(id) {
        const existing = get().designs.find((d) => d.id === id) ?? null;
        set((s) => ({ designs: s.designs.filter((d) => d.id !== id) }));
        return existing;
      },

      restoreDesign(design) {
        set((s) => ({
          designs: [design, ...s.designs.filter((d) => d.id !== design.id)].slice(0, MAX_DESIGNS),
        }));
      },

      markOrdered(id) {
        set((s) => ({
          designs: s.designs.map((d) =>
            d.id === id ? { ...d, orderedAt: new Date().toISOString() } : d,
          ),
        }));
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
