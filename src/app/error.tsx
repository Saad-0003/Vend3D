"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo-mark";

/**
 * Global error boundary (plan.md Phase 1).
 *
 * The error is logged to the console only. Phase 12 replaces the inline log with
 * the shared `toUserMessage` mapper so no stack trace or database error reaches
 * the client — until then the digest is all that is recorded, and the screen
 * itself never shows internals.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error.digest ?? "no-digest");
  }, [error]);

  return (
    <div className="lux bg-[var(--ink)] text-[var(--ivory)]">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-[1200px] flex-col justify-center gap-8 px-6 py-20 md:px-8">
        <span className="flex items-center gap-4">
          <LogoMark className="h-7 w-auto opacity-80" />
          <span className="lux-eyebrow text-[var(--muted)]">Error</span>
        </span>

        <h1 className="font-[var(--font-instrument)] text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.95] text-[var(--ivory)]">
          Something slipped.
        </h1>

        <p className="max-w-md text-[17px] leading-[1.6] text-[var(--muted)]">
          The page hit an unexpected error. Try again — if it keeps happening, head back to the
          storefront and pick up where you left off.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={reset}
            className="h-12 rounded-full bg-[var(--lime)] px-7 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
          >
            Try again
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-12 rounded-full px-7 text-[15px] text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
          >
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
