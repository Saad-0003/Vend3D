import type { Product } from "@/lib/catalog";
import { listProducts } from "@/lib/catalog";
import {
  baseAdminProducts,
  adminPartsFromConfig,
  adminDecalZonesFromConfig,
  uniqueSlug,
} from "@/lib/admin/catalog-ops";
import { adminProductRecordSchema, type AdminProduct, type AdminProductStatus } from "@/lib/admin/product-schema";

/**
 * The catalog read/write seam for the admin product screens (plan.md Phase
 * 1B U5). One interface, localStorage implementation — the same swap contract
 * as `AdminService` (D-094) and `AuthService` (D-051): the browser-local body
 * stores overrides and admin-created records; edits to the four static
 * catalog products merge over `baseAdminProducts()`, so "Edit" always starts
 * from the truth the storefront actually shows.
 *
 * The storefront is untouched by design (U5): Phase 4's Prisma-backed
 * implementation replaces this file's internals, and Phase 10's server admin
 * keeps every screen.
 */

export const ADMIN_PRODUCTS_STORAGE_KEY = "vend3d-admin-products";

/** Minimal Storage surface — the same shape every admin/auth service takes. */
export type CatalogAdminStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

export type CatalogProductDraft = Omit<AdminProduct, "id" | "updatedAt">;

export type CatalogWriteResult =
  | { ok: true; product: AdminProduct }
  | { ok: false; error: string };

export interface CatalogAdminService {
  /** Catalog products merged with stored overrides, then admin-created ones. */
  listProducts(): Promise<AdminProduct[]>;
  getProduct(id: string): Promise<AdminProduct | null>;
  /** Uniquifies the slug on collision (`-2`, `-3`… plan.md §10). */
  createProduct(input: CatalogProductDraft): Promise<CatalogWriteResult>;
  updateProduct(id: string, patch: Partial<CatalogProductDraft>): Promise<CatalogWriteResult>;
  /** Copy with a new unique slug/name; an archived source duplicates as a draft. */
  duplicateProduct(id: string): Promise<CatalogWriteResult>;
  setProductStatus(id: string, status: AdminProductStatus): Promise<CatalogWriteResult>;
}

export type LocalCatalogAdminServiceInput = {
  storage?: CatalogAdminStorage | null;
  /** Defaults to the static catalog; Phase 4's query is a drop-in. */
  readCatalog?: () => Promise<Product[]> | Product[];
};

/**
 * A quota failure is the one write verdict the demo cannot bury: editing a
 * product losing its 1.5 MB model silently would be a data bug, so the
 * service surfaces it and the form turns it into an actionable toast.
 */
function readRecords(storage: CatalogAdminStorage | null): AdminProduct[] {
  if (!storage) throw new Error("Admin products are only available in the browser.");
  const raw = storage.getItem(ADMIN_PRODUCTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const records = (parsed as { state?: { records?: unknown[] } } | null)?.state?.records;
    if (!Array.isArray(records)) return [];
    // Zod-gate every entry: a hand-edited or stale key drops bad members.
    return records.flatMap((record) => {
      const result = adminProductRecordSchema.safeParse(record);
      return result.success ? [result.data] : [];
    });
  } catch {
    // Corrupt payload reads as "no overrides" — same lenience as D-094.
    return [];
  }
}

function writeRecords(storage: CatalogAdminStorage, records: AdminProduct[]): void {
  try {
    storage.setItem(
      ADMIN_PRODUCTS_STORAGE_KEY,
      JSON.stringify({ state: { records }, version: 0 }),
    );
  } catch {
    throw new Error("Saving failed: this browser's local storage is full. Remove a large model or image and try again.");
  }
}

/** Catalog merge: overrides by id win; catalog rows carry their seeded parts/images. */
function catalogDefaults(id: string): AdminProduct | undefined {
  return baseAdminProducts().find((p) => p.id === id);
}

function storedOrBase(records: AdminProduct[], id: string): AdminProduct | undefined {
  const stored = records.find((r) => r.id === id);
  if (stored) return stored;
  return catalogDefaults(id);
}

