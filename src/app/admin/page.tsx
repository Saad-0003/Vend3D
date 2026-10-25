import type { Metadata } from "next";

import { RequireAdmin } from "@/components/auth/require-admin";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * `/admin` — still the Phase 1 placeholder (the screen itself is Phase 1B U4+),
 * but now behind the client-side `RequireAdmin` guard (plan.md Phase 1B U3): a
 * non-admin bounces to `/forbidden`, a signed-out visitor to `/login?next=`.
 * The placeholder is passed as children of the client guard unchanged.
 */
export default function AdminPage() {
  return (
    <RequireAdmin>
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
    </RequireAdmin>
  );
}
