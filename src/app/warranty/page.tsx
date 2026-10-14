import type { Metadata } from "next";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { InfoLink } from "@/components/info/info-blocks";

export const metadata: Metadata = {
  title: "Warranty",
  description:
    "What we check before dispatch, how to report a fault, and the terms that govern it.",
};

/**
 * `/warranty`. No warranty length, remedy or legal wording is published on the
 * site, so this page states what is actually true (a quality check happens
 * before dispatch, and there is a contact route) and marks the rest TODO
 * rather than inventing terms.
 */

const sections: InfoSection[] = [
  {
    id: "what-is-covered",
    title: "What is covered",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Every item is quality-checked against the render you approved before it is packed, so a
            fault that gets past us is a fault we want to hear about.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — no warranty length, remedy or exclusion is published anywhere
            on the site. Nothing here should be treated as a warranty term until the owner supplies
            the wording and it is reviewed.
          </>
        ),
      },
    ],
  },
  {
    id: "reporting-a-fault",
    title: "Reporting a fault",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              Send the order number, a photo of the item and a short description of what went wrong.
              That is enough for us to match the item against the render that was approved for it.
            </p>
            <p>
              Claims are handled by a person, not a form: the fastest route is the{" "}
              <InfoLink href="/contact">direct line</InfoLink>.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "returns",
    title: "Returns and remedies",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Change-of-mind returns, faulty items and reprint rules all live in the shipping policy.
            The contractual terms that govern them — including what you and we are each liable for —
            are in the Terms of Service.
          </p>
        ),
      },
      {
        kind: "custom",
        node: (
          <p className="text-[15px] leading-[1.7] text-[var(--muted)]">
            Read <InfoLink href="/shipping-returns">Shipping &amp; Returns</InfoLink> for the
            practical policy, and the{" "}
            <InfoLink href="/terms">Terms of Service</InfoLink> for the terms that apply to it.
          </p>
        ),
      },
    ],
  },
];

export default function WarrantyPage() {
  return (
    <InfoPage
      eyebrow="Warranty"
      title="Checked before it ships. Backed by a person if it isn't."
      intro="What we verify before dispatch, how to report a fault, and where the contractual terms live."
      sections={sections}
      closing={{
        title: "Something not right?",
        body: "Send the order number and a photo and a person will pick it up.",
        label: "Contact us",
        href: "/contact",
      }}
    />
  );
}
