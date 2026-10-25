import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { OrdersScreen } from "@/components/orders/orders-screen";

export const metadata: Metadata = {
  title: "Orders",
  description: "Your demo order history — open a receipt or reorder its lines.",
};

/**
 * `/orders` — history for the signed-in shopper.
 *
 * `RequireAuth` is the ownership boundary for the browser-local orders store:
 * it bounces a signed-out visitor to `/login?next=/orders` and returns them
 * here. Phase 9's server query replaces the store body and adds the `userId`
 * filter (D-083).
 */
export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersScreen />
    </RequireAuth>
  );
}
