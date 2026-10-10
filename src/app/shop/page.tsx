import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeletons } from "@/components/ui/section-skeletons";
import { ShopScreen } from "@/components/shop/shop-screen";

export const metadata: Metadata = { title: "Shop — All blanks" };

/**
 * `/shop` — the full archive. A Server Component shell that suspends on the
 * search params (the filter state lives in the query string, so the screen is
 * client-only below the `Suspense` boundary); the skeleton is the loading state.
 */
export default function ShopPage() {
  return (
    <Suspense fallback={<SectionSkeletons variant="product-grid" count={8} />}>
      <ShopScreen />
    </Suspense>
  );
}
