import type { ProductConfig } from "@/lib/products/config";

/** Studio option sections. `options` is the product's extras; `details` is the info accordion. */
export type SectionId = "colour" | "finish" | "decal" | "engrave" | "options" | "details";

/** Sections that live inside the scrolling right sidebar. The rest sit below the two columns. */
export const SIDEBAR_SECTIONS: SectionId[] = ["colour", "finish", "engrave"];

export const SECTION_LABEL: Record<SectionId, string> = {
  colour: "Colour",
  finish: "Finish",
  decal: "Decal",
  engrave: "Engrave",
  options: "Options",
  details: "Details",
};

/** Chips shown for a product. Sections the product does not support are omitted. */
export function sectionsFor(product: ProductConfig): SectionId[] {
  const sections: SectionId[] = [];
  if (product.parts.some((p) => p.allowCustomColor)) sections.push("colour");
  if (product.parts.some((p) => p.finishable)) sections.push("finish");
  if (product.decal.enabled) sections.push("decal");
  if (product.engrave.enabled) sections.push("engrave");
  if (product.extras.length > 0) sections.push("options");
  sections.push("details");
  return sections;
}

export function sectionAnchor(id: SectionId): string {
  return `section-${id}`;
}
