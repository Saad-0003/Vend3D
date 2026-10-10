import type { Metadata } from "next";

import { CartScreen } from "@/components/cart/cart-screen";

export const metadata: Metadata = { title: "Cart" };

/**
 * `/cart` shows the same lines as the drawer. Storage is the local cart store
 * until Phase 8 moves it to the server.
 */
export default function CartPage() {
  return <CartScreen />;
}
