import type { Metadata } from "next";
import { AtSign, Camera, Briefcase } from "lucide-react";

import { InfoPage, type InfoSection } from "@/components/info/info-page";
import { ContactForm } from "@/components/info/contact-form";
import { InfoLink } from "@/components/info/info-blocks";

export const metadata: Metadata = {
  title: "Direct line",
  description: "Talk to the studio about a blank, a spec or an order.",
};

/**
 * `/contact`. The form validates locally and shows a success toast only —
 * `plan.md` keeps email sending out of scope for the MVP, so nothing is sent.
 * The channels listed are the ones the footer already exposes; direct email,
 * phone and studio address are TODO because they are not published anywhere.
 */

/** The channels the footer already exposes. Handles are not published, so they are TODO. */
const channels = [
  { icon: AtSign, label: "Twitter", note: "TODO: confirm with owner — handle is not published." },
  { icon: Camera, label: "Instagram", note: "TODO: confirm with owner — handle is not published." },
  { icon: Briefcase, label: "LinkedIn", note: "TODO: confirm with owner — handle is not published." },
];

const sections: InfoSection[] = [
  {
    id: "send-a-message",
    title: "Send a message",
    blocks: [
      {
        kind: "prose",
        body: (
          <p>
            Blanks, spec sheets, decoration methods or an order already placed — the same person
            handles all of it.
          </p>
        ),
      },
      {
        kind: "custom",
        node: <ContactForm />,
      },
      {
        kind: "custom",
        node: (
          <p className="text-[13px] leading-[1.6] text-[var(--muted)]">
            By sending a message you agree to our <InfoLink href="/privacy">Privacy Policy</InfoLink>{" "}
            and <InfoLink href="/terms">Terms of Service</InfoLink>.
          </p>
        ),
      },
    ],
  },
  {
    id: "other-channels",
    title: "Other channels",
    blocks: [
      {
        kind: "list",
        items: channels.map((channel) => ({
          icon: <channel.icon className="size-5" strokeWidth={1.5} aria-hidden />,
          title: channel.label,
          body: channel.note,
        })),
      },
      {
        kind: "note",
        body: (
          <>
            TODO: confirm with owner — there is no published email address, phone number or studio
            address yet. The footer exposes a dispatch bulletin sign-up and three social icons, but
            none of them resolve to a real inbox today.
          </>
        ),
      },
    ],
  },
];

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Direct line"
      title="Talk to the people who print it."
      intro="Questions about a blank, a spec sheet or an order already placed — it all comes to the same desk."
      sections={sections}
      closing={{
        title: "Still deciding?",
        body: "Nothing is committed until checkout, so shape a design first and ask us anything while you do.",
        label: "Start designing",
        href: "/studio",
      }}
    />
  );
}
