import type { Configuration } from "@/lib/products/configuration";
import type { OrderItem, OrderRecord } from "@/lib/checkout/order";

/**
 * The "Download design JSON" export (U6): one order item's `Configuration`
 * plus the minimum identification the printer/production side needs. The
 * configuration is the same serialisable v1 contract the designs store and
 * Phase 3's server action would upload — plain JSON, no DOM or assets inside.
 */
export function buildDesignExport(order: OrderRecord, item: OrderItem): Record<string, unknown> {
  return {
    exportedAt: new Date().toISOString(),
    orderId: order.id,
    itemId: item.id,
    product: item.slug,
    quantity: item.qty,
    configuration: item.configuration satisfies Configuration,
  };
}

/** `{ slug-a2b3.json }` style name: stable, human-readable, collision-free enough. */
export function designExportFilename(item: OrderItem): string {
  const safe = item.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${safe || "design"}-${item.id.slice(-6).toLowerCase()}.json`;
}

/** Triggers a browser download for the item's configuration. */
export function downloadDesignJson(order: OrderRecord, item: OrderItem): void {
  const blob = new Blob([JSON.stringify(buildDesignExport(order, item), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = designExportFilename(item);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
