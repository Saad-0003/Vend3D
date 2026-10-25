import type { ProductConfig } from "@/lib/products/config";

/** Studio option sections, in the order the customization panel shows them. */
export type SectionId = "colour" | "finish" | "engrave" | "decal" | "options" | "details";

/** Sections shown for a product. Sections the product does not support are omitted. */
export function sectionsFor(product: ProductConfig): SectionId[] {
  const sections: SectionId[] = [];
  if (product.parts.some((p) => p.allowCustomColor)) sections.push("colour");
  if (product.parts.some((p) => p.finishable)) sections.push("finish");
  if (product.engrave.enabled) sections.push("engrave");
  if (product.decal.enabled) sections.push("decal");
  if (product.extras.length > 0) sections.push("options");
  sections.push("details");
  return sections;
}

export function sectionAnchor(id: SectionId): string {
  return `section-${id}`;
}
