import type { Metadata } from "next";
import { Suspense } from "react";

import { DesignsScreen } from "@/components/designs/designs-screen";

export const metadata: Metadata = { title: "Designs" };

/**
 * `/designs` reads filter and sort state from the URL, so it needs a Suspense
 * boundary for `useSearchParams`. The skeleton inside the screen is the loading state.
 */
export default function DesignsPage() {
  return (
    <Suspense fallback={null}>
      <DesignsScreen />
    </Suspense>
  );
}
