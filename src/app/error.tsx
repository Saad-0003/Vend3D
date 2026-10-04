"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary. Phase 12 replaces the inline log with the shared
 * `toUserMessage` mapper so no stack trace or database error reaches the client;
 * for now only the error digest is recorded.
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
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[90rem] flex-col items-start justify-center gap-6 px-6 py-20 md:px-8">
      <span className="type-label-sm text-muted-foreground">Something broke</span>
      <h1 className="type-headline-lg-mobile md:type-headline-lg tracking-headline max-w-xl font-medium">
        This page hit an unexpected error.
      </h1>
      <p className="type-body-lg text-muted-foreground max-w-lg">
        Try again — if it keeps happening, head back to the storefront and pick up where you left
        off.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset} className="h-11 rounded-full px-8">
          Try again
        </Button>
        <Button asChild variant="secondary" className="h-11 rounded-full px-8">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
