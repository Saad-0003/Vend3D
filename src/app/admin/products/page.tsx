import type { Metadata } from "next";

import { ProductsScreen } from "@/components/admin/products/products-screen";

export const metadata: Metadata = {
  title: "Products",
  description: "The sellable list — catalog products plus this browser's drafts and uploads.",
};

/**
 * `/admin/products` — the products list (plan.md Phase 1B U5). The guard
 * lives in `admin/layout.tsx`; all data flows through the
 * `CatalogAdminService` seam, so Phase 10 swaps the service body only.
 */
export default function AdminProductsPage() {
  return <ProductsScreen />;
}
