import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/products/product-form";

export const metadata: Metadata = {
  title: "Edit product",
};

/**
 * `/admin/products/[id]` — the edit half of the one product form (U5). An
 * unknown id renders the form's own "not found" panel rather than a 404:
 * the demo storage is per-browser, so a missing id can be a moved draft.
 */
export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductForm mode="edit" productId={id} />;
}
