"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProductConfig } from "@/lib/products/config";
import {
  applyColorParam,
  defaultConfiguration,
  parseConfiguration,
  totalCents,
  type Configuration,
} from "@/lib/products/configuration";
import { commit, createHistory, redo, undo, type History } from "@/lib/products/history";

/**
 * One configurator state per product. Stores are keyed by slug so switching
 * products never leaks one product's colours or decals into another. The store
 * is created once per slug and reused by the screen.
 */
export type ConfiguratorState = {
  history: History<Configuration>;
  quantity: number;
  /** Set once the URL/persisted state has been reconciled with the product config. */
  hydrated: boolean;
};

type Actions = {
  init: (product: ProductConfig, colorParam: string | null) => void;
  update: (product: ProductConfig, next: Configuration) => void;
  setQuantity: (qty: number) => void;
  undo: () => void;
  redo: () => void;
  reset: (product: ProductConfig) => void;
};

const stores = new Map<string, ReturnType<typeof createConfiguratorStore>>();

function createConfiguratorStore(slug: string, product: ProductConfig) {
  return create<ConfiguratorState & Actions>()(
    persist(
      (set, get) => ({
        history: createHistory(defaultConfiguration(product)),
        quantity: 1,
        hydrated: false,

        init(p, colorParam) {
          if (get().hydrated) return;
          const restored = get().history.present;
          const base = parseConfiguration(p, restored);
          const withColor = applyColorParam(p, base, colorParam);
          set({ history: createHistory(withColor), hydrated: true });
        },

        update(p, next) {
          const reconciled = parseConfiguration(p, next);
          set((s) => ({ history: commit(s.history, reconciled) }));
        },

        setQuantity(qty) {
          set({ quantity: Math.min(10, Math.max(1, Math.round(qty))) });
        },

        undo() {
          set((s) => ({ history: undo(s.history) }));
        },

        redo() {
          set((s) => ({ history: redo(s.history) }));
        },

        reset(p) {
          set((s) => ({ history: commit(s.history, defaultConfiguration(p)) }));
        },
      }),
      {
        name: `vend3d-configurator:${slug}`,
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        // Only the present configuration persists; history and transient flags do not.
        partialize: (s) => ({ history: { past: [], present: s.history.present, future: [] } }),
      },
    ),
  );
}

/** Store for a product slug. Created lazily so an unknown slug never reaches here. */
export function getConfiguratorStore(product: ProductConfig) {
  let store = stores.get(product.slug);
  if (!store) {
    store = createConfiguratorStore(product.slug, product);
    stores.set(product.slug, store);
  }
  return store;
}

/** Price for the current quantity. Integer cents throughout; formatting happens at the UI edge. */
export function selectTotalCents(product: ProductConfig, quantity: number): number {
  return totalCents(product.priceCents, quantity);
}
