import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { SectionSkeletons } from "@/components/ui/section-skeletons";

export const metadata: Metadata = { title: "Shop" };

/**
 * Full-archive route the home page's "Browse full archive" link points at.
 * Phase 4 replaces the skeleton grid with the paginated, filterable catalog
 * (plan.md Phase 4); until then the route renders the real page shell plus a
 * loading skeleton so the CTA never 404s and the layout matches every later
 * screen.
 */
export default function ShopPage() {
  return (
    <PageShell aria-label="Shop">
      <PageHeader
        eyebrow="Archive"
        title="Every blank we can print on."
        intro="Filter by category, compare blanks side by side and open any of them in the studio with the colourway already applied."
      />

      <Suspense
        fallback={<SectionSkeletons variant="product-grid" count={8} className="mt-12" />}
      >
        <div className="mt-12" aria-busy>
          <SectionSkeletons variant="product-grid" count={8} />
        </div>
      </Suspense>
    </PageShell>
  );
}
