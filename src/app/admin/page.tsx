import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <PagePlaceholder
      eyebrow="Admin"
      title="Back office"
      description="Products, models, orders and telemetry. Every admin route re-checks the role server-side — Phase 10."
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-muted-foreground">
          requireAdmin() on every action
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          revalidateTag(&quot;products&quot;)
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          soft delete only
        </Badge>
      </div>
    </PagePlaceholder>
  );
}
