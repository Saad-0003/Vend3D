import { getProductConfig } from "@/lib/products/config";
import type { CartLine } from "@/stores/cart-store";

export type LineChip = { key: string; label: string };

/**
 * Summary chips for one cart line: colour name, finish, decal and engraving.
 * Built from the product config, never from per-product branches, so a new
 * product gets the same chips for free.
 */
export function lineSummary(line: CartLine): LineChip[] {
  const product = getProductConfig(line.slug);
  const chips: LineChip[] = [];
  if (!product) return chips;

  for (const part of product.parts) {
    const cfg = line.configuration.parts[part.id];
    if (!cfg) continue;
    const swatch = part.swatches.find((s) => s.hex.toLowerCase() === cfg.color.toLowerCase());
    if (swatch) chips.push({ key: `colour-${part.id}`, label: swatch.name });
    if (part.finishable && cfg.finish > 0) {
      chips.push({ key: `finish-${part.id}`, label: `Finish ${Math.round(cfg.finish)}%` });
    }
  }

  if (line.configuration.decal) {
    chips.push({ key: "decal", label: `Decal · ${line.configuration.decal.name}` });
  }

  const { engrave } = line.configuration;
  if (engrave.enabled && engrave.text.trim()) {
    chips.push({ key: "engrave", label: `Engraved “${engrave.text.trim()}”` });
  }

  return chips;
}
