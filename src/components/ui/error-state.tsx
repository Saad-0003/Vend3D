"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Error panel with an actionable message — never a dead end (AGENTS §8: every
 * error message says what to do next).
 */
export function ErrorState({
  title = "Something went wrong",
  body = "That request did not complete. Try again — if it keeps happening, reload the page.",
  onRetry,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,#ffb4ab_35%,transparent)] bg-[var(--surface-1)] px-6 py-16 text-center",
        className,
      )}
    >
      <AlertTriangle className="size-6 text-[#ffb4ab]" strokeWidth={1.5} aria-hidden />
      <span className="lux-eyebrow text-[#ffb4ab]">Error</span>
      <h3 className="lux-display text-[20px] text-[var(--ivory)]">{title}</h3>
      <p className="max-w-md text-[15px] leading-[1.6] text-[var(--muted)]">{body}</p>
      {onRetry ? (
        <Button variant="outline" className="h-11 rounded-full px-6" onClick={onRetry}>
          <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
