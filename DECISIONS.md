# DECISIONS

Deviations and setup decisions, per `agent.md` §2.6 (deviation without a log entry = failure).
Format: **what** · **why** · **alternatives rejected**.

---

## Stack setup (before Phase 1)

### D-001 · Prisma pinned to v6, not v7

**What:** `prisma` / `@prisma/client` at `^6.19.3`.
**Why:** `plan.md` §2.3 defines `npm run db:migrate` as `prisma migrate dev` with a committed
`prisma/schema.prisma` + `prisma/migrations/` (architecture.md §12). Prisma 7 moves configuration
to `prisma.config.ts`, requires driver adapters, and changes the migration/client generation flow —
that is a workflow change the plan does not describe, and it would have to be written up in
Phase 2. v6 keeps `schema.prisma` as the single source of truth.
**Alternatives rejected:** Prisma 7 with `prisma.config.ts` + adapter (cleaner long-term, wrong
tooling contract for this plan); Drizzle (not in the plan).

### D-002 · shadcn/ui via `shadcn` CLI v4 with the **radix** base

**What:** `components.json` uses `"style": "radix-nova"`, `"base": radix`; the CLI installed
`radix-ui`, `shadcn`, `cn` and `tw-animate-css` as dependencies, and `globals.css` now imports
`shadcn/tailwind.css`.
**Why:** `plan.md` §1.1 pins "shadcn/ui (Radix primitives)". The CLI's default preset (`base-nova`)
is built on `@base-ui/react`, which contradicts that pin, so init was re-run with `-b radix`.
**Alternatives rejected:** default Base UI preset (violates the plan's Radix pin); vendoring
shadcn components by hand (agent.md §3: no unjustified deviation).

### D-003 · Env validation runs in `src/instrumentation.ts`, not in `next.config.ts`

**What:** `register()` calls `getEnv()` when `NEXT_RUNTIME === "nodejs"`.
**Why:** `plan.md` §2.2 wants a crash-fast boot check, but Phase 1's acceptance criteria also require
`npm run build` to pass on a clean clone with no `.env.local`. `instrumentation.ts` runs on server
boot (dev + production runtime) and not during the build, so both requirements hold.
**Alternatives rejected:** validating inside `next.config.ts` (breaks clean-clone builds);
`SKIP_ENV_VALIDATION` build flag (POSIX-only env syntax on Windows, and it weakens the guarantee).

### D-004 · Stricter `tsconfig` than the create-next-app default

**What:** added `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`,
`noUnusedParameters`, `forceConsistentCasingInFileNames`, `target: ES2022`, and explicit
`types: ["node", "vitest/globals", "@testing-library/jest-dom"]`.
**Why:** `agent.md` §3 requires TypeScript strict with `any` effectively banned; the extra flags
catch unsafe indexed access early, which matters for money/config code in later phases.
**Alternatives rejected:** plain `strict: true` only (weaker than the plan's spirit).

### D-005 · `@types/node` bumped to `^24`

**What:** dev dependency `@types/node@^24` instead of the scaffold's `^20`.
**Why:** Vitest 5 / Vite 8 declare `peerOptional @types/node@^22 || >=24`; the scaffold version
made `npm install` fail with ERESOLVE.
**Alternatives rejected:** `--legacy-peer-deps` (agent.md §4: no papering over).

### D-006 · `analyze` script wraps the build in `scripts/analyze.mjs`

**What:** `npm run analyze` → `node scripts/analyze.mjs`, which spawns `next build` with
`ANALYZE=true`.
**Why:** `ANALYZE=true next build` is POSIX shell syntax and fails on Windows, where this repo is
developed. `next.config.ts` reads `process.env.ANALYZE` to switch on `@next/bundle-analyzer`.
**Alternatives rejected:** `cross-env` dependency (extra dep for one script).

### D-007 · `optimize:models` script is declared but not implemented yet

**What:** `npm run optimize:models` → `node scripts/optimize-models.mjs`; the file does not exist.
**Why:** `agent.md` §4 lists the script as part of the command surface, so the name is reserved
now. The `@gltf-transform/cli` pipeline itself is Phase 11 work and was not written early.
**Alternatives rejected:** implementing it now (would be executing Phase 11 out of order);
omitting the script name (breaks the documented command surface).

### D-008 · Versions resolved at setup time, pinned by the lockfile

**What:** installed and committed `package-lock.json`; notable resolved versions: Next 15.5.27,
React 19.1.0, three 0.186, @react-three/fiber 9.8, @react-three/drei 10.7, zustand 5.0,
zod 4.6, framer-motion 14, Vitest 5.0 (Vite 8), Playwright 1.63, @gltf-transform/cli 4.5.
**Why:** `plan.md` §2.2 requires a committed lockfile so a clean clone is reproducible. Where the
plan pins a major (`@react-three/fiber v9`, `@react-three/drei v10`, Tailwind v4) the caret range
enforces it.
**Alternatives rejected:** floating ranges without a lockfile (non-reproducible installs).

### D-009 · Design mockups live in `docs/ui-reference/`, gitignored from Prettier

**What:** the human supplied the screen mockups plus brand documents; they live in
`docs/ui-reference/` (each screen folder = `code.html` + `screen.png`), documented by a
`README.md` inside that folder and listed as a contract file in `AGENTS.md`. The folder is added
to `.prettierignore`. The pack was re-supplied on 2026-10-04 in a new shape — four sibling
exports, each nesting `stitch_vend3d_3d_storefront_customizer/` — and the folder README plus
D-012 now describe that layout.
**Why:** `ARCHITECTURE.md` §12 already reserves `docs/` for non-shipped material, so the pack
sits there rather than in `public/` (which would bundle ~9 MB of PNGs into the production
build and serve them to visitors) or `src/` (which would pollute the import graph). The
`.prettierignore` entry is required because `npm run format` runs `prettier --write .` and
Prettier formats `.html`/`.md` — without it, every mockup would be rewritten in place.
**Alternatives rejected:** `public/ui-reference/` (ships to production); `src/components/mockups/`
(enters the type-check and import graph); gitignoring the pack (future agents and CI would
have no design reference, and a dead external design link is worse than a stale image).

### D-010 · Conflicting design tokens in `DESIGN.md` resolved in favour of the prose

**What:** `DESIGN.md` specifies some tokens twice with different values — accent lime
`#c2ed30` (frontmatter) vs `#C6F135` (prose), background `#131315` vs `#0A0A0B`, surface
`#131315` vs `#121214`, raised surface `#39393b` vs `#1A1A1D`, text primary `#e5e1e4` vs
`#EDEDED`, text-muted `#c7c7bf` vs `#7C7C82`, plus a `rounded` scale that does not yield the
prose radii (16px inputs, 28–32px panels). Phase 1 wrote the **prose** values into
`src/app/globals.css`: `--stage #0A0A0B`, `--deck #121214`, `--glass #1A1A1D`, hairline
`rgba(255,255,255,0.08)`, foreground `#EDEDED`, muted `#7C7C82`, `--signal #C6F135`,
`--radius: 1rem` (16px, so `rounded-lg` is the input radius) with panels written as explicit
`rounded-[28px]` / `rounded-[32px]`. The conflict table is reproduced in
`docs/ui-reference/README.md`.
**Why:** the human was asked to settle it (D-010 originally blocked Phase 1 on this) and the
pack README plus the DESIGN.md prose itself both declare the prose canonical; the frontmatter
is a machine export of a different palette generation and disagrees on eight tokens. Guessing
between two documented brand values would bake a silent design decision into every later
screen.
**Alternatives rejected:** picking the frontmatter values (it is a machine export, and it
contradicts the written spec on eight tokens); averaging the values (inventing a third brand);
blocking the phase again (the human has now ruled, and the rule is documented).

### D-011 · `next.config.ts` no longer crashes the build on a malformed public URL

**What:** the Supabase Storage `images.remotePatterns` derivation wraps `new URL(...)` in a
`try/catch` and logs a length-only warning instead of throwing. `src/env.ts` remains the
single validator and still fails the server boot naming the offending key.
**Why:** the config module is loaded during `next build`, so a typo in
`NEXT_PUBLIC_SUPABASE_URL` previously broke `npm run build` with a bare
`TypeError: Invalid URL` — no key name, no hint. The warning deliberately prints only the
character count, never the value, per `AGENTS.md` §0.1.
**Alternatives rejected:** dropping the Supabase image pattern entirely (breaks Phase 4
previews); validating inside the config and throwing (same unhelpful failure mode).

---

## Phase 1 — Project Scaffolding & Design System

### D-012 · Two brand documents ship in the pack; the storefront one owns the global tokens

**What:** the human re-supplied the mockup pack on 2026-10-04 as four sibling exports, and it
now contains **two** brand documents: `vend3d/DESIGN.md` ("Vend3D" — Geist, storefront, dark
obsidian) and `vend3d_studio/DESIGN.md` ("Vend3D Studio" — Space Grotesk + Inter, CAD hairline
studio). `globals.css` implements the **storefront** document only. The studio document's
differing surfaces (`#0E0E0E`/`#161616`/`#1F1F1F`), 10–12px control radii and two-family type
stack are recorded for Phases 5–6 rather than merged into the global tokens now.
**Why:** the storefront and the 3D studio are two different surfaces in one product, and Phase 1
only builds storefront chrome. Writing both sets into `:root` would mean every later screen has
to remember which palette is in force — the exact "silent design decision" D-010 exists to
avoid. Acid Lime `#C6F135` is identical in both documents, so the accent is genuinely global.
**Alternatives rejected:** blending both into one token set (unusable, two bg values per
element); ignoring the studio document (loses the reference for Phases 5–6); adding a runtime
theme switch per route (scope creep for Phase 1).

### D-013 · `src/components/ui/form.tsx` written by hand — the shadcn registry item is empty

**What:** the `form` component was written directly instead of installed. Every other base
component (button, input, card, dialog, dropdown-menu, sonner, skeleton, tabs, table, badge,
label) came from `shadcn add`.
**Why:** `shadcn view form` resolves to `{"type":"registry:ui"}` with no files, and
`shadcn add form` exits 0 having written nothing (verified on CLI v4.21). The hand-written file
is the canonical shadcn form API — `FormField`/`FormItem`/`FormLabel`/`FormControl`/
`FormDescription`/`FormMessage` over `react-hook-form` — adapted to this repo's unified
`radix-ui` and `cn` imports.
**Alternatives rejected:** shipping Phase 1 without a form component (`plan.md` lists `form` as
a Phase 1 deliverable, and Phase 3 login/signup need it); pinning an older CLI that still served
the file (a dependency change for one component).

### D-014 · Flat route tree in Phase 1; no `(store)` group yet

**What:** routes live at `src/app/<route>` with no `(store)` route group, unlike the target
directory map in `ARCHITECTURE.md` §12. Navbar, footer and the error boundary therefore render
on every route, including `/checkout` and `/admin`.
**Why:** the group exists to give the storefront a different shell from the app shell (a
chrome-free checkout, a sidebar admin). Neither exists yet — `/checkout` is a placeholder and
`/admin` gets its layout in Phase 10 — so the group would be an empty abstraction with one
member. Splitting it later is a pure file move.
**Alternatives rejected:** creating `(store)/` now with every route inside it (a group that does
not change anything, and a move later anyway); hiding the chrome with per-route CSS (spookier
than a route group).

### D-015 · `next-themes` added and pinned to dark

**What:** `next-themes@^0.4.6` is a dependency, and `src/components/theme-provider.tsx` renders
`<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">`.
**Why:** the shadcn `sonner` component reads the theme from `next-themes`, and it is a Phase 1
deliverable ("toast (sonner)"). Forcing dark matches DESIGN.md's "Dark Canvas (Default)" and
removes an OS-dependent flash of the wrong canvas.
**Alternatives rejected:** editing `sonner.tsx` to hardcode `theme="dark"` (breaks the shadcn
file so a future `shadcn add` re-introduces the import); `enableSystem` (light mode would follow
the OS against the brand default).

### D-016 · Light canvas ships as an opt-in `.light` class, not a toggle

**What:** `globals.css` defines the prose light-canvas values under `.light`; nothing in the app
applies that class.
**Why:** DESIGN.md documents a light canvas as an alternative, so the tokens belong in the file,
but Phase 1 has no theme switch in scope and `plan.md` asks only for "dark theme tokens via CSS
variables".
**Alternatives rejected:** a light/dark toggle in the navbar (unrequested UI, and it would need
the Phase 3 session to persist the choice); omitting the light values (loses documented brand
work).

### D-017 · No git pre-commit hook; `format:check` and `lint` are the gate

**What:** no husky / lint-staged / pre-commit hook was added. Verification is
`lint → typecheck → test → build → format:check`, matching `AGENTS.md` §2.3.
**Why:** `plan.md` §2.3 lists "Prettier + pre-commit lint (`lint-staged` optional)" — the hook is
explicitly optional, and adding husky means three more dev dependencies plus a `.husky` directory
that `AGENTS.md` §3 wants justified in this file.
**Alternatives rejected:** husky + lint-staged (three dependencies to save one manual command;
Phase 13's GitHub Actions CI is the real enforcement point).

### D-018 · Placeholder segment is `/products/[id]`, renamed to `[slug]` in Phase 4

**What:** the Phase 1 detail placeholder is `src/app/products/[id]/page.tsx` and the catalog
placeholder links to `/products/<slug>`.
**Why:** `plan.md` Phase 1 names the route `/products/[id]`, while Phase 4 specifies
`/products/[slug]` because lookups are by slug. Phase 1 must build exactly what the plan says;
the rename in Phase 4 is a directory rename with no behaviour change.
**Alternatives rejected:** building `[slug]` in Phase 1 (deviates from the phase's own task
list); supporting both segments (two routes for one page).

### D-019 · Landing-page prices are display strings, not `formatCents`

**What:** the Phase 1 featured grid hardcodes `"$48.00"`-style strings. `src/lib/money.ts` and
`formatCents()` are Phase 4 work; no arithmetic happens on money anywhere in Phase 1.
**Why:** `AGENTS.md` §3 forbids floats for currency, which a display string trivially satisfies,
and Phase 4 owns the single formatting helper the catalog and cart will share.
**Alternatives rejected:** adding `formatCents` now (Phase 4 scope, and it would have no second
caller to justify its API); deriving prices from a cents constant (money math outside the
catalog's home).

### D-020 · Type-scale utilities are prefixed `type-*`, not `text-*`

**What:** the DESIGN.md type scale is exposed as `type-display-hero`, `type-headline-lg`,
`type-title-md`, `type-body-md`, `type-label-sm` and friends (declared with
`@utility` in `src/app/globals.css`), instead of Tailwind's default `--text-*` names.
**Why:** `cn` (the shadcn v4 helper) runs tailwind-merge. tailwind-merge cannot know custom
theme keys, so `text-title-md` was classified as an unknown **text colour** and, appearing after
`text-primary-foreground`, silently replaced it. Every element mixing a custom size token with a
colour lost its colour — the hero CTA rendered as a white pill with white text, and all
`text-muted-foreground` body copy fell back to the default foreground. The failure is invisible in
the DOM source and in typecheck, which is why it was caught by screenshotting the page rather than
by the test suite.
**Alternatives rejected:** dropping the type tokens and hardcoding `text-[64px]` everywhere
(lose the documented scale and readability); removing `cn` in favour of plain `clsx` (loses
conflict-free class merging that shadcn components depend on); configuring tailwind-merge with the
custom type scale (`cn` is a third-party package, so its config is not ours to extend).

### D-021 · The five product renders ship from `public/`, sourced from `docs/ui-reference/assets`

**What:** `public/products/{heavyweight-boxy-tee,luna-glazed-mug,structured-6-panel-cap,insulated-steel-bottle}.png`
(1024x1024) and `public/images/studio-scene.png` (1376x768) are the human-supplied product
photography, copied out of the reference pack and imported through `next/image`.
**Why:** the storefront cannot ship a hero or a collection grid without real product imagery, and
these are the renders the human provided for exactly that purpose. Keeping the originals in
`docs/ui-reference/assets/` preserves provenance; D-009's "never put the pack in `public/`" rule
still holds for the mockup _screens_, which were removed instead (D-022).
**Alternatives rejected:** generated SVG stand-ins (visually wrong next to real photography, and
the human has the real assets); hotlinking Supabase Storage before Phase 2 exists (nothing to host
them); shipping the mockup `screen.png` full-page captures as card images (a screenshot of a
screenshot).
**Known cost:** ~1.2 MB per source PNG. `next/image` serves optimised derivatives per request, and
Phase 4 replaces these with the product previews seeded next to each GLB model.

### D-022 · The superseded mockup pack was deleted

**What:** the four `stitch_vend3d_3d_storefront_customizer*` export folders (30 screen mockups from
the previous design generation) were deleted from `docs/ui-reference/`. What remains is
`DESIGN.md`, `DESIGN_STUDIO.md`, `HOMEPAGE.md`, `assets/` (the five renders) and a README.
**Why:** the human supplied a new storefront direction as full-scroll screens and asked for the pack
to be reduced to what those screens need, stating further screens arrive section by section as each
phase runs. Keeping ~9 MB of renders for a design that no longer exists invites the next agent to
build the wrong thing — the exact failure D-009 was written to prevent.
**Alternatives rejected:** keeping the screens under a `_superseded/` subfolder (still dead weight,
and the human asked for removal); keeping only the storefront screens (they are the ones the new
direction replaced).

### D-023 · The reviews section was cut from the landing page

**What:** the "Verified studio builds" block (4.9 summary card with distribution bars plus four
review cards) was removed; the page now runs hero -> precision -> collection -> steps -> stats ->
launch banner.
**Why:** the human's revision removed it. Reviews/ratings are also listed as out of scope in
`plan.md` §3, so a second, subtler reason applies: the launch banner already carries social proof
(5.0 (28) plus three testimonials), and duplicating it invites scope creep into a feature the plan
excludes.
**Alternatives rejected:** keeping a single testimonial strip to replace the section (the launch
banner already does this); keeping the section but hiding it (`hidden` markup that still ships).

### D-024 · The logo mark is the supplied bitmap, cropped; the wordmark stays live text

**What:** `public/brand/logo-mark.png` (376x409) is the isometric cube cropped out of
`docs/ui-reference/logo.png` by clustering the lime pixels into columns and keeping the widest
cluster (the cube, x 130-485), padded by 10px. `LogoMark` renders it through `next/image` at 22px
tall in the navbar and 24px in the footer. The wordmark next to it is live text: `vend` in the
primary text colour, `3d` in Acid Lime, Geist semibold with -0.03em tracking. The full lockup is
also kept as `public/brand/logo-lockup.png` for social/OG use later.
**Why:** an earlier hand-built SVG approximation was rejected by the human — the facet shading and
the black Y across the top face are brand artwork, not geometry worth approximating. Keeping the
wordmark as text means it inherits the font stack, stays selectable, scales cleanly and can be
translated; the mark itself is a picture because it is a picture.
**Alternatives rejected:** redrawing the cube in SVG (visually wrong, already attempted); using the
whole lockup as one image (loses selectable, translatable text and breaks at small sizes); tracing
the PNG into an SVG path by hand (no tooling, no benefit at 22px).

### D-025 · Never run `next build` while `next dev` is running

**What:** the verification chain must run `npm run build` with no dev server holding `.next`.
**Why:** two failures during Phase 1 looked like source bugs and were not. With a dev server
running, `npm run build` failed with `ENOENT .next/server/pages-manifest.json` and then, on a
clean `.next`, with `Cannot find module for page: /_document` while prerendering `/404` and
`/500`. Both are `.next` write races between the two processes; both disappeared once the dev
server was stopped and `.next` removed.
**Alternatives rejected:** separate build dirs per command (`distDir` juggling for a phase that
does not need it); ignoring the error (AGENTS.md §4: never paper over a failure).

### D-026 · Landing motion layer: framer-motion reveals + lenis smooth scrolling

**What:** every landing section is wrapped in a `BlurFade` reveal (the hero fades up on mount; the
other sections reveal on scroll via `inView` — 6px rise with a blur dissolve, ~0.4s ease-out, grid
rows lagging their headers by 0.08s), and a `SmoothScroll` provider mounted in the root layout runs
lenis inertial scrolling. Dependencies: `lenis@1.3.26` added (~33 KB unminified ESM + 0.5 KB CSS
before minification); `motion@14` was installed and then **removed** — the three registry components
that imported `motion/react` (`blur-fade`, `border-beam`, `number-ticker`) now import from
`framer-motion`, the animation library pinned in `plan.md` §1 and already installed at the same
`14.0.0`.
**Why:** `plan.md` §1 names framer-motion as the animation library, so the pinned stack wins over
the shadcn registry's newer `motion/react` import style — `motion` and `framer-motion` are the same
codebase at the same version, and carrying both would be two names for one library with no bundle
benefit (a one-line import swap per file). lenis is the one genuinely new dependency: client-only,
imported solely by `SmoothScroll`, and it refuses to start when `prefers-reduced-motion: reduce` is
set — silently overriding a user's scroll preference is exactly the kind of motion DESIGN.md's
restraint rules exist to prevent.
**Alternatives rejected:** keeping `motion` and dropping `framer-motion` (deviates from the pinned
stack for import-style vanity); CSS-only IntersectionObserver reveals (bespoke code for the same
effect, while framer-motion is already pinned for Phase 6 micro-interactions); running lenis
unconditionally (scroll hijack for reduced-motion users); per-section scroll listeners (reinvents
what lenis already does).
**Bundle:** `/` First Load JS is 233 kB per `next build` — under the 250 KB storefront guard, and
three.js still shares nothing with it (§6.5).

### D-027 · Seven registry components ship as unused inventory

**What:** `border-beam`, `hover-card`, `marquee`, `number-ticker`, `shimmer-button`, `slider` and
`tooltip` were added to `src/components/ui/` alongside `blur-fade`, together with the `--animate-*`
keyframes their animations need in `globals.css`. Only `blur-fade` is wired into the landing page;
the other seven are compiled and linted but rendered nowhere.
**Why:** each of the seven has no spec-compliant home on `/` today: `marquee` — the hero's spec
strip is static and a perpetually running marquee cuts against "Invisibility over Decor";
`shimmer-button` — homepage CTAs are `Link`-backed buttons per `HOMEPAGE.md`, and a shimmer implies
a loading state that does not exist there; `number-ticker` — spec'd figures must not first paint as
`0`; `border-beam` — an animated beam would spend Acid Lime as decoration (Accent Discipline);
`slider`, `tooltip`, `hover-card` — Phase 6 studio controls and general-purpose UI with no
`HOMEPAGE.md` slot. Keeping them means later phases place rather than repair them; forcing them
onto `/` just to "use" them would violate the mockup-as-contract rule.
**Alternatives rejected:** deleting them (each has a planned consumer and they cost nothing until
imported); wiring all eight into `/` (invents UI the supplied mockups do not show).

### D-028 · Prettier ignores the `.kilo` worktrees

**What:** `.prettierignore` gained `.kilo` (Kilo Code agent worktrees).
**Why:** `.kilo/worktrees/detailed-atrociraptor` is a separate checkout of this repo — a registered
git worktree, already kept out of `git status` by `.git/info/exclude` and its own nested
`.gitignore`. `npm run format:check` (D-017's gate) does not read git's ignore files and walked the
stale worktree, failing on source this repo does not own.
**Alternatives rejected:** deleting the worktree (it belongs to the human's other agent session);
fixing its formatting (overwritten, and not this repo's source); hard-coded pathspecs in the npm
script (fragile — `.prettierignore` is the tool's own mechanism).
