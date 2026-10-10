import { z } from "zod";

import type { PartConfig, ProductConfig } from "@/lib/products/config";

/**
 * The serialisable design. Everything the 3D scene, the cart and the designs
 * store need lives here as plain JSON; uploaded decal bytes are kept out of it
 * (see `decal-assets.ts`) so it can be persisted and validated with zod.
 */
export const CONFIGURATION_VERSION = 1 as const;

const hexSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const configurationSchema = z.object({
  version: z.literal(CONFIGURATION_VERSION),
  slug: z.string().min(1),
  parts: z.record(z.string(), z.object({ color: hexSchema, finish: z.number().min(0).max(100) })),
  extras: z.record(z.string(), z.union([z.string(), z.boolean()])),
  engrave: z.object({
    enabled: z.boolean(),
    text: z.string().max(40),
    font: z.string(),
    depthMm: z.number().min(0.05).max(0.4),
    sizePct: z.number().min(40).max(100),
  }),
  decal: z
    .object({
      name: z.string().max(80),
      zone: z.string(),
      scale: z.number().min(0.3).max(1.5),
      rotation: z.number().min(-180).max(180),
      offsetX: z.number().min(-1).max(1),
      offsetY: z.number().min(-1).max(1),
      avoidSeams: z.boolean(),
    })
    .nullable(),
});

export type Configuration = z.infer<typeof configurationSchema>;
export type DecalSettings = NonNullable<Configuration["decal"]>;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Finish is only meaningful on finishable parts; everything else is pinned to matte. */
export function clampFinish(part: PartConfig, finish: number): number {
  if (!part.finishable) return 0;
  return clamp(finish, part.glossRange[0], part.glossRange[1]);
}

/** URL-safe name used by `?color=` (matches the product card's swatch links). */
export function colorSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Fills every part, extra and zone the product defines, keeps valid values from
 * the input and replaces anything unknown or out of range with a safe default.
 */
export function reconcile(product: ProductConfig, input: Configuration): Configuration {
  const parts: Configuration["parts"] = {};
  for (const part of product.parts) {
    const existing = input.parts[part.id];
    parts[part.id] = {
      color: existing?.color ?? part.swatches[0]?.hex ?? "#c6f135",
      finish: clampFinish(part, existing?.finish ?? part.glossRange[0]),
    };
  }

  const extras = Object.fromEntries(
    product.extras.map((extra) => {
      const existing = input.extras[extra.id];
      if (extra.type === "toggle") {
        return [extra.id, typeof existing === "boolean" ? existing : false];
      }
      const valid = typeof existing === "string" && extra.options.some((o) => o.value === existing);
      return [extra.id, valid ? existing : (extra.options[0]?.value ?? "")];
    }),
  );

  const fontIds = product.engrave.fonts.map((f) => f.id);
  const engrave = {
    enabled: product.engrave.enabled && input.engrave.enabled,
    text: input.engrave.text.slice(0, product.engrave.maxChars || 0),
    font: fontIds.includes(input.engrave.font) ? input.engrave.font : (fontIds[0] ?? ""),
    depthMm: input.engrave.depthMm,
    sizePct: input.engrave.sizePct,
  };

  const zoneIds = product.decal.zones.map((z) => z.id);
  const decal =
    product.decal.enabled && input.decal && zoneIds.includes(input.decal.zone)
      ? input.decal
      : product.decal.enabled && input.decal
        ? { ...input.decal, zone: zoneIds[0] ?? "" }
        : null;

  return { version: CONFIGURATION_VERSION, slug: product.slug, parts, extras, engrave, decal };
}

export function defaultConfiguration(product: ProductConfig): Configuration {
  return reconcile(product, {
    version: CONFIGURATION_VERSION,
    slug: product.slug,
    parts: {},
    extras: {},
    engrave: { enabled: false, text: "", font: "", depthMm: 0.12, sizePct: 70 },
    decal: null,
  });
}

/** Defensive read of persisted or URL-supplied JSON. Anything invalid becomes defaults. */
export function parseConfiguration(product: ProductConfig, raw: unknown): Configuration {
  const parsed = configurationSchema.safeParse(raw);
  if (!parsed.success || parsed.data.slug !== product.slug) return defaultConfiguration(product);
  return reconcile(product, parsed.data);
}

/** Applies `?color=<swatch-slug>` to the first customisable part that offers that swatch. */
export function applyColorParam(
  product: ProductConfig,
  configuration: Configuration,
  color: string | null | undefined,
): Configuration {
  if (!color) return configuration;
  for (const part of product.parts) {
    if (!part.allowCustomColor) continue;
    const swatch = part.swatches.find((s) => colorSlug(s.name) === color);
    if (!swatch) continue;
    const current = configuration.parts[part.id];
    return {
      ...configuration,
      parts: {
        ...configuration.parts,
        [part.id]: { color: swatch.hex, finish: current?.finish ?? part.glossRange[0] },
      },
    };
  }
  return configuration;
}

/** Base price only. plan.md defines no add-on fees, so none are invented here. */
export function totalCents(unitCents: number, qty: number): number {
  return unitCents * qty;
}

export function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Hue in degrees (0–360) for a hex colour, used to position the hue slider. */
export function hexToHue(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

export function findPart(product: ProductConfig, partId: string): PartConfig | undefined {
  return product.parts.find((p) => p.id === partId);
}
