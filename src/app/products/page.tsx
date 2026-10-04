import type { Metadata } from "next";
import Link from "next/link";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <PagePlaceholder
      eyebrow="Shop"
      title="The catalog"
      description="Every blank Vend3D can print on, filterable by category and searchable by name. The grid below is wired to the database in Phase 4."
    >
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index}>
            <Skeleton className="aspect-square w-full rounded-[28px]" />
          </li>
        ))}
      </ul>
      <Button asChild variant="secondary" className="w-fit rounded-full">
        <Link href="/">Back to the storefront</Link>
      </Button>
    </PagePlaceholder>
  );
}
