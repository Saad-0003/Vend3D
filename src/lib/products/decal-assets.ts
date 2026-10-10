/**
 * Uploaded decal artwork, keyed by product slug. Object URLs cannot be
 * serialised, so they live here while the page is open. The persisted
 * configuration keeps only the decal's settings; after a reload the studio
 * asks the user to re-upload the artwork.
 */
export type DecalAsset = { url: string; name: string; mime: string };

const assets = new Map<string, DecalAsset>();

export function getDecalAsset(slug: string): DecalAsset | undefined {
  return assets.get(slug);
}

export function setDecalAsset(slug: string, asset: DecalAsset): void {
  const previous = assets.get(slug);
  if (previous) URL.revokeObjectURL(previous.url);
  assets.set(slug, asset);
}

export function clearDecalAsset(slug: string): void {
  const previous = assets.get(slug);
  if (previous) URL.revokeObjectURL(previous.url);
  assets.delete(slug);
}
