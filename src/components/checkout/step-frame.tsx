import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared frame for the three steps: title + description, the (optional) error
 * banner, the form body and the action row. The frame never owns data — each
 * step keeps its own form, so leaving a step unmounts its state with it.
 */
export function StepFrame({
  title,
  description,
  error,
  children,
  actions,
  className,
}: {
  title: string;
  description: string;
  error?: ReactNode;
  children: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  const titleId = `checkout-step-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section aria-labelledby={titleId} className={cn("flex max-w-[560px] flex-col gap-7", className)}>
      <header className="flex flex-col gap-2">
        <h2 id={titleId} className="lux-display text-[26px] text-[var(--ivory)] sm:text-[30px]">
          {title}
        </h2>
        <p className="max-w-[52ch] text-[15px] leading-[1.6] text-[var(--muted)]">{description}</p>
      </header>

      {error}

      {children}

      <div className="flex flex-wrap items-center gap-3">{actions}</div>
    </section>
  );
}