export function createLocalCatalogAdminService(
  input: LocalCatalogAdminServiceInput = {},
): CatalogAdminService {
  const readCatalog = input.readCatalog ?? listProducts;

  return {
    async listProducts() {
      const catalog = await readCatalog();
      const storage = input.storage === undefined ? defaultStorage() : input.storage;
      const records = readRecords(storage);
      const catalogIds = new Set(catalog.map((p) => p.id));
      const merged = [
        ...catalog.map((base) => records.find((r) => r.id === base.id) ?? (catalogDefaults(base.id) as AdminProduct)),
        ...records.filter((r) => !catalogIds.has(r.id)),
      ];
      return merged;
    },

    async getProduct(id) {
      const storage = input.storage === undefined ? defaultStorage() : input.storage;
      return storedOrBase(readRecords(storage), id) ?? null;
    },

    async createProduct(draft) {
      try {
        const storage = requireBrowserStorage(input);
        const records = readRecords(storage);
        const catalogIds = (await readCatalog()).map((p) => p.id);
        const id = uniqueSlug(draft.slug, [...records.map((r) => r.id), ...catalogIds]);
        const product: AdminProduct = {
          ...draft,
          status: draft.status === "archived" ? "draft" : draft.status,
          id,
          slug: id,
          updatedAt: new Date().toISOString(),
        };
        writeRecords(storage, [...records.filter((r) => r.id !== id), product]);
        return { ok: true, product };
      } catch (error) {
        return { ok: false, error: toWriteError(error) };
      }
    },

    async updateProduct(id, patch) {
      try {
        const storage = requireBrowserStorage(input);
        const records = readRecords(storage);
        const current = storedOrBase(records, id);
        if (!current) return { ok: false, error: `Product "${id}" no longer exists. Reload the list.` };
        const next: AdminProduct = {
          ...current,
          ...patch,
          // The id is the stable identity — plan.md §5: order history survives.
          id: current.id,
          updatedAt: new Date().toISOString(),
        };
        const others = records.filter((r) => r.id !== id);
        writeRecords(storage, [...others, next]);
        return { ok: true, product: next };
      } catch (error) {
        return { ok: false, error: toWriteError(error) };
      }
    },

    async duplicateProduct(id) {
      try {
        const storage = requireBrowserStorage(input);
        const records = readRecords(storage);
        const source = storedOrBase(records, id);
        if (!source) return { ok: false, error: `Product "${id}" no longer exists. Reload the list.` };

        const idCandidates = [...records.map((r) => r.id), ...(await readCatalog()).map((p) => p.id)];
        const newId = uniqueSlug(`${source.slug}-copy`, idCandidates);
        const copy: AdminProduct = {
          ...source,
          id: newId,
          slug: newId,
          name: `${source.name} copy`.slice(0, 60),
          // An archive is not something to re-tweak blind: the copy reopens as a draft.
          status: source.status === "archived" ? "draft" : source.status,
          updatedAt: new Date(Date.parse(source.updatedAt) + 1).toISOString(),
        };
        writeRecords(storage, [...records, copy]);
        return { ok: true, product: copy };
      } catch (error) {
        return { ok: false, error: toWriteError(error) };
      }
    },

    async setProductStatus(id, status) {
      return this.updateProduct(id, { status });
    },
  };
}

/**
 * Every write-path failure comes back as `{ ok: false, error }` with an
 * already-actionable string (the form toasts it verbatim) — nothing storage
 * related is allowed to install itself as an unhandled rejection.
 */
function toWriteError(error: unknown): string {
  if (error instanceof Error && error.message.startsWith("Saving failed:")) {
    return error.message;
  }
  return "Saving failed: this browser is blocking its local stores. Try again — if it keeps happening, check this site's data permissions.";
}

function requireBrowserStorage(input: LocalCatalogAdminServiceInput): CatalogAdminStorage {
  const storage = input.storage === undefined ? defaultStorage() : input.storage;
  if (!storage) throw new Error("Admin products are only available in the browser.");
  return storage;
}

function defaultStorage(): CatalogAdminStorage | null {
  return typeof window === "undefined"
    ? null
    : {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
      };
}

/**
 * The singleton the screens consume; tests build their own instance. Parts/
 * decals for a fresh product come from its catalog config when one exists —
 * otherwise the seeded defaults in `adminPartsFromConfig` are applied at form
 * level (see `product-form.tsx`).
 */
export const catalogAdminService = createLocalCatalogAdminService();

/* Re-exports so the screens only ever touch one admin seam module. */
export { adminPartsFromConfig, adminDecalZonesFromConfig };
