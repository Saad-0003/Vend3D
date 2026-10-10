import type { Metadata } from "next";

import { StudioHub } from "@/components/studio/studio-hub";

export const metadata: Metadata = { title: "Studio" };

/**
 * `/studio`: the entry point when no product is chosen yet. Lists the blanks,
 * offers an upload and resumes any unfinished local configuration.
 */
export default function StudioPage() {
  return <StudioHub />;
}
