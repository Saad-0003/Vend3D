import Link from "next/link";
import { AtSign, Briefcase, Camera } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "@/components/shared/newsletter-form";

const columns = [
  {
    heading: "Platform",
    links: [
      { href: "/products", label: "Catalog" },
      { href: "/customize/demo", label: "3D Studio" },
      { href: "/products", label: "How It Works" },
      { href: "/products", label: "Materials Library" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/products", label: "CAD Specs" },
      { href: "/products", label: "Production Times" },
      { href: "/products", label: "Warranty" },
      { href: "/products", label: "Direct Line" },
    ],
  },
];

const socials = [
  { label: "Twitter", icon: AtSign },
  { label: "Instagram", icon: Camera },
  { label: "LinkedIn", icon: Briefcase },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 w-full px-4 pb-10 sm:px-6">
      <div className="ring-foreground/10 mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 rounded-[28px] px-6 py-14 ring-1 md:px-10 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Logo markClassName="h-6" />
          <p className="type-headline-sm tracking-headline font-medium">
            See it. Shape it. Own it.
          </p>
          <p className="type-body-md text-muted-foreground max-w-sm">
            Next-generation WebGL dynamic product engineering and precision on-demand manufacturing
            pipeline.
          </p>
          <ul className="mt-2 flex items-center gap-2">
            {socials.map((social) => (
              <li key={social.label}>
                <Link
                  href="#"
                  aria-label={social.label}
                  className="border-foreground/10 text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full border transition-colors"
                >
                  <social.icon className="size-4" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading} className="lg:col-span-2">
            <ul className="flex flex-col gap-3">
              <li className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
                {column.heading}
              </li>
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="type-body-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="flex flex-col gap-4 lg:col-span-3">
          <span className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
            Dispatch bulletin
          </span>
          <p className="type-body-md text-muted-foreground">
            Engineering updates, material drops, and zero spam.
          </p>
          <NewsletterForm />
        </div>
      </div>
    </footer>
  );
}
