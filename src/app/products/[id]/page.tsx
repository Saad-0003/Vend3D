import type { Metadata } from "next";
import { Suspense } from "react";

import { StudioScreen } from "@/components/studio/studio-screen";
import { StudioProductPageSkeleton } from "@/components/ui/route-skeletons";
import { products } from "@/lib/catalog";
import { getProductConfig } from "@/lib/products/config";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = getProductConfig(id);
  return { title: product ? product.name : "Product not found" };
}

/**
 * `/products/[id]` opens the studio for that product. Unknown slugs render the
 * studio's not-found state inside the normal layout rather than crashing.
 */
export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-12">
      {/* The fallback has to be the studio's own shape (stage + sidebar): a
          product grid here would jump the layout when the route resolves. */}
      <Suspense fallback={<StudioProductPageSkeleton />}>
        <StudioScreen slug={id} catalog={products} />
      </Suspense>
    </div>
  );
}
