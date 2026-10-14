import type { Metadata } from "next";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { InfoLink, LegalDraftNotice, LegalUpdatedLine } from "@/components/info/info-blocks";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you design and order through this storefront.",
};

/**
 * `/terms` — legal template. Where real terms would name a jurisdiction, a cap
 * or a window, this page carries a marked placeholder instead: an invented term
 * is worse than a missing one.
 */

const COMPANY = "[Company legal name]";

const sections: InfoSection[] = [
  {
    id: "about-these-terms",
    title: "About these terms",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            These terms are the agreement between you and {COMPANY} (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;) about using this storefront. Effective from{" "}
            <span className="lux-mono text-[var(--ivory)]">[Effective date]</span>.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the legal name, the effective date, and the law and courts that
            govern this agreement. None of those are set on the site today.
          </>
        ),
      },
    ],
  },
  {
    id: "using-the-service",
    title: "Using the service",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              You may use this site to design products, save designs and place orders. This build is
              a demonstration: checkout completes and creates a demo order record, but no payment is
              taken and nothing is manufactured.
            </p>
            <p>You agree not to misuse the site, interfere with it, or attempt to access it in ways it was not designed for.</p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — any minimum age or capacity requirement for contracting, and
            whether consumer-specific terms apply.
          </>
        ),
      },
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              Accounts are how your designs and orders are kept together. You are responsible for
              what happens under your account, and for keeping your password to yourself.
            </p>
            <p>
              In this build the session is a mock stored in your browser: signing out, or clearing
              browser data, ends it. A real account system with server-side sessions replaces it.
            </p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — what happens to a lost password, whether an account can be
            deleted and what that deletes, and how account security incidents are notified.
          </>
        ),
      },
    ],
  },
  {
    id: "artwork",
    title: "Custom designs and artwork",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              You keep the rights to artwork you upload. By uploading it you confirm that you have
              the rights needed to have it printed, and that it does not infringe anyone else&apos;s
              rights.
            </p>
            <p>
              You agree not to upload content that is unlawful, infringing, deceptive, or that
              infringes a trademark. We may decline to produce work that breaches this.
            </p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the notice-and-takedown process for infringing uploads, who
            decides, and whether repeat infringers are refused service.
          </>
        ),
      },
    ],
  },
  {
    id: "orders-and-production",
    title: "Orders and production",
    blocks: [
      {
        kind: "prose",
        body: (
          <>
            <p>
              Orders are made to the design you approved. Production runs from the order, and our
              published target is dispatch within 48 hours — the full timeline is on{" "}
              <InfoLink href="/production-times">Production Times</InfoLink>.
            </p>
            <p>
              Because items are made to your specification, a change of mind is not the same as a
              fault; the practical rules are in{" "}
              <InfoLink href="/shipping-returns">Shipping &amp; Returns</InfoLink>.
            </p>
          </>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — whether the 48-hour target is a binding term or best-effort,
            and what happens when it is missed.
          </>
        ),
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing and payment",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Prices are shown per product and totalled at checkout. In this build no charge is made
            and no card number is stored — only the brand and last four digits are kept, and only so
            the confirmation can show which card was used.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — currency, whether prices include tax, who pays duties, and the
            refund mechanics once a real payment processor is connected.
          </>
        ),
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            The site itself — its layout, code, models, imagery and product designs — belongs to{" "}
            {COMPANY} and is not licensed to you beyond using the service. Your artwork stays yours;
            you give us only the permission needed to produce the item you ordered.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the exact scope of the production licence (duration, whether it
            covers marketing photos of the finished item, and termination).
          </>
        ),
      },
    ],
  },
  {
    id: "liability",
    title: "Liability",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Nothing in this template should be read as a limitation of liability. The wording below
            has to be supplied and reviewed before it means anything.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — the limitation of liability clause, including any monetary cap
            and the categories of loss it excludes. A lawyer should draft this; do not ship a
            placeholder clause.
          </>
        ),
      },
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            We may update these terms as the service grows. The date at the top of this page changes
            when we do, and continuing to use the site after that means the updated terms apply.
          </p>
        ),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: owner to confirm — how much notice we give before a change takes effect, and
            whether material changes need positive acceptance.
          </>
        ),
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Questions about these terms go to the{" "}
            <InfoLink href="/contact">direct line</InfoLink>.
          </p>
        ),
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms of service"
      title="The terms you design and order under."
      intro="What using this storefront means, who owns what, and where the wording still has to come from a lawyer."
      notice={
        <>
          <LegalDraftNotice />
          <LegalUpdatedLine />
        </>
      }
      sections={sections}
      closingNote={
        <>
          Read the <InfoLink href="/privacy">Privacy Policy</InfoLink> and{" "}
          <InfoLink href="/shipping-returns">Shipping &amp; Returns</InfoLink>, or reach us on the{" "}
          <InfoLink href="/contact">direct line</InfoLink>.
        </>
      }
    />
  );
}
