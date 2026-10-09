import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { SectionSkeletons } from "@/components/ui/section-skeletons";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Studio" };

/**
 * Phase 1 placeholder. The 3D canvas, the store and the control panel
 * (`components/studio/controls/`) land in Phase 3; until then the route renders
 * the real header, loading and empty states so the hero CTA never 404s.
 */
export default function StudioPage() {
  return (
    <PageShell aria-label="Studio">
      <PageHeader
        eyebrow="Studio"
        title="Build it in real time."
        intro="Rotate the blank, calibrate the pigment, drop in vector artwork and preview the print in photoreal 3D. Saved designs stay in your library."
      />

      <Suspense fallback={<SectionSkeletons variant="product-grid" count={4} className="mt-12" />}>
        <EmptyState
          className="mt-12"
          eyebrow="No blank loaded"
          title="Pick a blank to open the canvas."
          body="The customizer needs a product to render. Start from the hardware collection and it will open here with your colour applied."
          action={
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/shop">Browse blanks</Link>
            </Button>
          }
        />
      </Suspense>
    </PageShell>
  );
}
