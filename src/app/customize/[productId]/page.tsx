import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getProductConfig } from "@/lib/products/config";

type Params = Promise<{ productId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { productId } = await params;
  const product = getProductConfig(productId);
  return { title: product ? `Customize ${product.name}` : "Customize" };
}

/**
 * `/customize/[productId]` is the older studio path. It forwards to
 * `/products/[id]` and keeps the query string, so `?color=` still applies.
 */
export default async function CustomizePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { productId } = await params;
  const query = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/products/${encodeURIComponent(productId)}${suffix}`);
}
