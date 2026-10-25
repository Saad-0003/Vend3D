import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Order" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The planned `/checkout/success?order=ID` URL, forwarded to the route the
 * checkout actually writes: `/order/[id]` (D-048). A missing or malformed id
 * falls back to the order history rather than inventing an order URL.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = params.order;
  const order = (Array.isArray(raw) ? raw[0] : raw)?.trim();

  // Ids are `ord-` + base36 (D-048). Anything else — including `../admin`, which
  // survives encodeURIComponent — falls back to the history instead of being
  // spliced into a path.
  if (!order || !/^[A-Za-z0-9_-]{1,64}$/.test(order)) redirect("/orders");
  redirect(`/order/${order}`);
}
