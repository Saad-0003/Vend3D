"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import type { CanvasHandle } from "@/components/studio/three/product-canvas";
import { useModelSource } from "@/components/studio/three/use-model-source";
import { StudioFooter } from "@/components/studio/studio-footer";
import { StudioSidebar } from "@/components/studio/studio-sidebar";
import { StudioStage } from "@/components/studio/studio-stage";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/ui/product-card";
import { SectionSkeletons } from "@/components/ui/section-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/catalog";
import { formatCents } from "@/lib/format";
import { getProductConfig, type ProductConfig } from "@/lib/products/config";
import { getDecalAsset } from "@/lib/products/decal-assets";
import { getConfiguratorStore, selectTotalCents } from "@/stores/configurator-store";
import { useCartStore } from "@/stores/cart-store";
import { useDesignsStore } from "@/stores/designs-store";

/** Auto-rotate resumes this long after the last orbit interaction. */
const AUTO_ROTATE_RESUME_MS = 4_000;

/**
 * The studio screen. One component for every product: sections, chips and the
 * footer are derived from `ProductConfig`. Nothing here branches on the slug.
 */
export function StudioScreen({ slug, catalog }: { slug: string; catalog: Product[] }) {
  const product = getProductConfig(slug);

  if (!product) {
    return (
      <EmptyState
        className="mt-24"
        eyebrow="Not found"
        title="That product is not in the studio."
        body="The link may be old or the product was removed. Browse the shop for what is available."
        action={
          <Button asChild variant="secondary" className="rounded-full">
            <Link href="/shop">Browse the shop</Link>
          </Button>
        }
      />
    );
  }

  return <StudioProduct product={product} catalog={catalog} />;
}

function StudioProduct({ product, catalog }: { product: ProductConfig; catalog: Product[] }) {
  const router = useRouter();
  const search = useSearchParams();
  const reduced = !!useReducedMotion();
  const store = useMemo(() => getConfiguratorStore(product), [product]);

  const history = store((s) => s.history);
  const quantity = store((s) => s.quantity);
  const hydrated = store((s) => s.hydrated);
  const init = store((s) => s.init);
  const update = store((s) => s.update);
  const setQuantity = store((s) => s.setQuantity);
  const undo = store((s) => s.undo);
  const redo = store((s) => s.redo);
  const reset = store((s) => s.reset);

  const configuration = history.present;
  const modelState = useModelSource(product.model.glb);
  const source = modelState === "checking" ? null : modelState;
  const [autoRotate, setAutoRotate] = useState(true);
  const [decalUrl, setDecalUrl] = useState<string | null>(null);
  const handle = useRef<CanvasHandle | null>(null);
  const idleTimer = useRef<number | null>(null);

  const totalCents = selectTotalCents(product, quantity);
  const rating = catalog.find((p) => p.id === product.slug)?.rating ?? 5;

  // Rehydrate from localStorage first, then apply `?color=` on top. Both steps
  // run in this order inside one effect, so the stored state is never overwritten
  // by a stale default.
  useEffect(() => {
    store.persist.rehydrate();
    init(product, search.get("color"));
  }, [init, product, search, store]);

  useEffect(() => {
    setDecalUrl(getDecalAsset(product.slug)?.url ?? null);
  }, [product.slug, configuration.decal]);

  useEffect(() => {
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  // Stops auto-rotate on any orbit and resumes it after the idle window.
  function handleInteract() {
    setAutoRotate(false);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setAutoRotate(true), AUTO_ROTATE_RESUME_MS);
  }

  function handleAddToCart() {
    useCartStore.getState().addLine({
      slug: product.slug,
      name: product.name,
      configuration,
      thumbnail: handle.current?.capture() ?? "",
      qty: quantity,
      unitCents: product.priceCents,
    });
    toast("Added to cart", {
      description: `${product.name} × ${quantity}`,
      action: {
        label: "View cart",
        onClick: () => useCartStore.getState().setDrawerOpen(true),
      },
    });
  }

  function handleSaveDesign(name: string) {
    useDesignsStore.getState().saveDesign({
      name,
      slug: product.slug,
      productName: product.name,
      configuration,
      thumbnail: handle.current?.capture() ?? "",
    });
    toast("Design saved", {
      description: name,
      action: { label: "View designs", onClick: () => router.push("/designs") },
    });
  }

  if (!hydrated) return <StudioSkeleton />;

  const suggestions = catalog.filter((p) => p.id !== product.slug).slice(0, 4);

  return (
    <div className="flex flex-col gap-10 py-6 lg:gap-16">
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-4">
        <ol className="lux-mono flex items-center gap-2 text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
          <li>
            <Link href="/shop" className="transition-colors hover:text-[var(--ivory)]">
              Shop
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-[var(--ivory)]">
            {product.name}
          </li>
        </ol>
        <Link
          href="/shop"
          className="lux-mono inline-flex items-center gap-2 text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase transition-colors hover:text-[var(--ivory)]"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
          Back
        </Link>
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <StudioStage
          product={product}
          configuration={configuration}
          source={source}
          decalUrl={decalUrl}
          autoRotate={autoRotate}
          reduced={reduced}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          onUndo={undo}
          onRedo={redo}
          onReset={() => reset(product)}
          onToggleRotate={() => setAutoRotate((v) => !v)}
          onInteract={handleInteract}
          handle={handle}
        />

        <StudioSidebar
          product={product}
          configuration={configuration}
          onChange={(next) => update(product, next)}
          decalUrl={decalUrl}
          onDecalChange={() => setDecalUrl(getDecalAsset(product.slug)?.url ?? null)}
          placeholder={source === "placeholder"}
          reduced={reduced}
          rating={rating}
          price={formatCents(totalCents)}
        />
      </div>

      <StudioFooter
        quantity={quantity}
        totalCents={totalCents}
        onQuantity={setQuantity}
        onAddToCart={handleAddToCart}
        onSaveDesign={handleSaveDesign}
      />

      {suggestions.length > 0 ? (
        <section aria-labelledby="also-like" className="flex flex-col gap-6">
          <h2 id="also-like" className="lux-eyebrow text-[var(--lime)]">
            You may also like
          </h2>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((p, i) => (
              <ProductCard
                key={p.id}
                index={i}
                product={{
                  id: p.id,
                  name: p.name,
                  price: formatCents(p.priceCents),
                  image: p.image,
                  rating: p.rating,
                  colorways: p.colorways,
                }}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function StudioSkeleton() {
  return (
    <div className="flex flex-col gap-10 py-6 lg:gap-16" role="status" aria-label="Loading studio">
      <Skeleton className="h-4 w-64 rounded-full" />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <Skeleton className="aspect-[4/5] w-full rounded-[var(--card-radius)] lg:h-[calc(100svh-150px)] lg:flex-1" />
        <div className="flex w-full flex-col gap-4 lg:w-[440px] lg:shrink-0 xl:w-[460px]">
          <Skeleton className="h-10 w-2/3 rounded-full" />
          <Skeleton className="h-64 w-full rounded-[var(--card-radius)]" />
          <Skeleton className="h-64 w-full rounded-[var(--card-radius)]" />
        </div>
      </div>
      <SectionSkeletons variant="product-grid" count={4} />
    </div>
  );
}
