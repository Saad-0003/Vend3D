# shop-02 — finish /shop: fix states-block nesting, route-based navbar active state, commit + DECISIONS

Implementation-ready plan for the code-capable agent. Branch `main`, HEAD `7f3177f` (home-01) + the
uncommitted `/shop` work.

---

## 1. Verified current state

Uncommitted (from `git status`):

- Modified: `src/app/globals.css` (lux token selectors widened `.home-lux` → `:is(.home-lux, .lux)`),
  `src/app/shop/page.tsx` (Server Component shell + Suspense), `src/components/ui/slider.tsx`
  (`trackClassName`/`thumbClassName` escape hatch).
- Untracked: `src/components/shop/{shop-screen,filter-panel,search-dialog}.tsx`,
  `src/components/ui/{popover,select}.tsx` (hand-written over the `radix-ui` meta-package — do NOT
  run `npx shadcn add` over them, the CLI hangs offline), `src/lib/{catalog,catalog-query,format}.ts`.

**Confirmed blocking bug** (user chose "fix before commit"): in `src/components/shop/shop-screen.tsx`
the entire states block (ErrorState / SectionSkeletons / EmptyState / product grid, lines ~294–366) is
nested **inside** the `<Button>` opened on line 286, which is inside the `chips.length ? (…)`
conditional opened on line 254. Therefore:

- Default `/shop` (no filter chips — every clean URL / direct visit / shared link): `chips.length === 0`
  → `null` → **no grid, no empty state, no error state render at all**.
- With ≥1 chip: the grid renders as a descendant of `<button>` (invalid DOM — nested `motion.li` +
  `<Link>`s), and the "Clear all" label swallows the grid text into the button's accessible name.
- All four checks stay green: valid JSX, no lint rule, no unit test renders `ShopScreen`.

Minor related nit: the Filters button passes `aria-controls="shop-filters"` but nothing carries that
id (desktop `PopoverContent`, mobile `DialogContent` both need `id="shop-filters"`).

Navbar: `site-header.tsx:26-36` maps links with `index === 0 ? "page" : undefined` (Shop always
active). `SiteHeader` is a server component. `mobile-nav.tsx` is already a client component.

---

## 2. Tasks (in order — do not reorder)

### T1 · Repair the states-block nesting (blocker, no visual change)

In `src/components/shop/shop-screen.tsx`, the states block currently sits between the `<Button …>`
(line 286) and `Clear all` (line 368) + `</Button>` (line 369). Re-nest so the structure is:

```jsx
{/* Active filters — removable, animated in and out. */}
<AnimatePresence initial={false}>
  {chips.length ? (
    <motion.div layout … aria-label="Active filters">
      <AnimatePresence initial={false} mode="popLayout">
        {chips.map((chip) => (…))}
      </AnimatePresence>
      <Button variant="ghost" onClick={() => update({ colors: [], materials: [], minPrice: undefined, maxPrice: undefined, query: "" })}
        className="h-8 rounded-full px-3 text-[12px] text-[var(--muted)] hover:text-[var(--ivory)]">
        Clear all
      </Button>
    </motion.div>
  ) : null}
</AnimatePresence>

{/* States. */}
{failed ? (…ErrorState onRetry={load}…) : all === null ? (…SectionSkeletons…) : visible.length === 0 ? (…EmptyState…) : (…grid…)}
```

Concretely: keep `Clear all` as the Button's only child; move `</Button>`, `</motion.div>`,
`) : null}` and `</AnimatePresence>` up to sit directly after `Clear all`; the `{/* States. */}`
ternary block becomes a sibling **after** the `</AnimatePresence>` and before the closing band.
Do not touch any `className`, prop, ternary branch, or the chip/card logic. Target: ~5 lines moved.

### T2 · Dangling `aria-controls`

Add `id="shop-filters"` to the desktop `PopoverContent` and the mobile `DialogContent` in
`shop-screen.tsx` (only one mounts at a time — `isDesktop`). The existing `aria-controls`/
`aria-expanded` on the Filters button then resolves at both breakpoints. No other change.

### T3 · New client component `src/components/shared/nav-links.tsx`

`"use client"`. Contents:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/studio", label: "Studio" },
  { href: "/designs", label: "Designs" },
];

/**
 * Route-based active state (DESIGN.md §7 rule 4 allows exactly this wiring).
 * `/shop` also owns the product detail routes — `/products` is storefront browsing.
 */
export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/shop") return pathname === "/shop" || pathname.startsWith("/products");
  return pathname === href;
}

