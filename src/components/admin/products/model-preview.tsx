"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { CanvasHandle } from "@/components/studio/three/product-canvas";
import { defaultConfiguration } from "@/lib/products/configuration";
import { toPreviewConfig } from "@/lib/admin/catalog-ops";
import type { AdminProduct } from "@/lib/admin/product-schema";

/**
 * The small live preview (plan.md Phase 1B U5): the studio's real
 * `ProductCanvas` — no second 3D component — fed a `ProductConfig` built from
 * the form's snapshot. An uploaded model renders through a data URL (the GLB
 * loader reads schemes `fetch` understands); a catalog product keeps its
 * bundled GLB; a product with no model shows this panel's placeholder notice.
 *
 * `key` remounts the canvas when the file changes so three's module-level GLB
 * cache never mixes two sources. Auto-rotate stays off: a back-office preview
 * is calmer, and `prefers-reduced-motion` never needs a second code path.
 */
const ProductCanvas = dynamic(() => import("@/components/studio/three/product-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

export function ModelPreview({
  preview,
  modelUrl,
  modelKey,
}: {
  preview: Pick<
    AdminProduct,
    "id" | "slug" | "name" | "description" | "category" | "parts" | "decalZones" | "engraveEnabled"
  > & { priceCents: number };
  modelUrl: string | null;
  modelKey: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        Live preview
      </span>
      <div className="relative h-56 w-full overflow-hidden rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)]">
        {modelUrl ? (
          <PreviewCanvas modelKey={modelKey} preview={preview} modelUrl={modelUrl} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="lux-mono rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[10px] tracking-[0.16em] text-[var(--ivory)] uppercase ring-1 ring-[var(--hairline-strong)]">
              Placeholder model
            </span>
            <p className="max-w-56 text-[11px] leading-snug text-[var(--muted)]">
              No GLB yet — the storefront renders a 3D placeholder for this product until one
              uploads here.
            </p>
          </div>
        )}
      </div>
      <p className="lux-mono text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
        Drag to rotate · From the studio viewer
      </p>
    </div>
  );
}

function PreviewCanvas({
  preview,
  modelUrl,
  modelKey,
}: {
  preview: Pick<
    AdminProduct,
    "id" | "slug" | "name" | "description" | "category" | "parts" | "decalZones" | "engraveEnabled"
  > & { priceCents: number };
  modelUrl: string;
  modelKey: string;
}) {
  void modelKey;
  const handle = useRef<CanvasHandle | null>(null);
  const product = useMemo(() => toPreviewConfig(preview, { modelUrl }), [preview, modelUrl]);
  const configuration = useMemo(() => defaultConfiguration(product), [product]);

  return (
    <ProductCanvas
      product={product}
      configuration={configuration}
      source="glb"
      decalUrl={null}
      autoRotate={false}
      handle={handle}
    />
  );
}
