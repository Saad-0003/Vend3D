import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Product" };

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <PagePlaceholder
      eyebrow="Product"
      title="Product detail"
      description={`Preview, material options and the customize call to action for “${id}”. Real product data arrives with the Phase 4 catalog.`}
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-muted-foreground">
          slug → id lookup (Phase 4)
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          unknown slug → 404 (Phase 4)
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          soft-deleted → 404 (Phase 4)
        </Badge>
      </div>
    </PagePlaceholder>
  );
}
