import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: "No access",
  description: "You don't have access to this page.",
  // Not indexed and not followed: a permissions stop should never surface in a
  // search result list.
  robots: { index: false, follow: false },
};

/**
 * `/forbidden` (plan.md Phase 1B U3) — where a non-admin lands after opening an
 * `/admin` route (via `RequireAdmin`).
 *
 * HTTP-style semantics via a not-indexed page: a statically rendered App Router
 * page cannot emit a real 403 status, so this is a 200 whose metadata marks it
 * unindexable and whose copy says what a 403 would. The trusted gate stays the
 * server-side admin check (plan.md Phase 3/10).
 */
export default function ForbiddenPage() {
  return (
    <PageShell aria-label="No access" className="lux">
      <div className="mx-auto flex w-full max-w-[1120px] justify-center">
        <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-6 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-8 text-center [box-shadow:var(--inner-highlight)]">
          <span
            aria-hidden
            className="grid size-14 place-items-center rounded-full border border-[var(--hairline)] bg-[var(--surface-2)]"
          >
            <Lock className="size-6 text-[var(--muted)]" strokeWidth={1.5} />
          </span>

          <header className="flex flex-col gap-2">
            <span className="lux-eyebrow text-[var(--lime)]">Access</span>
            <h1 className="lux-h2 lux-display text-[24px] text-[var(--ivory)]">
              You don&apos;t have access to this page
            </h1>
            <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
              This area is for admin accounts only. Sign in with an admin account and try again.
            </p>
          </header>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--lime)]/90"
            >
              Back to shop
            </Link>
            {/* A signed-out visitor is bounced to `/login?next=` by RequireAuth. */}
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-transparent px-6 text-[15px] font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--surface-2)]"
            >
              Go to account
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
