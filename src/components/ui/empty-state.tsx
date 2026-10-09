import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Loading / empty / error are first-class: every async screen renders one of
 * these instead of inventing its own panel (docs/DESIGN.md rule 12).
 */
export function EmptyState({
  eyebrow = "Nothing here yet",
  title,
  body,
  action,
  icon,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--surface-1)] px-6 py-16 text-center",
        className,
      )}
      style={{ borderColor: "color-mix(in srgb, var(--lime) 35%, transparent)" }}
    >
      {icon ? <span className="text-[var(--lime)]">{icon}</span> : null}
      <span className="lux-eyebrow text-[var(--muted)]">{eyebrow}</span>
      <h3 className="lux-display text-[20px] text-[var(--ivory)]">{title}</h3>
      {body ? <p className="max-w-md text-[15px] leading-[1.6] text-[var(--muted)]">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
