import { z } from "zod";

import { CATEGORIES, type Category } from "@/lib/catalog";

/**
 * The admin product contract (plan.md Phase 1B U5). Shapes mirror the live
 * storefront contract — `Product` for the basics, `ProductConfig` parts/decal/
 * engrave for customization — so Phase 4's Prisma `Product` migration can map
 * this 1:1 and Phase 10's server admin keeps the screen's zod rules.
 *
 * Uploaded files persist as data URLs under hard size caps: ~5 MB of shared
 * `localStorage` cannot hold a 15 MB GLB, so the *demo* cap is smaller than
 * Phase 10's server limit (the server-side magic-bytes pass adds the rest).
 */

export const ADMIN_PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export const ADMIN_CATEGORY_VALUES = CATEGORIES.filter(
  (c): c is Exclude<Category, "All"> => c !== "All",
);

export type AdminProductStatus = (typeof ADMIN_PRODUCT_STATUSES)[number];
export type AdminCategory = (typeof ADMIN_CATEGORY_VALUES)[number];

/** One customizable part: the admin's read of `PartConfig`. */
export type AdminPart = {
  id: string;
  label: string;
  /** Default colour — also the single swatch the storefront would seed. */
  color: string;
  meshNames: string[];
  finishable: boolean;
  /** Allowed gloss range [matte, glossy], 0–100, matching `PartConfig.glossRange`. */
  gloss: [number, number];
};

export type AdminDecalZone = {
  id: string;
  label: string;
  /** The part id this zone paints (same rule as `DecalZone.partId`). */
  partId: string;
};

/** A stored upload: `data:` URL plus its provenance for display. */
export type AdminAttachment = {
  name: string;
  sizeBytes: number;
  dataUrl: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AdminCategory;
  priceCents: number;
  status: AdminProductStatus;
  /** ISO timestamp of the last save, for the "Updated" column. */
  updatedAt: string;
  parts: AdminPart[];
  decalZones: AdminDecalZone[];
  engraveEnabled: boolean;
  model?: AdminAttachment;
  cardImage?: AdminAttachment;
  /** Public catalog image to fall back on when nothing was uploaded. */
  fallbackImage?: string;
};

/** Demo caps: see the module docblock. Server caps land with Phase 10/11. */
export const MODEL_MAX_BYTES = 1536 * 1024; // 1.5 MB
export const IMAGE_MAX_BYTES = 400 * 1024; // 400 KB

export const MODEL_ACCEPT = ".glb,.gltf,model/gltf-binary,model/gltf+json";
export const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

export function isModelFile(file: File): boolean {
  return (
    file.type === "model/gltf-binary" ||
    file.type === "model/gltf+json" ||
    /\.(glb|gltf)$/i.test(file.name)
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / (102.4 * 1024)) / 10} MB`;
}

/* ------------------------------------------------------------------ money */

export const PRICE_MAX_DOLLARS = 10_000;

/**
 * The one rule for the price field: a dollar string becomes integer cents, or
 * a named failure for the inline error. `"12.99"` → `1299`, `"abc"`, negatives
 * and `> 10000` are rejected — never coerced (AGENTS §Money: no floats).
 */
export function dollarsToCents(input: string): { ok: true; cents: number } | { ok: false; error: string } {
  const trimmed = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d*\.?\d{0,2}$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    return { ok: false, error: "Enter a price like 12.99" };
  }
  const cents = Math.round(Number(trimmed) * 100);
  if (cents <= 0) return { ok: false, error: "Price must be greater than zero" };
  if (cents > PRICE_MAX_DOLLARS * 100) {
    return { ok: false, error: "Price must be $10,000 or less" };
  }
  return { ok: true, cents };
}

/** Inverse for the form's initial value: 1299 → "12.99". */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/* ------------------------------------------------------------------ schema */

export const adminProductFormSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(60, "Name must be 60 characters or less"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug needs at least 2 characters")
    .max(80, "Slug must be 80 characters or less")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  category: z.enum(ADMIN_CATEGORY_VALUES),
  description: z.string().max(400, "Description must be 400 characters or less"),
  price: z
    .string()
    .superRefine((value, ctx) => {
      const parsed = dollarsToCents(value);
      if (!parsed.ok) {
        ctx.addIssue({ code: "custom", message: parsed.error, input: value });
      }
    }),
  status: z.enum(ADMIN_PRODUCT_STATUSES),
});

export type AdminProductFormValues = z.infer<typeof adminProductFormSchema>;

/** Field-level parts schema, applied to the parts list entries. */
export const adminPartSchema = z.object({
  id: z
    .string()
    .min(2, "Part id needs at least 2 characters")
    .max(24, "Part id must be 24 characters or less")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  label: z.string().trim().min(2, "Label needs at least 2 characters").max(40, "Label must be 40 characters or less"),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Enter a hex colour like #c6f135"),
  meshNames: z.array(z.string().min(1).max(40)).max(8, "Up to 8 mesh names"),
  finishable: z.boolean(),
  gloss: z.tuple([
    z.number().min(0, "From 0").max(100),
    z.number().min(0).max(100, "To 100"),
  ]),
});

export const adminDecalZoneSchema = z.object({
  id: z
    .string()
    .min(2)
    .max(24)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  label: z.string().trim().min(1, "Zone needs a label").max(40),
  partId: z.string().min(2, "Pick a part").max(24),
});

export const adminCustomizationSchema = z.object({
  parts: z.array(adminPartSchema).min(1, "At least one customizable part"),
  decalZones: z.array(adminDecalZoneSchema).max(6, "Up to 6 decal zones"),
  engraveEnabled: z.boolean(),
});

export type AdminCustomization = z.infer<typeof adminCustomizationSchema>;

/* ------------------------------------------------------------- full record */

export const adminAttachmentSchema = z.object({
  name: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  dataUrl: z.string().min(1),
});

/**
 * The full stored record. The service parses every payload through this
 * before use: a corrupted or hand-edited entry is dropped rather than
 * rendered — the same lenience rule D-094 set for the dashboard seam.
 */
export const adminProductRecordSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  name: z.string().min(2).max(60),
  description: z.string().max(400),
  category: z.enum(ADMIN_CATEGORY_VALUES),
  priceCents: z.number().int().min(0),
  status: z.enum(ADMIN_PRODUCT_STATUSES),
  updatedAt: z.string().min(1),
  parts: z.array(adminPartSchema).min(1),
  decalZones: z.array(adminDecalZoneSchema).max(6),
  engraveEnabled: z.boolean(),
  model: adminAttachmentSchema.optional(),
  cardImage: adminAttachmentSchema.optional(),
  fallbackImage: z.string().optional(),
});

/** Storage payload shape — zustand-style `{ state, version }`, like the other seams. */
export const adminProductsEnvelopeSchema = z.object({
  state: z.object({ records: z.array(adminProductRecordSchema) }).passthrough(),
  version: z.number(),
});
