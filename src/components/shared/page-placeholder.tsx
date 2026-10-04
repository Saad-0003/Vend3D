import type { ReactNode } from "react";

/**
 * Shared shell for the Phase 1 route skeleton. Every screen below `/products`
 * gets real content in its own phase; this keeps the routes navigable (and
 * testable for 200s) without inventing behaviour ahead of the plan.
 */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-6 py-20 md:px-8">
      <header className="flex max-w-2xl flex-col gap-3">
        <span className="type-label-sm text-muted-foreground">{eyebrow}</span>
        <h1 className="type-headline-lg-mobile md:type-headline-lg tracking-headline font-medium">
          {title}
        </h1>
        <p className="type-body-lg text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  );
}
