import type { Metadata } from "next";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { FinishSphere } from "@/components/info/finish-sphere";
import { getProductConfig } from "@/lib/products/config";

export const metadata: Metadata = {
  title: "Materials library",
  description:
    "Heavyweight combed cotton, glazed stoneware, insulated brushed steel and structured cotton twill — the blanks we print on.",
};

/**
 * `/materials` — the blanks library. Every fact below (weight, construction,
 * finish range, care) is read from `productConfigs`, so this page cannot drift
 * from what the studio offers.
 */

const tee = getProductConfig("heavyweight-boxy-tee")!;
const mug = getProductConfig("luna-glazed-mug")!;
const cap = getProductConfig("structured-6-panel-cap")!;
const bottle = getProductConfig("insulated-steel-bottle")!;

/** `parts` is fixed per config, so these lookups only fail if a slug is renamed. */
const teeBody = tee.parts[0]!;
const mugBody = mug.parts[0]!;
const mugHandle = mug.parts[1]!;
const capCrown = cap.parts[0]!;
const capBrim = cap.parts[1]!;
const bottleBody = bottle.parts[0]!;
const bottleLid = bottle.parts[1]!;

const cards = [
  {
    slug: "heavyweight-boxy-tee",
    title: "Heavyweight cotton",
    body: "Combed cotton at 260 gsm in a boxy cut. Heavy enough to hold a print flat, light enough to wear all day.",
    meta: "Apparel · print or screenprint",
    gloss: teeBody.finishable,
  },
  {
    slug: "luna-glazed-mug",
    title: "Glazed stoneware",
    body: "Stoneware fired with a glazed finish. Dishwasher and microwave safe, with a handle on the right.",
    meta: "Drinkware · wrap print or engraving",
    gloss: mugBody.finishable,
  },
  {
    slug: "insulated-steel-bottle",
    title: "Insulated steel",
    body: "Double-wall brushed steel with vacuum insulation. Roughly 750 ml and 26 cm tall.",
    meta: "Drinkware · etched artwork",
    gloss: bottleBody.finishable,
  },
  {
    slug: "structured-6-panel-cap",
    title: "Structured cap textile",
    body: "Cotton twill six-panel crown with a pre-curved brim and an adjustable strap at the back.",
    meta: "Headwear · embroidered front panel",
    gloss: capCrown.finishable,
  },
];

const sections: InfoSection[] = [
  {
    id: "the-blanks",
    title: "The blanks",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Four blanks cover the catalog, chosen because they take decoration well: a heavyweight
            combed cotton, a glazed stoneware, a double-wall brushed steel, and a structured cotton
            twill cap. Hover a sphere to preview how each finish behaves under light.
          </p>
        ),
      },
      {
        kind: "grid",
        items: cards.map((card) => ({
          title: card.title,
          body: card.body,
          meta: card.meta,
          media: <FinishSphere material={card.title} gloss={card.gloss} />,
        })),
      },
    ],
  },
  {
    id: "finishes",
    title: "Finishes",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Every finishable part carries a gloss slider in the studio, from fully matte (0) to
            fully gloss (100). Parts that are not finishable are locked, because the material cannot
            take a finish — a cap brim stays matte, and a mug handle stays as fired.
          </p>
        ),
      },
      {
        kind: "table",
        columns: ["Product", "Part", "Gloss range", "Finishable"],
        numeric: [2],
        rows: [
          [tee.name, teeBody.label, "0 – 40", "Yes"],
          [mug.name, `${mugBody.label} (body)`, "60 – 100", "Yes"],
          [mug.name, mugHandle.label, "Locked", "No"],
          [cap.name, capCrown.label, "0 – 60", "Yes"],
          [cap.name, capBrim.label, "Locked", "No"],
          [bottle.name, bottleBody.label, "30 – 100", "Yes"],
          [bottle.name, bottleLid.label, "Locked", "No"],
        ],
        caption: "0 is fully matte, 100 is fully gloss — the same scale the studio slider uses.",
      },
    ],
  },
  {
    id: "care",
    title: "Care",
    blocks: [
      {
        kind: "table",
        columns: ["Product", "Care"],
        numeric: [],
        rows: [
          [tee.name, tee.details.care],
          [mug.name, mug.details.care],
          [cap.name, cap.details.care],
          [bottle.name, bottle.details.care],
        ],
      },
    ],
  },
  {
    id: "sourcing",
    title: "Sourcing",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Blanks are described as ethically milled heavy cottons, custom dyed caps and precision
            ceramics. Manufacture happens in automated fulfilment centres powered 100% by renewable
            energy.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — factory locations, cotton origin and any material
            certifications (organic, OEKO-TEX and similar) are not published on the site. Add them
            here before a customer asks.
          </>
        ),
      },
    ],
  },
];

export default function MaterialsPage() {
  return (
    <InfoPage
      eyebrow="Materials library"
      title="Four blanks, chosen because they take decoration well."
      intro="Heavyweight combed cotton, glazed stoneware, insulated brushed steel and structured cotton twill — with the finish and care each one supports."
      sections={sections}
      closing={{
        title: "Shape one yourself.",
        body: "Open the studio and switch finishes on a real blank to see how it behaves under light.",
        label: "Start designing",
        href: "/studio",
      }}
    />
  );
}
