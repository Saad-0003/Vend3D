import { toast } from "sonner";

import type { OrderRecord } from "@/lib/checkout/order";
import { useCartStore } from "@/stores/cart-store";

/**
 * Puts every line of a past order back in the cart through the existing
 * `addLine` seam, then opens the drawer.
 *
 * Shared by the account Orders panel and `/orders` so the two entry points can
 * never disagree about quantity, price snapshot or configuration — all three
 * come from the order record exactly as before.
 */
export function reorderOrder(order: OrderRecord): void {
  const { addLine, setDrawerOpen } = useCartStore.getState();

  for (const item of order.items) {
    addLine({
      slug: item.slug,
      name: item.name,
      configuration: item.configuration,
      thumbnail: item.thumbnail ?? "",
      qty: item.qty,
      unitCents: item.unitCents,
    });
  }

  setDrawerOpen(true);
  toast("Back in your cart", {
    description: `${order.itemCount} item${order.itemCount === 1 ? "" : "s"} from ${order.id}.`,
  });
}
