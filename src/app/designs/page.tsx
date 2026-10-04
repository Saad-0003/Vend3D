import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Designs" };

export default function DesignsPage() {
  return (
    <PagePlaceholder
      eyebrow="Studio"
      title="Saved designs"
      description="Every design you save, reopen in the customizer, rename, duplicate or delete. Phase 7 builds this screen."
    >
      <div className="grid w-full max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square w-full rounded-[28px]" />
        ))}
      </div>
    </PagePlaceholder>
  );
}
