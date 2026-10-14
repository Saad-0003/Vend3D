import type { Metadata } from "next";

import { NotFoundScene } from "@/components/system/not-found-scene";

export const metadata: Metadata = {
  title: "Not found",
  description: "That blank does not exist yet.",
};

/**
 * Global 404. Rendered inside the root layout's `<main>`, so it must not nest
 * another `<main>` — this stays a server component and the interactive parts
 * (the floating cube, the search field) live in a client island.
 */
export default function NotFound() {
  return (
    <div className="lux bg-[var(--ink)] text-[var(--ivory)]">
      <NotFoundScene />
    </div>
  );
}
