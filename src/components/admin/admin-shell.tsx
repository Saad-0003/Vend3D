"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowLeft, Menu, TriangleAlert, X } from "lucide-react";

import { AccountMenu } from "@/components/auth/account-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { AdminNavList } from "@/components/admin/admin-nav-items";
import { useAuthStore } from "@/stores/auth-store";

/**
 * The `/admin` frame (plan.md Phase 1B U4): a fixed sidebar on desktop, a
 * slide-in sheet on mobile, and one top bar — breadcrumbs, "Back to store",
 * the account menu — shared by every admin route. Brand and tokens are the
 * storefront's own (`.lux`), the spacing is deliberately denser for a
 * back-office. Motion-free by design: calmer than the shop pages, and
 * `prefers-reduced-motion` needs no special casing.
 *
 * The storefront header/footer do not mount here (`site-chrome.tsx`), so this
 * top bar is the only chrome the admin routes have.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="lux flex min-h-svh w-full">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="border-[var(--hairline)] bg-[var(--surface-1)] sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-8 border-r px-5 py-7 lg:flex">
        <Logo />
        <AdminNavList pathname={pathname} />
        <p className="lux-mono mt-auto text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
          Back office · demo build
        </p>
      </aside>

      {/* ── Right column ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-[var(--hairline)] bg-[var(--surface-1)]/80 sticky top-0 z-40 flex h-14 w-full items-center gap-2 border-b px-4 backdrop-blur-xl sm:px-6 md:px-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open admin navigation"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
            className="text-[var(--ivory)] hover:bg-[var(--surface-2)] lg:hidden"
          >
            <Menu className="size-4" strokeWidth={1.5} aria-hidden />
          </Button>

          <AdminBreadcrumbs pathname={pathname} />

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Back to store"
              className="hidden text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ivory)] sm:inline-flex md:hidden"
            >
              <Link href="/">
                <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="hidden h-9 rounded-full px-4 text-[13px] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ivory)] md:inline-flex"
            >
              <Link href="/">
                <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
                Back to store
              </Link>
            </Button>

            <AccountMenu>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Account menu"
                className="bg-primary text-primary-foreground hover:bg-primary/85 size-8 rounded-full"
              >
                <span className="text-[12px] font-medium">
                  {user?.name?.trim()?.[0]?.toUpperCase() ?? "A"}
                </span>
              </Button>
            </AccountMenu>
          </div>
        </header>

        <div className="flex flex-col gap-8 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
          {/* Every admin route reads browser-local demo data until Phase 10's
              server admin service replaces this seam (D-094). */}
          <p
            data-testid="admin-demo-banner"
            className="flex items-center gap-3 rounded-[var(--inner-radius)] border border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--lime-glow)] px-4 py-3 text-[13px] leading-snug text-[var(--ivory)]"
          >
            <TriangleAlert
              className="size-4 shrink-0 text-[var(--lime)]"
              strokeWidth={1.5}
              aria-hidden
            />
            Demo data from this browser. Orders, revenue and designs are this
            browser&apos;s local records; Phase 10 replaces them with the live store.
          </p>

          {children}
        </div>
      </div>

      {/* ── Mobile navigation sheet ─────────────────────────────────────── */}
      <DialogPrimitive.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <DialogPrimitive.Content
            className="lux fixed inset-y-3 left-3 z-50 flex w-[calc(100%-1.5rem)] max-w-[280px] flex-col gap-6 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5 outline-none [box-shadow:var(--soft-shadow)] transition-transform duration-500 data-[state=closed]:-translate-x-[110%] data-[state=open]:translate-x-0"
            aria-describedby={undefined}
          >
            <header className="flex items-center justify-between gap-4">
              <DialogPrimitive.Title asChild>
                <div>
                  <Logo />
                </div>
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close admin navigation"
                  className="size-11 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]"
                >
                  <X className="size-4" strokeWidth={1.5} aria-hidden />
                </Button>
              </DialogPrimitive.Close>
            </header>

            <AdminNavList
              pathname={pathname}
              onNavigate={() => setSheetOpen(false)}
            />

            <div className="mt-auto flex flex-col gap-3 border-t border-[var(--hairline)] pt-5">
              <Button
                asChild
                variant="ghost"
                className="h-11 justify-start rounded-full px-4 text-[13px] text-[var(--ivory)] hover:bg-[var(--surface-2)]"
              >
                <Link href="/" onClick={() => setSheetOpen(false)}>
                  <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
                  Back to store
                </Link>
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

/**
 * "Admin / Dashboard" — the admin tree keeps exactly two segments: the
 * section (Admin) and the current screen. Sections that have no screen yet
 * (Orders, detail placeholders) render their segment name from the URL so the
 * crumbs still tell the truth.
 */
function AdminBreadcrumbs({ pathname }: { pathname: string | null }) {
  const segments = (pathname ?? "").split("/").filter(Boolean);
  const onRoot = segments.length === 1;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-2 text-[13px]">
        <li>
          <Link
            href="/admin"
            aria-current={onRoot ? "page" : undefined}
            className={onRoot ? "text-[var(--ivory)]" : "text-[var(--muted)] hover:text-[var(--ivory)]"}
          >
            Admin
          </Link>
        </li>
        {segments.slice(1).map((segment, index) => {
          const last = index === segments.length - 2;
          return (
            <li key={index} className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="text-[var(--faint)]">
                /
              </span>
              <span
                aria-current={last ? "page" : undefined}
                title={segment}
                className={
                  "truncate " + (last ? "text-[var(--ivory)]" : "text-[var(--muted)]")
                }
              >
                {crumbLabel(segment)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** An order id reads badly in a crumb; every section label is dictionary-based. */
function crumbLabel(segment: string): string {
  const labels: Record<string, string> = { orders: "Orders", products: "Products" };
  return segment.startsWith("ord-") ? "Order detail" : (labels[segment] ?? segment);
}
