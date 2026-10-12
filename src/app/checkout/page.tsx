import type { Metadata } from "next";

import { CheckoutScreen } from "@/components/checkout/checkout-screen";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Demo checkout — no real payment is taken and no card data leaves your browser.",
};

/**
 * `/checkout` (plan.md Phase 9). The screen is a client island because the
 * cart, the demo card form and the order record are all client state until the
 * Phase 9 server action lands.
 */
export default function CheckoutPage() {
  return <CheckoutScreen />;
}
