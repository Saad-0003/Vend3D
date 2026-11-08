"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

/**
 * Header/footer mount everywhere **except** the admin tree (plan.md Phase 1B
 * U4): `/admin` carries its own back-office frame — sidebar, top bar with
 * breadcrumbs, its own account menu — and the storefront chrome around it
 * would duplicate both the logo and the account menu. The components
 * themselves are untouched; this only decides whether they mount (D-094).
 *
 * The pathname is known to the server while hydrating, so admin and storefront
 * routes render consistently without a hydration split.
 */
export function SiteChrome({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {isAdmin ? null : <SiteHeader />}
      {children}
      {isAdmin ? null : <SiteFooter />}
    </>
  );
}
