import type { Metadata } from "next";
import Link from "next/link";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <PagePlaceholder
      eyebrow="Cart"
      title="Your cart"
      description="Line items live server-side so the cart survives logout and follows you to a second device. Phase 8 builds this screen."
    >
      <div className="flex w-full max-w-3xl flex-col gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-[28px]" />
        ))}
        <Button asChild className="w-fit rounded-full px-8">
          <Link href="/checkout">Checkout</Link>
        </Button>
      </div>
    </PagePlaceholder>
  );
}
