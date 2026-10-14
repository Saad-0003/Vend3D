import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Content blocks for the informational pages (`/how-it-works`, `/materials`,
 * `/cad-specs`, `/production-times`, `/warranty`, `/contact`).
 *
 * Every page is assembled from these blocks plus the shared `InfoPage` shell, so
 * a new information page is a data file and not a new layout.
 *
 * Tables follow one house style everywhere on these pages: no fills, no zebra
 * rows, no tinted header, no shadow. Every cell carries a 1px border on all
 * four sides so the grid reads like a plain document table, with the header row
 * told apart only by weight.
 */

export type InfoBlock =
  | { kind: "prose"; body: ReactNode }
  | { kind: "note"; body: ReactNode }
  | { kind: "list"; items: { icon: ReactNode; title: string; body?: string }[] }
  | { kind: "table"; columns: string[]; rows: ReactNode[][]; caption?: string; numeric?: number[] }
  | { kind: "faq"; items: { q: string; a: ReactNode }[] }
  | { kind: "figure"; src: string; alt: string; caption: string }
  | { kind: "grid"; items: { title: string; body: string; media?: ReactNode; meta?: string }[] }
  | { kind: "custom"; node: ReactNode };

/**
 * Inline text link used inside prose, FAQ answers and label copy across the
 * informational and legal pages — one link style for the whole site
 * (DESIGN.md rule 3). `newTab` is for links that sit inside a label, where
 * navigating away would lose the form.
 */
export function InfoLink({
  href,
  children,
  newTab,
}: {
  href: string;
  children: ReactNode;
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      {...(newTab ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className="text-[var(--ivory)] underline-offset-4 transition-colors hover:text-[var(--lime)] hover:underline hover:decoration-[var(--lime)]/60"
    >
      {children}
    </a>
  );
}

/**
 * The muted "we do not know this yet" note. Anything the site cannot back up
 * with a fact ships as one of these rather than as invented copy.
 */
export function InfoNote({ body }: { body: ReactNode }) {
  return (
    <p className="border-[var(--hairline-strong)] bg-foreground/[0.03] text-[var(--muted)] flex items-start gap-3 rounded-lg border border-l-2 border-l-[var(--lime)]/70 px-4 py-3 text-[13px] leading-[1.6]">
      <span className="lux-mono mt-px shrink-0 text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
        Note
      </span>
      <span>{body}</span>
    </p>
  );
}

/** Body copy column. Callers pass real `<p>` elements so links stay inline. */
export function InfoProse({ body }: { body: ReactNode }) {
  return (
    <div className="flex max-w-[68ch] flex-col gap-4 text-[15px] leading-[1.7] text-[var(--muted)] [&_strong]:font-medium [&_strong]:text-[var(--ivory)]">
      {body}
    </div>
  );
}

/**
 * The draft banner every legal page must carry at the top. The wording is fixed
 * so the three pages cannot drift.
 */
export function LegalDraftNotice() {
  return (
    <p className="border-[var(--hairline-strong)] bg-foreground/[0.03] text-[var(--muted)] flex items-start gap-3 rounded-lg border border-l-2 border-l-[var(--lime)]/70 px-4 py-3 text-[13px] leading-[1.6]">
      <span className="lux-mono mt-px shrink-0 text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
        Draft
      </span>
      <span>
        Draft template. Have a lawyer review before launch. Nothing on this page should be treated
        as final legal wording.
      </span>
    </p>
  );
}

/**
 * Mono "Last updated" line. The date stays a placeholder until the owner sets
 * one — these pages are templates, not published policy.
 */
export function LegalUpdatedLine() {
  return (
    <p className="lux-mono lux-tabular text-[12px] text-[var(--faint)]">Last updated: [date]</p>
  );
}

/** Plain document table: full 1px grid, no fills, bold header, mono numerals. */
export function InfoTable({
  columns,
  rows,
  caption,
  numeric = [],
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  numeric?: number[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-[14px]">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-[var(--hairline-strong)] text-[var(--ivory)] border px-3 py-2.5 font-semibold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      // `border-collapse` on the table keeps the shared edges to a
                      // single 1px line, so every cell really does carry a full
                      // grid without doubling up.
                      "border-[var(--hairline-strong)] align-top border px-3 py-2.5 leading-[1.6] text-[var(--muted)]",
                      numeric.includes(cellIndex) && "lux-mono lux-tabular text-[var(--ivory)]",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <p className="text-[13px] text-[var(--muted)]">{caption}</p> : null}
    </div>
  );
}
