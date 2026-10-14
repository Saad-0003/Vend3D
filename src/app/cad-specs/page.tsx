import type { Metadata } from "next";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { Button } from "@/components/ui/button";
import { getProductConfig, type ProductConfig } from "@/lib/products/config";

export const metadata: Metadata = {
  title: "CAD specs",
  description:
    "Printable areas, decoration methods and dimensions for every blank, taken straight from the studio configuration.",
};

/**
 * `/cad-specs` — spec tables per product. Every number is read from
 * `productConfigs`, the same object the studio renders from, so a spec sheet can
 * never disagree with what the configurator allows.
 */

const products: ProductConfig[] = [
  getProductConfig("heavyweight-boxy-tee")!,
  getProductConfig("luna-glazed-mug")!,
  getProductConfig("structured-6-panel-cap")!,
  getProductConfig("insulated-steel-bottle")!,
];

/** Decoration method label, matching the studio's own vocabulary. */
const METHOD_LABEL: Record<string, string> = {
  print: "Print (dye-sub / vector UV)",
  embroidery: "Embroidery",
  etch: "Etch",
};

function productSection(product: ProductConfig): InfoSection {
  const zones = product.decal.zones.map((zone) => [
    zone.label,
    METHOD_LABEL[zone.method] ?? zone.method,
    `${zone.maxSize[0]} × ${zone.maxSize[1]}`,
  ]);

  return {
    id: product.slug,
    title: product.name,
    blocks: [
      {
        kind: "table",
        columns: ["Specification", "Detail"],
        numeric: [],
        rows: [
          ["Material", product.details.materials],
          ["Dimensions", product.details.dimensions],
          ["Decoration", product.decal.enabled ? "See the zone table below" : "Not decorated in place"],
          ["Engraving", product.engrave.enabled ? `Up to ${product.engrave.maxChars} characters` : "Not available"],
          ["Finish", product.parts.filter((part) => part.finishable).map((part) => part.label).join(", ") || "None"],
          ["Care", product.details.care],
          ["Production", product.details.productionTime],
        ],
      },
      product.decal.enabled
        ? {
            kind: "table",
            columns: ["Decoration zone", "Method", "Max area (model units)"],
            numeric: [2],
            rows: zones,
            caption:
              "Zones are enforced by the studio as you place artwork, in the model's own units.",
          }
        : {
            kind: "note",
            body: <>This blank takes no in-place decoration.</>,
          },
      {
        kind: "custom",
        node: (
          <div className="flex flex-col items-start gap-3">
            <Button
              disabled
              variant="ghost"
              className="h-11 rounded-full px-5 text-[var(--muted)] ring-1 ring-[var(--hairline-strong)]"
            >
              Download spec
            </Button>
            <p className="text-[13px] leading-[1.6] text-[var(--muted)]">
              TODO: confirm with owner — spec sheets are not published as files yet. Wire this button
              to the real PDF or vector pack once it exists.
            </p>
          </div>
        ),
      },
    ],
  };
}

const sections: InfoSection[] = [
  {
    id: "reading-a-spec",
    title: "Reading a spec",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Each table below is generated from the studio configuration, so it always matches what
            the configurator will actually let you do. Printable areas are given in the model&apos;s
            own units because that is what the studio constrains against.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — millimetre equivalents for the printable areas, accepted file
            formats and a bleed/safe-margin spec are not published anywhere yet. Add them before
            sending designers here.
          </>
        ),
      },
    ],
  },
  ...products.map(productSection),
];

export default function CadSpecsPage() {
  return (
    <InfoPage
      eyebrow="CAD specs"
      title="Everything a printer needs to know."
      intro="Printable areas, decoration methods, finishes and care for every blank — read straight from the configuration the studio renders."
      sections={sections}
      closing={{
        title: "Check it against a real blank.",
        body: "Open the studio and place artwork on the actual decoration zones to see the constraints live.",
        label: "Start designing",
        href: "/studio",
      }}
    />
  );
}
