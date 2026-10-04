import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <PagePlaceholder
      eyebrow="Checkout"
      title="Demo checkout"
      description="A Visa or Mastercard form that never sends card data to the server. No real gateway is integrated — Phase 9."
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-muted-foreground">
          demo checkout — no real payment is taken
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          card data stays in the browser
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          idempotent checkoutKey
        </Badge>
      </div>
    </PagePlaceholder>
  );
}
