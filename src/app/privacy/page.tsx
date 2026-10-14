import type { Metadata } from "next";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { InfoLink, LegalDraftNotice, LegalUpdatedLine } from "@/components/info/info-blocks";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data this storefront handles, where it lives, and how to have it removed.",
};

/**
 * `/privacy` — legal template. Nothing here is a legal claim: every duration,
 * basis and jurisdiction is a marked placeholder for the owner, and the page
 * carries a "have a lawyer review" notice at the top.
 */

const COMPANY = "[Company legal name]";

/** Local-storage keys this storefront actually writes, for the plain-words section. */
const STORAGE_KEYS = [
  ["vend3d-cart", "Your cart lines and quantities."],
  ["vend3d-designs", "Saved designs, including their configuration and thumbnail."],
  ["vend3d-orders", "Demo order records, including the shipping address."],
  ["vend3d-auth", "The signed-in mock session, and the demo accounts list."],
];

const sections: InfoSection[] = [
  {
    id: "what-this-covers",
    title: "What this policy covers",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              This policy explains what information {COMPANY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
              handles when you use this storefront, what we do with it, and how to have it removed.
            </p>
            <p>
              It applies to this website only. Where a service we use has its own policy, that policy
              governs that service and not this one.
            </p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the legal name, registered address and the jurisdiction whose
            law applies. None of those are set on the site today.
          </>
        ),
      },
    ],
  },
  {
    id: "what-we-handle",
    title: "What we handle",
    blocks: [
      {
        kind: "table",
        columns: ["Category", "What it includes", "Where it lives today"],
        numeric: [],
        rows: [
          [
            "Account details",
            "The email address and display name you sign up with.",
            "This browser only, until accounts get a backend.",
          ],
          [
            "Saved designs",
            "The configurations you save in the studio, with their thumbnails.",
            "This browser only.",
          ],
          [
            "Uploaded artwork",
            "Decal images you upload to place on a product.",
            "This browser only — never sent to a server in this build.",
          ],
          [
            "Order details",
            "What you ordered, the quantities and the totals.",
            "This browser only.",
          ],
          [
            "Shipping details",
            "Name, address, city, postal code and phone.",
            "This browser only.",
          ],
          [
            "Payment",
            "Demo only. Card brand and last four digits — never a card number.",
            "This browser only, and no charge is made.",
          ],
        ],
      },
      {
        kind: "prose",
        body: (
          <p>
            Nothing on this list leaves your device in the current build. The storefront has no
            accounts database, no analytics account and no payment processor of its own to send it
            to.
          </p>
        ),
      },
    ],
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    blocks: [
      {
        kind: "list",
        items: [
          {
            icon: <span aria-hidden className="lux-mono text-[13px]">01</span>,
            title: "To make and ship your order",
            body: "Your design and shipping address are what production needs to build the item.",
          },
          {
            icon: <span aria-hidden className="lux-mono text-[13px]">02</span>,
            title: "To show your own designs back to you",
            body: "Saved designs and the cart are read from your device so they are still there next time.",
          },
          {
            icon: <span aria-hidden className="lux-mono text-[13px]">03</span>,
            title: "To reply to you",
            body: "If you contact us, we use what you sent to answer.",
          },
        ],
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — whether any analytics, error reporting or advertising tools
            will be added, and on what legal basis. Nothing of the kind runs today.
          </>
        ),
      },
    ],
  },
  {
    id: "cookies-and-storage",
    title: "Cookies and local storage, in plain words",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            This site does not use advertising or tracking cookies. It stores your cart, designs,
            orders and demo session in your browser&apos;s local storage, which is a small private
            space that only this site can read. Clearing your browser data clears them.
          </p>
        ),
      },
      {
        kind: "table",
        columns: ["Key", "What it holds"],
        numeric: [],
        rows: STORAGE_KEYS.map(([key, description]) => [key, description]),
        caption: "Visible in your browser's developer tools under local storage for this site.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    blocks: [
      {
        kind: "list",
        items: [
          {
            icon: <span aria-hidden className="lux-mono text-[13px]">A</span>,
            title: "Access",
            body: "Ask what we hold about you and we will tell you, including where it is stored.",
          },
          {
            icon: <span aria-hidden className="lux-mono text-[13px]">B</span>,
            title: "Correction",
            body: "Ask us to correct anything that is wrong.",
          },
          {
            icon: <span aria-hidden className="lux-mono text-[13px]">C</span>,
            title: "Deletion",
            body: "Ask us to delete it. Today that means clearing this browser's stored data; contact us and we will confirm what was removed.",
          },
        ],
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the exact rights that apply depend on where you and the
            company are. Add the applicable regimes (for example GDPR or CCPA) and any statutory
            response window before launch.
          </>
        ),
      },
    ],
  },
  {
    id: "retention-and-contact",
    title: "Retention and contact",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Stored data stays in your browser until you clear it, or ask us to. Order records are
            capped locally so the oldest ones rotate out.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the retention period once orders and accounts move to a server.
          </>
        ),
      },
      {
        kind: "prose",
        body: (
          <p>
            To exercise any of the above, or to ask a question about this policy, use the{" "}
            <InfoLink href="/contact">direct line</InfoLink>.
          </p>
        ),
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy policy"
      title="What we handle, and where it stays."
      intro="A plain description of the data this storefront touches, what it is used for, and how to have it removed."
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
          <InfoLink href="/shipping-returns">Shipping &amp; Returns</InfoLink>, or reach us on the{" "}
          <InfoLink href="/contact">direct line</InfoLink>.
        </>
      }
    />
  );
}
