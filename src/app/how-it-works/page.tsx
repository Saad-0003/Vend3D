import type { Metadata } from "next";
import { CheckCircle2, MousePointerClick, SlidersHorizontal } from "lucide-react";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { InfoLink } from "@/components/info/info-blocks";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Design in the browser, we manufacture it, and it is dispatched in 48 hours — with zero minimums.",
};

/**
 * `/how-it-works` — one of the six informational pages sharing the `InfoPage`
 * template. Copy is drawn from facts already published on the site (the home
 * page process band, the benefits band, the studio controls and the catalog);
 * anything not published is a `TODO: confirm with owner` note rather than a
 * guess.
 */

const sections: InfoSection[] = [
  {
    id: "the-short-version",
    title: "The short version",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              Vend3D turns a design made in your browser into a physical object. You shape it in the
              real-time 3D studio, we manufacture it on demand, and it leaves the floor within 48
              hours of your order.
            </p>
            <p>
              There is no minimum. A single-piece drop costs the same per unit as a run of a
              hundred, which is what makes limited preorders and hyper-exclusive drops possible
              without dead stock.
            </p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            This is a demo storefront: checkout works end to end but no real charge is made and no
            order is manufactured.
          </>
        ),
      },
    ],
  },
  {
    id: "step-by-step",
    title: "Step by step",
    blocks: [
      {
        kind: "list",
        items: [
          {
            icon: <MousePointerClick className="size-5" strokeWidth={1.5} aria-hidden />,
            title: "Pick",
            body: "Select from ethically milled heavy blanks, custom dyed caps, and precision ceramics.",
          },
          {
            icon: <SlidersHorizontal className="size-5" strokeWidth={1.5} aria-hidden />,
            title: "Shape",
            body: "Adjust materials, calibrate pigments, and apply custom vector artwork in live photoreal 3D.",
          },
          {
            icon: <CheckCircle2 className="size-5" strokeWidth={1.5} aria-hidden />,
            title: "Own",
            body: "Precision laser-etched or screenprinted, quality-checked, and dispatched in 48 hours.",
          },
        ],
      },
      {
        kind: "prose",
        body: (
          <p>
            Every step happens in the browser. Proofing is photorealistic and physics-based, so the
            render you approve is the render the press uses — the physical blank matches the
            viewport.
          </p>
        ),
      },
    ],
  },
  {
    id: "how-artwork-is-applied",
    title: "How your artwork is applied",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Four decoration methods cover the catalog. The studio only offers the methods a product
            can actually take, so a cap is embroidered rather than dyed and a steel bottle is etched
            rather than printed.
          </p>
        ),
      },
      {
        kind: "table",
        columns: ["Method", "How it is applied", "Where it is used"],
        numeric: [],
        rows: [
          [
            "Laser engraving",
            "Vector artwork is cut into the surface, up to 24 characters on stoneware and 16 on steel.",
            "Luna Glazed Mug, Insulated Steel Bottle",
          ],
          [
            "Screenprint",
            "Pigment is pressed through a mesh stencil for flat, opaque colour.",
            "Heavyweight Boxy Tee",
          ],
          [
            "Dye-sub & vector UV",
            "Industrial dye-sublimation and vector UV printing, calibrated up to 4000 DPI.",
            "Heavyweight Boxy Tee, Luna Glazed Mug",
          ],
          [
            "Embroidery",
            "Thread is stitched into the front panel of a structured crown.",
            "Structured 6-Panel Cap",
          ],
        ],
        caption:
          "Method availability is per product — the studio shows the method each blank supports.",
      },
    ],
  },
  {
    id: "proofing",
    title: "Proofing before you commit",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            The studio renders on the actual blank geometry, so you can walk around the product,
            zoom into the decoration zone, and check the finish slider against your artwork before
            anything is cut. Calibrated pigments mean the colour you approve is the colour produced.
          </p>
        ),
      },
      {
        kind: "figure",
        src: "/images/studio-scene.png",
        alt: "A product on a dark studio stage under directional light.",
        caption:
          "The studio stage: real-time WebGL with photoreal, physics-based materials and lighting.",
      },
    ],
  },
  {
    id: "fulfilment",
    title: "Where it is made",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Orders are picked, decorated and quality-checked in automated fulfilment centres, then
            dispatched within 48 hours. Those centres run on 100% renewable energy, which is what we
            mean by carbon-neutral dispatch.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — the site describes the centres as &ldquo;eco-certified&rdquo;
            without naming the certification. Add the certifying body and scope before publishing
            that claim.
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — the countries orders ship from and the carriers used are not
            published anywhere on the site yet.
          </>
        ),
      },
    ],
  },
  {
    id: "faq",
    title: "Common questions",
    blocks: [
      {
        kind: "faq",
        items: [
          {
            q: "What is the minimum order?",
            a: (
              <p>
                There is no minimum. True DTC single-piece drops carry the per-unit economics of
                high-volume runs.
              </p>
            ),
          },
          {
            q: "How fast is dispatch?",
            a: (
              <p>
                48 hours from order to dispatch. Dispatch is when the parcel leaves the floor — see{" "}
                <InfoLink href="/production-times">Production Times</InfoLink> for the full
                timeline and{" "}
                <InfoLink href="/shipping-returns">Shipping &amp; Returns</InfoLink> for transit.
              </p>
            ),
          },
          {
            q: "How much detail can you print?",
            a: (
              <p>
                Industrial dye-sublimation and vector UV printing are calibrated up to 4000 DPI.
                Engraving is limited by character count per zone, which the studio enforces as you
                type.
              </p>
            ),
          },
          {
            q: "Who owns the artwork I upload?",
            a: (
              <p>
                You keep yours, and we keep ours. The specifics — including what happens to
                production files after an order — are covered in the{" "}
                <InfoLink href="/terms">Terms of Service</InfoLink>, and how we handle personal data
                is in the <InfoLink href="/privacy">Privacy Policy</InfoLink>.
              </p>
            ),
          },
          {
            q: "Can I order a sample first?",
            a: (
              <p>
                Because there is no minimum, a single sample is just a single order. Add one to the
                cart and check out.
              </p>
            ),
          },
        ],
      },
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <InfoPage
      eyebrow="How it works"
      title="From a browser tab to a parcel in 48 hours."
      intro="Design it in real-time 3D, we manufacture it on demand, and it ships with no minimum order."
      sections={sections}
      closing={{
        title: "See it. Shape it. Own it.",
        body: "Open the studio and shape your first blank in the browser — no account needed to design.",
        label: "Start designing",
        href: "/studio",
      }}
    />
  );
}
