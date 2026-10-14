import type { Metadata } from "next";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { InfoLink } from "@/components/info/info-blocks";

export const metadata: Metadata = {
  title: "Production times",
  description: "48 hours from order to dispatch — what happens in that window and what is still to be confirmed.",
};

/**
 * `/production-times`. The one published number is 48 hours from order to
 * dispatch; everything else on the timeline is marked TODO rather than invented.
 */

const sections: InfoSection[] = [
  {
    id: "the-promise",
    title: "The promise",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              Every order is dispatched within 48 hours of being placed. Dispatch is the moment the
              parcel leaves the floor — transit after that is a separate clock, covered in{" "}
              <InfoLink href="/shipping-returns">Shipping &amp; Returns</InfoLink>.
            </p>
            <p>
              The window covers picking the blank, applying your artwork, and the quality check
              before it is packed. It applies to single-piece orders and to larger runs alike.
            </p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — the working-day and cut-off rules behind &ldquo;48 hours&rdquo;
            (weekends, public holidays, and what happens to an order placed at 23:55) are not
            published.
          </>
        ),
      },
    ],
  },
  {
    id: "the-timeline",
    title: "What happens in those 48 hours",
    blocks: [
      {
        kind: "table",
        columns: ["Stage", "What happens", "Duration"],
        numeric: [],
        rows: [
          ["Order placed", "Your configuration and artwork are locked at checkout.", "Instant"],
          ["Proof", "The render you approved is sent to production.", "TODO"],
          ["Production", "The blank is decorated — printed, etched, embroidered or screenprinted.", "TODO"],
          ["Quality check", "The item is inspected against the approved render.", "TODO"],
          ["Dispatch", "Packed and handed to the carrier.", "Within 48 hours of order"],
        ],
        caption:
          "Per-stage durations are not published yet, so they are marked TODO rather than guessed.",
      },
    ],
  },
  {
    id: "rush-and-reruns",
    title: "Rush orders and reprints",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Because production starts on the order itself, a reprint goes through the same 48-hour
            window — there is nothing to restart, the artwork is already in the system.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — whether rush production, expedited dispatch or volume pricing
            exist at all. None of them are advertised on the site today.
          </>
        ),
      },
    ],
  },
  {
    id: "transit",
    title: "After dispatch",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Transit times, carriers and delivery windows are published with the shipping policy.
            Returns and defects are handled there too.
          </p>
        ),
      },
      {
        kind: "custom",
        node: (
          <p className="text-[15px] leading-[1.7] text-[var(--muted)]">
            Read the full{" "}
            <InfoLink href="/shipping-returns">Shipping &amp; Returns</InfoLink> policy for transit
            times, returns windows and how to report a defect.
          </p>
        ),
      },
    ],
  },
];

export default function ProductionTimesPage() {
  return (
    <InfoPage
      eyebrow="Production times"
      title="48 hours from order to dispatch."
      intro="What happens in that window, what is still to be confirmed, and where to look once your parcel leaves the floor."
      sections={sections}
      closing={{
        title: "Ready when you are.",
        body: "Shape your design now and it is on its way within 48 hours of checkout.",
        label: "Start designing",
        href: "/studio",
      }}
    />
  );
}
