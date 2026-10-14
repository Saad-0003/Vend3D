import type { Metadata } from "next";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { InfoLink, LegalDraftNotice, LegalUpdatedLine } from "@/components/info/info-blocks";

export const metadata: Metadata = {
  title: "Shipping and returns",
  description: "Dispatch targets, how items ship, what to do about a damaged item, and how returns work.",
};

/**
 * `/shipping-returns` — legal template. The only hard number published on the
 * site is the 48-hour dispatch target; carriers, rates, transit times and
 * return windows are placeholders until the owner supplies them.
 */

const sections: InfoSection[] = [
  {
    id: "what-this-covers",
    title: "What this covers",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            How orders are produced and dispatched, how they ship, what to do when an item arrives
            damaged or defective, and why made-to-order custom items are treated differently from
            stock goods.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the legal name, the effective date and any statutory return
            rights that override what is written here.
          </>
        ),
      },
    ],
  },
  {
    id: "production-and-dispatch",
    title: "Production and dispatch",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Every order is made to your design. Our published target is dispatch within 48 hours of
            the order, which covers picking the blank, applying your artwork and the quality check
            before packing.
          </p>
        ),
      },
      {
        kind: "table",
        columns: ["Stage", "What happens", "Target"],
        numeric: [],
        rows: [
          ["Order placed", "Your configuration and artwork are locked at checkout.", "Instant"],
          ["Production", "The blank is decorated — printed, etched, embroidered or screenprinted.", "Within 48 hours"],
          ["Dispatch", "Quality-checked, packed and handed to the carrier.", "Within 48 hours of order"],
        ],
        caption: "Stage-by-stage durations are on Production Times.",
      },
      {
        kind: "prose",
        body: (
          <p>
            See <InfoLink href="/production-times">Production Times</InfoLink> for the stage
            breakdown and what still needs confirming.
          </p>
        ),
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping",
    blocks: [
      {
        kind: "table",
        columns: ["Question", "Answer today"],
        numeric: [],
        rows: [
          ["Which carriers do you use?", "TODO: owner to confirm"],
          ["Which regions do you ship to?", "TODO: owner to confirm"],
          ["What does shipping cost?", "TODO: owner to confirm — rates and any free-shipping threshold"],
          ["How long is transit?", "TODO: owner to confirm — the 48-hour figure is dispatch, not delivery"],
          ["Do you ship tracked?", "TODO: owner to confirm"],
        ],
        caption: "This table exists so the answers land in one place; it is empty on purpose.",
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — duties, taxes and customs handling for international orders, and
            who is responsible for them.
          </>
        ),
      },
    ],
  },
  {
    id: "damaged-or-defective",
    title: "Damaged or defective items",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              Every item is quality-checked against the render you approved before it is packed, so a
              fault that reaches you is one we want to hear about.
            </p>
            <p>
              Send the order number, a photo of the item and a short description of the problem.
              That is enough to match the item against the render that was approved for it.
            </p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — how long a customer has to report damage, what evidence is
            needed, and whether a replacement or a refund is offered for each case.
          </>
        ),
      },
    ],
  },
  {
    id: "returns",
    title: "Returns",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              <strong className="font-medium text-[var(--ivory)]">
                Made-to-order custom items are typically not returnable.
              </strong>{" "}
              Each item is produced for one order and cannot be resold, so a change of mind does not
              create a returnable item.
            </p>
            <p>
              The window below, and any exceptions to it, are policy placeholders rather than settled
              terms.
            </p>
          </>
        ),
      },
      {
        kind: "table",
        columns: ["Case", "Current position"],
        numeric: [],
        rows: [
          ["Change of mind", "Not returnable — the item was made to your design."],
          ["Damaged in transit", "TODO: owner to confirm — reporting window and remedy"],
          ["Defective or misprinted", "TODO: owner to confirm — reporting window and remedy"],
          ["Wrong item delivered", "TODO: owner to confirm — remedy"],
          ["Refund method and timing", "TODO: owner to confirm"],
        ],
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the return window, who pays return postage, and any statutory
            right to cancel that applies where you live.
          </>
        ),
      },
    ],
  },
  {
    id: "contact",
    title: "Contact support",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Every case above starts with the <InfoLink href="/contact">direct line</InfoLink>. A
            person handles it, not a form.
          </p>
        ),
      },
    ],
  },
];

export default function ShippingReturnsPage() {
  return (
    <InfoPage
      eyebrow="Shipping and returns"
      title="How orders ship, and how returns work."
      intro="Dispatch targets, shipping, damaged or defective items, and why custom items are treated differently."
      notice={
        <>
          <LegalDraftNotice />
          <LegalUpdatedLine />
        </>
      }
      sections={sections}
      closingNote={
        <>
          Read the <InfoLink href="/terms">Terms of Service</InfoLink> and{" "}
          <InfoLink href="/privacy">Privacy Policy</InfoLink>, or reach us on the{" "}
          <InfoLink href="/contact">direct line</InfoLink>.
        </>
      }
    />
  );
}
