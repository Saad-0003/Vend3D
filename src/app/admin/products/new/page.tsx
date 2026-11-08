import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/products/product-form";

export const metadata: Metadata = {
  title: "New product",
};

/**
 * `/admin/products/new` — the create half of the one product form (U5).
 * Server wrapper only: the form is a client component and the browser-only
 * service makes the creation local until Phase 4.
 */
export default function AdminNewProductPage() {
  return <ProductForm mode="create" />;
}
