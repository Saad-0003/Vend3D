"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/studio", label: "Studio" },
  { href: "/designs", label: "Designs" },
];

/**
 * Route-based active state — the one wiring DESIGN.md rule 4 allows on the
 * navbar. `/shop` also owns the product routes: `/products` is storefront
 * browsing, so both it and any detail page keep Shop active. Everything else
 * matches exactly so a tab never lights up for a sibling section.
 */
export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/shop") return pathname === "/shop" || pathname.startsWith("/products");
  return pathname === href;
}

/**
 * Desktop tab bar, split out of the server `<SiteHeader>` so the header itself
 * stays a Server Component (AGENTS.md §3). `usePathname` resolves during SSR,
 * so the active tab is already correct in the server-rendered HTML.
 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="bg-foreground/[0.04] hidden items-center gap-1 rounded-full p-1 md:flex">
      {links.map((link) => {
        const active = isNavActive(link.href, pathname);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`type-label-md block rounded-full px-4 py-1.5 transition-colors ${
                active
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
