import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <PagePlaceholder
      eyebrow="Account"
      title="Order history"
      description="Past orders with thumbnails, totals and status badges, readable only by their owner. Phase 9 builds this screen."
    >
      <div className="flex w-full max-w-3xl flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-[28px]" />
        ))}
      </div>
    </PagePlaceholder>
  );
}
