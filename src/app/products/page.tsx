import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Shop" };

/**
 * `/products` was the original catalog route. The shipped archive is `/shop`
 * (URL-state filters, sort and command search — D-037/D-038), so this keeps old
 * links working instead of rendering a second, stale grid. `/products/[id]`
 * remains the studio route.
 */
export default function ProductsPage() {
  redirect("/shop");
}
