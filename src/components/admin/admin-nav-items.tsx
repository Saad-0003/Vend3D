"use client";

import Link from "next/link";
import { LayoutDashboard, PackageOpen, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The sidebar's three destinations (plan.md Phase 1B U4). The dashboard and,
 * as of U5, the products screen are built; Orders renders as a visible "Soon"
 * entry until U6 — the phase that builds it is its disabled label, so the
 * roadmap stays legible without stubs pretending to work (AGENTS §3 scope).
 */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: true }>;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: PackageOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

/** Routes whose screens exist. Products joined in U5; Orders in U6. */
const BUILT_HREFS = new Set(["/admin", "/admin/products"]);

/** Only built routes can be active; deep links (new, [id]) light their section. */
function isActive(pathname: string | null, item: AdminNavItem): boolean {
  if (!pathname) return false;
  if (item.href === "/admin") return pathname === "/admin";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const rowBase = "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] transition-colors";
const rowActive =
  "bg-[var(--surface-2)] text-[var(--ivory)] ring-1 ring-[var(--hairline)] [box-shadow:var(--inner-highlight)]";
const rowIdle = "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ivory)]";
const rowDisabled = "text-[var(--faint)] cursor-not-allowed";

export function AdminNavList({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string | null;
  /** Closes the mobile sheet after navigating. */
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav aria-label="Admin" className={className}>
      <ul className="flex flex-col gap-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const built = BUILT_HREFS.has(item.href);
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.label}>
              {built ? (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(rowBase, active ? rowActive : rowIdle)}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  title="Not built yet — this screen ships with the phase it belongs to."
                  className={cn(rowBase, rowDisabled)}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                  <span>{item.label}</span>
                  <span className="lux-mono ml-auto rounded-full border border-[var(--hairline)] px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-[var(--muted)] uppercase">
                    Soon
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
