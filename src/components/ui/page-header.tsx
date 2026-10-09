import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Standard screen header: mono lime eyebrow, serif H1, optional muted intro,
 * optional right-side action (see `docs/DESIGN.md` §2/§5).
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  action,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex max-w-2xl flex-col gap-4">
        <span className="lux-eyebrow text-[var(--lime)]">{eyebrow}</span>
        <h1 className="lux-h2 lux-display text-[var(--ivory)]">{title}</h1>
        {intro ? (
          <p className="max-w-xl text-[15px] leading-[1.6] text-[var(--muted)] sm:text-[17px]">
            {intro}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