/** Desktop tab bar, split out so `<SiteHeader>` stays a server component (AGENTS.md §3). */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="bg-foreground/[0.04] hidden items-center gap-1 rounded-full p-1 md:flex">
      {links.map((link) => {
        const active = isNavActive(link.href, pathname);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`type-label-md block rounded-full px-4 py-1.5 transition-colors ${
                active
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

Rules for this task:

- Class strings must be **byte-identical** to the current implementation (only the ternary source
  changes from `index === 0` to `active`). No new styles, no `cn`, no restyling (DESIGN.md rule 4).
- If `usePathname()` is typed nullable in this Next version, use `usePathname() ?? "/"` — nothing else.
- Keep the template-literal className style already in the file (do not introduce `cn` here).

### T4 · Wire into `src/components/shared/site-header.tsx` (server header kept)

- Delete the local `links` array (lines 8–12).
- Import `{ NavLinks } from "@/components/shared/nav-links"`.
- Inside `<nav aria-label="Main">`, replace the mapped `<ul>…</ul>` with `<NavLinks />`.
- Everything else (header shell, `Logo`, `CartButton`, avatar button, `MobileNav`) stays untouched.

### T5 · Wire active state into `src/components/shared/mobile-nav.tsx`

- Add `import { usePathname } from "next/navigation";` and
  `import { isNavActive } from "@/components/shared/nav-links";`.
- `const pathname = usePathname();` and in the map:
  `<Link href={link.href} aria-current={isNavActive(link.href, pathname) ? "page" : undefined}>`.
- Keep the local `links` array (it includes `/orders`, which the desktop rail does not) — do not
  import `NavLinks`' array. `aria-current` only; no visual/shading change.

### T6 · Append two DECISIONS.md entries (after D-036)

D-037 (the entry requested — hand-written popover/select because the shadcn CLI hung on network;
catalog lives in `lib/catalog.ts` as the shared client source; `cmdk` rejected as a new dependency;
search built on the existing `Dialog`; `catalog-query.ts` holds the pure filter/sort/serialise logic;
`formatCents` is the single UI-edge formatter).

D-038 (log the globals.css widening — it changes D-030's premise): what = token block and every
`.lux-*` selector now match `:is(.home-lux, .lux)` while only `.home-lux` paints its own canvas;
why = shared primitives (PageHeader, ProductCard, SectionSkeletons, studio controls) must render
identically on content routes instead of being duplicated, and the protected Navbar / Testimonials /
Footer carry neither class so D-030's guarantee still holds; alternatives rejected = global
`@theme` remap (D-030's rejected option), duplicating primitives, copying the token block.

Follow the file's existing format: `### D-0NN · <title>` with **What / Why / Alternatives rejected**,
prose paragraphs, same tone as neighbouring entries.

### T7 · Verification chain (in this order — D-025 applies)

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build` — **no `next dev` may be running** (D-025: build races with a dev server holding
   `.next`). Run the build before starting any dev server for the acceptance pass.

(Optional per D-017, not required by this prompt: `npm run format:check` — only run it; if it fails
on pre-existing files, do not reformat anything, just note it.)

### T8 · Acceptance verification pass (manual / Playwright, nothing committed)

Do not add spec files this prompt (user decision: manual pass; unit + e2e codification deferred).

Navbar (the remaining acceptance item):

- `/shop` → Shop tab has `aria-current="page"` **and** active classes (`bg-foreground/[0.08]
  text-foreground`); Studio/Designs inactive. Server-rendered HTML already carries it (usePathname
  resolves during SSR, so no hydration dependency).
- `/studio` → Studio active only. `/designs` → Designs active only.
- `/products/heavyweight-boxy-tee` → Shop active (prefix rule).
- Mobile dropdown (viewport < 768) → same `aria-current` on the active item.

Shop screen (regression from T1/T2):

- Default `/shop` renders **4 ProductCards** (the catalog has 4 products). This is the bug proof.
- `?category=Apparel` → 1 card + 1 chip; `?q=zzzz` → EmptyState with "Clear filters"; `?color=Signal`
  and `?material=Combed%20cotton` chips render; chip X clears that constraint; "Clear all" resets
  the URL to `/shop`.
- Sort Select: choosing "Price: low to high" sets `?sort=price-asc` and reorders (filter-panel and
  shop-screen are URL-driven — assert the URL, not just the order).
- Filters button (≥768): Enter opens the Popover, Escape closes, focus returns to the button;
  (<768) the bottom-sheet Dialog opens, focus is trapped, "Show N blanks" closes it.
- Search: Search button and ⌘K/Ctrl-K open the dialog; focus lands in the input; typing filters
  live; ↑/↓ move the cursor (`aria-activedescendant` follows); Enter opens the highlighted product;
  Escape closes.
- Keyboard: Tab order reaches nav → category Tabs (ArrowLeft/ArrowRight switch via Radix automatic
  activation) → Sort Select (Enter opens, arrows choose, Escape closes) → Filters → grid links.
  Focus-visible shows the 2px lime ring (`:is(.home-lux,.lux) a:focus-visible` in globals.css).
- Five widths — 390, 768, 1024, 1440, 1920: no horizontal overflow
  (`document.documentElement.scrollWidth <= window.innerWidth`); toolbar wraps instead of clipping;
  popover (≥768) and sheet (<768) each open within the viewport.
- States: loading skeleton visible on first paint (Suspense fallback + in-screen
  `SectionSkeletons`); empty state reachable via a no-match `q`; error state exists by construction
  (`failed` → `ErrorState` with retry wired to `load`) — `listProducts()` never rejects with the
  static catalog, so verify by code inspection, not by triggering.
- No new visual styles: navbar classes identical apart from the active swap; palette unchanged;
  `/shop` still renders inside `.lux` carrying the midnight-atelier tokens while the header/footer
  keep the storefront tokens.

### T9 · Commit

Stage explicitly (do not `git add -A`; `scripts/tmp-db-inspect.mjs` is an open tab and must be
checked before any broad stage):

```
git add src/app/globals.css src/app/shop/page.tsx src/components/ui/slider.tsx \
        src/components/shop src/components/ui/popover.tsx src/components/ui/select.tsx \
        src/lib/catalog.ts src/lib/catalog-query.ts src/lib/format.ts \
        src/components/shared/nav-links.tsx src/components/shared/site-header.tsx \
        src/components/shared/mobile-nav.tsx DECISIONS.md
```

`git status` first; only stage the listed paths (+ the two new/edited shared files). Then:

```
git commit -m "shop-02: full catalog with URL-state filters, sort and command search"
```

with a body listing: URL-state filters (chips + query-string round-trip via `catalog-query.ts`),
sort Select, ⌘K command search on the existing Dialog, hand-written popover/select (CLI hangs
offline, D-037), catalog in `lib/catalog.ts` as the shared client source, `.lux` token widening
(D-038), route-based navbar active state incl. `/products/*` (DESIGN.md rule 4), and the
states-block re-nesting repair (grid previously only rendered inside a Button when chips existed).

---

## 3. Constraints (non-negotiable)

- Never read/cat/echo `.env*` (AGENTS.md §0). Supabase service-role key rules apply.
- Money stays integer cents; `formatCents()` only at the UI edge (already the case).
- Navbar/Footer/Testimonials: wiring + active-state only (DESIGN.md rule 4). No markup or style
  changes beyond the `aria-current`/class swap.
- No new dependencies; no `npx shadcn add` (hangs offline — popover/select are hand-written files).
- Do not reintroduce `precision-bento` / `precision-demos` (deleted in `7f3177f`).
- Keep `SiteHeader` a server component — the `NavLinks` client wrapper is the only client island.
- Do not add `any`, `@ts-ignore`, or disable checks. Do not paper over failures (AGENTS.md §4).
- `checkoutKey`/demo-payment rules are not in play in this prompt (no checkout work).

## 4. Risks

- T1 is the only risky edit: it is a pure move of 4 closing tags plus the states block. If the
  ternary chain's `mt-8` wrappers are dropped during the move, the default view loses its top
  spacing — keep the wrapper `<div className="mt-8">` on each branch.
- After T3/T5, a stale hydration mismatch would show as an inactive tab on first paint — verified
  by the acceptance pass (T8); `usePathname` resolves during SSR, so no mismatch is expected.
- `scripts/tmp-db-inspect.mjs` (untracked or ignored?) must not enter the commit — verify with
  `git status --ignored` if unsure.

## 5. Out of scope (next prompt, per standing notes)

- `/products/[slug]` detail: rename `[id]` → `[slug]` (D-018), read/apply `?color=<slug>`.
- `/reviews` route + Testimonials "See all reviews" wiring.
- Unit tests for `catalog-query` (apply/parse/serialize) and shop primitives; e2e assertions for
  the shop screen.
- `SearchDialog` Enter uses `window.location.assign` while row clicks use `<Link>` — works, left
  as-is.

## 6. Report at end (DESIGN.md §7 rule 13)

Short report: files created/edited, packages added (none), anything not done.
