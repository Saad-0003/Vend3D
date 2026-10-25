import type { ProductConfig } from "@/lib/products/config";
import {
  defaultConfiguration,
  type Configuration,
  type DecalSettings,
} from "@/lib/products/configuration";

/**
 * Configuration comparison for the studio's unsaved-changes guard and the
 * reset confirmation. Explicit rather than `JSON.stringify` so a key-order
 * difference (zod parse vs. a spread over an existing decal) can never make two
 * identical designs look dirty.
 */
export function sameConfiguration(a: Configuration, b: Configuration): boolean {
  if (a.version !== b.version || a.slug !== b.slug) return false;

  const partIds = Object.keys(a.parts);
  if (partIds.length !== Object.keys(b.parts).length) return false;
  for (const id of partIds) {
    const left = a.parts[id];
    const right = b.parts[id];
    if (!left || !right) return false;
    if (left.color.toLowerCase() !== right.color.toLowerCase()) return false;
    if (left.finish !== right.finish) return false;
  }

  const extraIds = Object.keys(a.extras);
  if (extraIds.length !== Object.keys(b.extras).length) return false;
  for (const id of extraIds) {
    if (a.extras[id] !== b.extras[id]) return false;
  }

  return sameEngrave(a.engrave, b.engrave) && sameDecal(a.decal, b.decal);
}

/** True when the configuration is untouched from the product's defaults. */
export function isConfigurationDefault(product: ProductConfig, configuration: Configuration): boolean {
  return sameConfiguration(configuration, defaultConfiguration(product));
}

/** True when there is something to lose: differs from the saved/default baseline. */
export function isConfigurationDirty(
  configuration: Configuration,
  baseline: Configuration | null,
): boolean {
  if (!baseline) return false;
  return !sameConfiguration(configuration, baseline);
}

function sameEngrave(left: Configuration["engrave"], right: Configuration["engrave"]): boolean {
  return (
    left.enabled === right.enabled &&
    left.text === right.text &&
    left.font === right.font &&
    left.color.toLowerCase() === right.color.toLowerCase() &&
    left.depthMm === right.depthMm &&
    left.sizePct === right.sizePct
  );
}

function sameDecal(left: DecalSettings | null, right: DecalSettings | null): boolean {
  if (!left || !right) return left === right;
  return (
    left.name === right.name &&
    left.zone === right.zone &&
    left.scale === right.scale &&
    left.rotation === right.rotation &&
    left.offsetX === right.offsetX &&
    left.offsetY === right.offsetY &&
    left.avoidSeams === right.avoidSeams
  );
}
