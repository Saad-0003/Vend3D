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

---

## Home page "Midnight atelier" refactor (visual redesign)

### D-029 · `--lime` reuses the shipped brand lime `#c6f135`, not the brief's `#C8F23D`

**What:** the redesigned home page's `--lime` token is `#c6f135` (the existing `--signal`), sampled
from the current hero/testimonial accents.
**Why:** the task explicitly allows this ("match the existing brand lime exactly… use that value if
it differs"). Using one lime keeps the redesigned sections harmonious with the untouched Navbar,
Testimonials and Footer, which already render `#c6f135`.
**Alternatives rejected:** the literal `#C8F23D` from the brief (creates two near-identical limes on
one page); recolouring the untouched shared sections to match `#C8F23D` (violates the hard scope rule).

### D-030 · Scoped tokens live in `globals.css` under a `.home-lux` class, not a `@theme` block

**What:** the "Midnight atelier" tokens/utility classes are defined inside `.home-lux { … }` in
`src/app/globals.css`; sections consume them via `bg-[var(--surface-1)]` etc.
**Why:** a global Tailwind `@theme` remap would rebind shared colour tokens (`--background`,
`--foreground`) and change how the Navbar / Testimonials / Footer render — forbidden by the hard
scope rules. Scoping to `.home-lux` (wrapped once around the page composition) guarantees zero
leakage. Tailwind v4 inlines `@import`ed local CSS poorly, so the tokens were inlined into
`globals.css` rather than kept in a separate imported file.
**Alternatives rejected:** a separate `home-lux.css` imported via `@import` (Tailwind v4/PostCSS
"Missing opening {" parse failure); a global `@theme` block (repaints protected sections).

### D-031 · Display serif loaded as `Instrument_Serif` via `next/font`, exposed only as `--font-instrument`

**What:** `layout.tsx` adds `Instrument_Serif` with `variable: "--font-instrument"`; `.home-lux`
display rules reference it. Headings previously rendered in Geist Sans because `--font-heading`
mapped to it — no serif was ever loading.
**Why:** the brief calls for an editorial serif that stays harmonious with the untouched sections.
Adding a font *variable* is additive and does not touch Navbar/Footer/Testimonials, which keep Geist.
**Alternatives rejected:** remapping the global `--font-heading` to the serif (would change shared
component headings); Fraunces (Instrument Serif is the brief's first choice and loads fine).

### D-032 · Old landing section files deleted once fully replaced

**What:** `components/landing/{hero,precision-grid,collection-grid,steps,stats}.tsx` were removed;
replaced by `components/home/*`. `launch-banner.tsx` (Testimonials) is untouched.
**Why:** the redesign replaces those sections 1:1; leaving dead components would be unused code. The
only importer was `app/page.tsx`, which now points at `components/home/*`.
**Alternatives rejected:** keeping the old files "just in case" (dead code, violates the
"delete only the old section markup you are replacing" instruction's intent); editing them in place
(mixes old and new styling).

### D-033 · `ResizeObserver` stub added to `tests/setup.ts`

**What:** the test setup now polyfills `ResizeObserver` alongside the existing `IntersectionObserver`
and `matchMedia` stubs.
**Why:** the redesigned home renders shadcn `Slider` (bento micro-demos) and `Tabs` (collection
filter), whose Radix primitives (`@radix-ui/react-use-size`) require `ResizeObserver`, absent in
jsdom. Without the stub the landing-page suite throws `ResizeObserver is not defined`.
**Alternatives rejected:** mocking per-test (repetitive, the whole suite shares the page render);
downgrading the components (loses required interactivity).


### D-034 · `docs/DESIGN.md` is the extracted system; the UI reference is demoted to history

**What:** added `docs/DESIGN.md` at the repo root, recording the tokens/type/shape/motion
actually shipped by the landing page (two token layers, Instrument Serif + Geist + Geist Mono,
`--card-radius: 28px`, `EASE [0.22,1,0.36,1]`, `framer-motion` 14 + `lenis` 1.3) plus the 13
binding global rules. `docs/ui-reference/DESIGN.md` and `DESIGN_STUDIO.md` stay as supplied
reference material but are explicitly **not** the contract.
**Why:** the mockups describe a Material-3 system (Space Grotesk, `#0e0e0e` canvas, `16px`
input radius, `#c8c6c2` surface tint) that no code implements. Reading them as the contract
produces screens that clash with the shipping Navbar/Footer. The root `DESIGN.md` also resolves
one factual conflict with the brief: the largest card radius in the code is `28px`
(`--card-radius`), with `36px` reserved for the 3D stage — there is no 40px radius anywhere.
**Alternatives rejected:** rewriting `docs/ui-reference/DESIGN.md` in place (it is human-supplied
reference and must never be reformatted per `AGENTS.md`); inventing a third token set for the
new screens (the storefront `:root` tokens already cover them).

### D-035 · Landing bento controls **moved** (not copied) to `components/studio/controls/`

**What:** `ColorDemo`, `MaterialDemo` and `DecalsDemo` in `src/components/home/precision-demos.tsx`
were moved to `HueColorControl`, `FinishControl` and `DecalDropzone` under
`src/components/studio/controls/`; `precision-demos.tsx` now just renders them. `EngraveControl`
(the `DEPTH: 0.12mm FIBER` chip from `docs/ui-reference/HOMEPAGE.md`) is new.
**Why:** rule 3 forbids a second slider/dropzone style, and the bento section is deleted in
prompt 01 — leaving the markup inside `home/` would have meant copying it into the studio. The
controls keep the landing behaviour by default (`decorative` hover-only, resets to brand lime on
pointer leave) and add an `interactive` mode (pointer drag, arrow keys, `role="slider"`,
`aria-valuetext`, `aria-live`) for real use. `DecalDropzone` additionally became functional:
PNG/JPG/SVG, ≤2 MB, validated client-side with the actionable message from `AGENTS.md` §8.
**Alternatives rejected:** copying the markup (two sources of truth, guaranteed drift);
rewriting the landing page to import from a new location without moving (leaves dead files
behind); replacing the bespoke hue/gloss bars with the shadcn `Slider` (different visual
language than the shipped bento demos).

### D-036 · Product card extracted to `components/ui/product-card.tsx` and re-exported on the landing page

**What:** the collection card moved to `src/components/ui/product-card.tsx` with a small additive
API (`href`, `className`, `index`); `home/collection.tsx` imports it unchanged.
**Why:** every later screen (`/products`, `/designs`, `/cart`, `/admin`) needs the identical card.
One behaviour change was made deliberately: the hover colour wash now reads `colorways[0]` instead
of a rotating `activeSw` index that only ever advanced on hover — visually identical at rest, but
deterministic and reusable outside the collection's own state.
**Alternatives rejected:** a `card` slot prop threaded through the collection component (still one
component doing two jobs); a wrapper that recomputed the classes (duplicate styling).

---

## /shop screen (prompt 02)

### D-037 · Hand-written `popover`/`select`, Dialog-based ⌘K search, catalog in `lib/catalog.ts`

**What:** `src/components/ui/popover.tsx` and `src/components/ui/select.tsx` were written by hand
over the installed `radix-ui` meta-package (the shape D-002/D-013 established) instead of
`npx shadcn add`. The ⌘K search surface is built on the existing `Dialog` primitive (roving ↑/↓
cursor, Enter to open, Radix focus trap) rather than a `cmdk` dependency. The catalog data lives in
`src/lib/catalog.ts` (`Product`, `listProducts()`, `priceBounds`, `allColorways`) as the shared
client source for the landing page and `/shop`, and `src/lib/catalog-query.ts` holds the pure
filter/sort/parse/serialise logic that the URL state drives. Prices stay integer cents end-to-end;
`formatCents()` in `src/lib/format.ts` remains the single UI-edge formatter.
**Why:** the `shadcn` CLI hangs on this machine's network (the registry fetch never responds), and
the screen could not ship without a Popover (desktop filters), a Select (sort) and a search surface.
The two hand-written files follow the installed CLI's own output shape (`data-slot` attributes,
`cn`, the `radix-ui` sub-path import) so a future CLI install stays recognisable and the files can
be diffed against upstream. `cmdk` was not added because AGENTS.md §3 forbids new dependencies
without a logged justification, and the required behaviour is ~40 lines over a primitive the repo
already ships (D-027's inventory discipline). `lib/catalog.ts` is one client source so the landing
grid and the archive can never disagree; Phase 4 replaces the body of `listProducts()` with a
Prisma query and every consumer keeps working because the data already speaks cents.
**Alternatives rejected:** retrying `npx shadcn add` until the registry responds (network is
offline; no amount of retrying helps); adding `cmdk` for the command palette (a dependency plus
bundle cost for behaviour the Dialog primitive already covers); per-screen product arrays (the
drift D-036 exists to prevent); caching the registry response by hand (fighting the tool instead
of matching D-013's precedent).

### D-038 · Lux token selectors widened from `.home-lux` to `:is(.home-lux, .lux)`

**What:** the token block and every `.lux-*` utility selector in `src/app/globals.css` now match a
plain `.lux` class as well as `.home-lux` (`:is(.home-lux, .lux) …`), while only `.home-lux` paints
its own canvas (`background-color` / `color`). The shared primitives (`PageHeader`, `PageShell`,
`ProductCard`, `SectionSkeletons`, the studio controls) therefore render identically on content
routes; `/shop` carries `className="lux"` and inherits the storefront body background so the
header/footer keep their tokens.
**Why:** D-030 scoped the lux tokens to `.home-lux` so the redesign could not repaint the protected
Navbar / Testimonials / Footer, and that guarantee still holds — those sections carry neither class.
But `/shop` needs the same primitives, and the alternatives were either a second copy of every
primitive or a second copy of every token, both of which are the drift D-035/D-036 were logged to
prevent. Widening the selector keeps one source while the protected sections stay untouched.
**Alternatives rejected:** moving the tokens into a global `@theme` block (D-030's already-rejected
option — repaints shared sections); duplicating the primitives under a second class (two sources of
truth); copying the token block into a separate `.lux` scope (two values to keep in sync);
recolouring the shared components to the storefront tokens (a visible redesign of protected
sections, forbidden by DESIGN.md rule 4).



## Studio engine (prompt 03)

### D-039 · One studio screen driven by `lib/products/config.ts`

**What:** `StudioScreen` renders every product. Sections, scroll-spy chips, decal zones, engrave
fonts, extras and the details accordion all come from a `ProductConfig` entry. No component
branches on the slug. Four entries ship (tee, mug, cap, bottle), seeded from `lib/catalog.ts` so
name, price and swatches cannot drift from the shop.
**Why:** prompts 03a–03d add products by data alone; per-product components would multiply the
maintenance cost of the same behaviour.
**Alternatives rejected:** a component per product (duplicates the sidebar four times); reading
the config from Prisma now (Phase 4 has not landed, and the catalog already speaks cents).

### D-040 · Zustand stores keyed by slug; configuration persisted per slug

**What:** `getConfiguratorStore(product)` returns one store per slug, with `history`, `quantity` and
`hydrated`. Only the present configuration is written to `localStorage` under
`vend3d-configurator:<slug>`. History is not persisted. `init()` runs after `persist.rehydrate()`
and applies `?color=` on top.
**Why:** switching products must never leak colours or decals across products, and undo history
across a reload would be confusing.
**Alternatives rejected:** one global configurator store with the slug as a field (cross-product
leakage risk); persisting history (large and not requested).

### D-041 · Cart and designs are client mirrors until Phases 7 and 8

**What:** `stores/cart-store.ts` and `stores/designs-store.ts` persist to `localStorage`. The cart
line stores `unitCents` as a snapshot at add-time. Thumbnails are PNG data URLs captured from the
canvas.
**Why:** the studio needs working add-to-cart and save flows now. The server contracts land in
Phases 7 and 8; these stores are the drop-in client side.
**Alternatives rejected:** server actions before the schema exists (would invent Phase 7/8 tables).

### D-042 · Placeholder model when the GLB is missing or fails to load

**What:** `useModelSource` issues a HEAD request for the GLB with a 20s abort. Missing or slow files
resolve to `placeholder`. A GLB that exists but fails to parse is caught by `GlbErrorBoundary`,
which renders the same placeholder. The stage shows a "Placeholder model" badge in both cases.
**Why:** the owner supplies GLBs later; the page must work without them and must never crash on a
bad file.
**Alternatives rejected:** blocking the page until a model loads (the owner has not supplied files,
so the page would never render).

### D-043 · Shared `FinishControl` and `HueColorControl` no longer reset on pointer leave when interactive

**What:** both controls committed a default (matte 30, lime hue) on `onPointerLeave` in every mode.
Now the reset runs only when `interactive` is false, so the landing page keeps its hover-reset
behaviour and the studio keeps the user's value.
**Why:** a studio change must not vanish when the cursor leaves the bar.
**Alternatives rejected:** a separate studio control (two controls for the same job, which the
DESIGN.md rule 3 forbids).

### D-044 · Switch, ToggleGroup and Accordion wrappers hand-written

**What:** `components/ui/switch.tsx`, `toggle-group.tsx` and `accordion.tsx` follow the same
`data-slot` and `radix-ui` sub-path shape as `popover.tsx` and `select.tsx` (D-037).
**Why:** the shadcn CLI cannot reach its registry from this machine (D-037), and the studio needs
all three. Radix already ships each primitive; no new dependency.
**Alternatives rejected:** adding a second Radix package (AGENTS §3 requires logging a new dependency).

### D-045 · `/customize/[productId]` redirects to `/products/[id]`

**What:** the customize route forwards to the product route and keeps the query string.
**Why:** the studio has one URL. Two screens would drift.
**Alternatives rejected:** rendering the studio from both routes (duplicate screens, duplicate
metadata).

### D-046 · Decals are validated, not uploaded

**What:** PNG/JPG/SVG under 2 MB, validated client-side by `DecalDropzone` (its existing rule).
The prompt asked for 5 MB; I kept the 2 MB rule already in `DECAL_MAX_BYTES` and plan.md §Phase 5.
Artwork is an object URL held in memory (`lib/products/decal-assets.ts`) and is not persisted.
**Why:** plan.md is the contract, and the existing validator already enforces it. After a reload the
user re-uploads artwork; the persisted configuration keeps only the decal settings.
**Alternatives rejected:** raising the limit to 5 MB (conflicts with plan.md; logged here so the
owner can decide).

### D-047 · Price is the base catalog price

**What:** the footer total is `unit price × quantity` in integer cents. No add-on fees.
**Why:** plan.md defines no add-ons (prompt rule: do not invent add-on fees).

### D-048 · `/checkout` ships as a client island with a client order store

**What:** the prompt's three-step checkout (Details → Payment → Review) with the demo card is
built as a client component tree: `components/checkout/*`, driven by pure helpers in
`lib/payment/card.ts`, `lib/checkout/{schemas,shipping,address,order}.ts`, and a persisted
`stores/orders-store.ts` reachable at `/order/[id]`.

Three deviations from plan.md Phase 9 as written, all forced by phases that are not built yet
(Phase 2's schema, Phase 3's auth, Phase 8's server cart):

1. **Order records live in a zustand persisted store, not the DB.** Phase 2's `Order` table and
   Phase 9's `placeOrder` server action do not exist, and `src/server/` is empty. The store keeps
   Phase 9's exact contract (id, snapshotted items + address, integer-cent totals, status,
   `checkoutKey`) and its idempotency rule, so the swap is a store-body change (D-041).
2. **`status` is `"Placed"`, not `PAID`.** The prompt's word; `PAID` belongs to the enum the
   migration will define, and `placeOrder` remains the only writer then. Logged so the mapping is
   deliberate rather than an oversight.
3. **Confirmation is `/order/[id]`**, the prompt's route, instead of `/checkout/success?order=`
   from plan.md. It is read-only: it only reads a record `placeOrder` already wrote.

Shipping prices are placeholders ($0 / $9.00) marked `TODO(Phase 9)` in code and on screen
("Placeholder rates — plan.md sets no shipping rule yet."), because plan.md defines no shipping
rule and inventing carrier prices would be scope the prompt forbade.

Card data is held only by the payment step's own `useForm`, and that step resets its form on a
valid submit, so number/expiry/CVC cannot outlive it — the screen keeps brand + last4 and nothing
else, matching plan.md's "Card data stays in the browser".

**Why:** build the whole shopper-visible flow now without inventing a backend, and keep every
seam (field names, idempotency, totals) so Phase 9's server work replaces bodies, not callers.

**Alternatives rejected:** a `placeOrder` server action with a stubbed DB (needs Phase 2); keeping
the old placeholder screen (the prompt replaces it); inventing courier rates.

#### D-048 addendum · localStorage quota hardening (review finding, fixed)

**What:** the orders store persisted the whole order, including `thumbnail` — a full-canvas
`canvas.toDataURL("image/png")` that is commonly megabytes at the studio's `dpr`. The ~5 MB origin
quota is shared with `vend3d-cart` and `vend3d-designs`, which already hold the same data URLs.
When `setItem` threw `QuotaExceededError`, it propagated *after* the order had been written to
memory: the cart never cleared, `/order/[id]` was never reached, and every retry failed the same
way because `checkoutKeyRef` is committed before the call.

**Fix:** `persistedOrders()` strips thumbnails from what is written (`JSON.stringify` drops
`undefined`, so no data URL is ever stored), and a `safeStorage` wrapper swallows write errors so
persistence failure degrades to an in-memory order instead of an exception. `OrderItem.thumbnail`
became optional; `/order/[id]` falls back to the product image, the same fallback the cart already
uses for an uncaptured snapshot. `clearCart()` is guarded in the checkout screen, so a cart
persistence failure cannot turn a placed order into an error message.

**Why:** losing reload durability is recoverable; failing an order that already succeeded is not.

**Alternatives rejected:** letting the error surface (reproduces the dead-end); downscaling the
thumbnail with canvas work inside `lib/checkout/order.ts` (breaks the purity the 100%-coverage
threshold on `src/lib/**` depends on).

### Open items (not done in this prompt)

- **Phase 3's server half is still unwritten.** `src/middleware.ts` (session refresh + route
  protection for `/cart`, `/checkout`, `/orders`, `/designs`, `/admin`), `requireUser()` /
  `requireAdmin()` in `src/server/auth.ts`, the idempotent Profile upsert on first login, the admin
  403 gate, graceful session expiry, and Google OAuth. The mock's sign-in is browser-local, so
  nothing here survives a reload on another device.
- `/checkout`, `/cart`, `/orders` and `/designs` are **not yet route-guarded**. plan.md Phase 3
  puts `/checkout` behind auth; guarding it now would break the guest demo checkout the earlier
  prompt built and shipped (and its passing e2e flow), so the guard is deferred to the middleware
  work above rather than added as a client-side half-measure.
- **Server-rendered forms and hydration timing.** Auth, checkout and order forms attach handlers
  only after hydration, so a click that lands in that window is a no-op. `AuthForm` removes the
  native-submit escape hatch and gates its button; the other forms still use `onSubmit` and should
  get the same treatment when Phase 3 touches them.
- `lib/cart`, `lib/products` and `lib/designs` are below the coverage thresholds (`cart-store`,
  `config.ts`, `library.ts`); `src/lib/auth/**` and `src/stores/auth-store.ts` are at 100%.

- `placeOrder` server action, price recomputation from the DB, auth + rate limiting, and the
  `PAID`/`DEMO_CARD` enum — Phase 9's server half, blocked on Phase 2.
- **`OrderRecord` is a superset of ARCHITECTURE.md §5's `Order` table.** The prompt required
  address, subtotal, shipping and `shippingMethodId` in the order record; §5 defines only
  id/userId/status/totalCents/checkoutKey/paymentMethod/cardBrand/cardLast4/createdAt. Phase 9 must
  either extend `Order` with those columns or move them to a shipping-address table — and add the
  `userId` FK (no auth exists yet) and `paymentMethod`. Logged now because it is a requirement that
  contradicts the schema, not something to discover mid-Phase-9.
- `/checkout/success`, `/checkout/cancelled` and `/orders` history remain out of scope here; the
  phase's plan.md checkboxes stay unchecked until Phase 9 is complete.
- The order is not emailed (plan.md documents the confirmation email as a stub), and orders are
  per-browser until the server holds them.
- `/checkout` adds ~24 kB route-local JS (react-hook-form + zod) over `/cart`; three.js stays out
  of the graph, so the customizer budget is untouched.
- **Cart drawer Checkout link intermittently did not navigate** (link takes focus, drawer stays
  open, nothing happens — reproduced ~1 in 3 with no load). This was the same hydration mismatch
  as D-050, not a Radix animation problem as first guessed; the drawer's link is one of the links
  that lost hydration. Fixed by D-050.
- **`/cart` and `/products/[id]` log the LCP warning** — their product `next/image` has no
  `priority`, so Next asks for it on the above-the-fold thumbnail. Dev-only, no test catches it.
  `/order/[id]` was fixed in this prompt (same class).

### Review findings left open (chose "fix critical only")

From the `/review uncommitted` pass, four non-blocking findings were deliberately left:

- `src/lib/checkout/order.ts:115` — `sortOrdersNewest` is exported with no production consumer
  (only its own test uses it); the store already prepends newest-first.
- `src/components/order/order-screen.tsx:29` — reads with an inline `orders.find()` instead of the
  store's `findOrder` action, leaving that action production-dead with its logic duplicated.
- `src/components/order/order-screen.tsx:93` — the order line-item and totals rows are duplicated
  in `order-summary-card.tsx` (~40 lines of identical JSX, including a verbatim chip class string),
  and the two copies have already drifted on how shipping is displayed.
- Unused exports introduced: `CheckoutStepId` (`checkout-progress.tsx`), `CARD_NUMBER_LENGTH`
  (`card.ts`), the `ORDER_STATUS` re-export (`orders-store.ts`), `toOrderItems` (`order.ts`).

### Carried over from earlier prompts (still open)

- Real GLBs are not present. Models come from `public/models/*.glb` when the owner adds them.
- `docs/assets` poster image is missing, so the loading state uses a skeleton instead of a poster.
- Cart drawer and bag-icon fly-to animation are not built; the toast opens the drawer state.
- "You may also like" uses the catalog; per-product cards reuse `ProductCard` unchanged.
- Responsive checks at 390, 768, 1024, 1440 and 1920 have not been run in a browser yet. (This
  prompt verified 1440 by hand and 390 in a mobile emulator.)

### D-049 · `/order/[id]` redesigned as a centred confirmation page

**What:** the prompt replaced the two-column confirmation with a calm centred column (640px):
a self-drawing SVG tick in a lime-glow ring (`pathLength`, ~900ms, no confetti, opacity-only under
reduced motion), serif H1 "Your order is in production.", muted "A demo confirmation, no real charge
was made.", the order number in mono, a fulfilment stepper (Placed → Proofing → Production →
Dispatched, horizontal from `sm`, vertical below) with "Dispatch within 48 hours", one Order
summary card holding items + config chips + address + totals, and the CTAs Back to shop `/shop`,
View designs `/designs`, Print receipt (browser print). The old "Thank you." / lime "Order placed"
panel, the right-hand sticky card and the "Back to cart" CTA are gone.

**Why:** the prompt's layout. The copy also drops the old screen's implication that anything was
taken, and the stepper gives the demo a production narrative without inventing a fulfilment
status field the order record does not have — only "Placed" is attested, so the other three stages
stay dim rather than claiming progress.

**Alternatives rejected:** deriving stage progress from `status` (the record has one value);
confetti or a looping animation (the prompt forbade it; DESIGN.md §1 keeps motion quiet).

### D-050 · `PageShell` and hero `initial` no longer branch on reduced motion

**What:** `PageShell` and `home/hero.tsx` computed `initial` from `useReducedMotion()`
(`reduced ? {opacity: 0} : {opacity: 0, y: 8}` / `y: "110%"`). `useReducedMotion()` resolves the
preference **synchronously on the client** (it seeds state from `matchMedia`) but cannot on the
server, so a reduced-motion visitor hydrated with a *different* style than the server rendered.
React logs "A tree hydrated but some attributes … didn't match", refuses to patch the subtree, and
the shell's contents lose hydration — which is why links inside it intermittently did nothing on
click. It reproduced 1-in-3 with no load on `/cart`'s Checkout button, and it hit every content page.

The initial style is now the same on both sides; the preference lives in the transition instead
(`duration: reduced ? 0 : 0.85`), which is SSR-safe and still skips the motion.

**Why:** it was the root cause of two flaky e2e failures, not a test-only problem: real shoppers
with `prefers-reduced-motion: reduce` were meeting dead links on the storefront's shell. Verified
after the fix: hydration is clean on `/`, `/shop`, `/cart` and `/order/[id]` in both motion modes,
`/cart`'s Checkout navigates, and the hero still rises 110% → 0% for everyone else.

**Alternatives rejected:** branching only inside `animate` (the mismatch is in `initial`, so it
would still mismatch); `suppressHydrationWarning` (silences the warning without restoring
hydration); detecting the preference on the server (impossible without a cookie round-trip).

**Scope note:** `checkout-screen`, `step-error`, `cart-button`, `shop-screen` and
`studio-section-card` carry the same `initial={reduced ? …}` shape, but each renders *after*
hydration (inside `AnimatePresence`, on interaction, or on error) so none of them mismatches today.
They are flagged in the open items below so the next person does not copy the pattern.

### D-051 · Auth UI built against a swappable `AuthService`

**What:** the prompt's auth surface — `AuthDialog` (Radix Dialog; Radix `Tabs` `variant="line"` for
the sliding underline, floating-label fields, lime pill, ghost "Open full page"), `/login` and
`/signup` as a 50/50 split (dark stage with the slowly rotating poster and the serif "See it. Shape
it. Own it." on the left; form Card on the right, stage `hidden lg:block` so mobile gets just the
form), and `/account` as the guarded landing page. Navbar wiring only: signed out opens the dialog,
signed in opens the Account / Designs / Orders / Sign-out Popover, plus the "Welcome back." toast.

**Why an interface rather than direct Supabase:** plan.md defines the approach (Supabase Auth,
`middleware.ts`, `requireUser()` / `requireAdmin()`, a Profile row), but Phase 2's schema and Phase
3's wiring do not exist — there is no `prisma/`, no `src/server/`, no `src/middleware.ts`. So
`src/lib/auth/service.ts` declares that contract (`AuthService`) and implements it as a
browser-local mock; the store and every component speak only the interface, so Phase 3 replaces one
module rather than every caller.

The mock **never stores a password** — not even a hash. Rehearsing "keep the credential in the
store" would be exactly the habit the real swap has to un-learn, so the mock establishes that an
account exists rather than checking a secret.

**Two decisions worth recording:**

- **Sign-in and sign-up use different existence messages, deliberately.** Wrong credentials return
  "Incorrect email or password." for both an unknown email and a wrong password, so the form is not
  an account-enumeration oracle; sign-up must be unambiguous ("already exists"), which is the
  trade-off plan.md Phase 3 sanctions.
- **The auth form has no native submit path at all.** The button is `type="button"` and Enter is
  handled explicitly, because on a client-side navigation React attaches the form's `onSubmit` only
  once hydration finishes — and a click in that window performs a native **GET** submit, which puts
  the password straight into the URL (verified reachable via `/login` → "Create one"). The e2e spec
  pins this. `/login` and `/signup` also link to each other with plain `<a>` for the same reason: a
  soft navigation can leave the target form non-interactive for a beat.

**Navbar carries no `useSearchParams()`** — the hook needs a Suspense boundary and this island
renders on every route, including the statically generated ones (it broke `next build` on
`/account`). The `?next=` contract belongs to the full pages, which read `next` server-side and
re-sanitise it. `/account` is guarded client-side by `RequireAuth` (redirect to `/login?next=`,
return after), which is a convenience until `middleware.ts` exists — plan.md Phase 3 is explicit that
only middleware can be trusted.

**Alternatives rejected:** calling Supabase with a stubbed DB (needs Phase 2); storing a password to
make the mock "work" (rehearses a real anti-pattern); server actions for the mock (there is no
`src/server/` yet).

### D-052 · Local e2e runs are serial (dev-server route compilation is the bottleneck)

**What:** `playwright.config.ts` now runs `workers: 1` — the same value CI already used — so a
local `npm run test:e2e` executes one test at a time. The webServer is still `npm run dev`.

**Why:** the suite failed 5 of 58 in ways that looked like product bugs but were not. `next dev`
compiles each route on its first hit and those compiles are CPU-bound and serial per route; on this
machine `/customize/[productId]` alone is 3.8s over 3719 modules. When two browsers cold-hit
different routes at once they starve each other, and a starved navigation is indistinguishable
from a broken one: `router.push` waits on a flight payload that never arrives (sign-up had clearly
completed — the navbar showed the signed-in "Account menu" — while the URL sat on `/signup`), the
cart's plain `<Link href="/checkout">` click "did nothing", or hydration never landed and the
submit button stayed disabled for the whole timeout. The failing test changed between runs at the
same worker count, which is the giveaway.

Confirmed with instrumented runs rather than by guessing: the dev server log shows exactly one
compile per route with no watcher churn, first hits costing 2-6s and later hits 100-800ms. The
checkout spec already mitigates this on purpose — it seeds the cart through an init script because
"compiling it in every parallel worker starves the rest of the suite" — so serialising the suite is
the same fix applied to the runner instead of to one spec.

**Alternatives rejected:** raising the `test.slow()` budgets (hides a real resource limit and slows
everyone's runs); pointing the suite at a production build (the genuinely deterministic option, but
it changes every run's semantics and the specs were written and verified against dev); a local
retry (D-050's lesson — retries hide causes, and the repo already documents them as masking).

### D-053 · Portalled surfaces carry `lux` themselves

**What:** `lux` added to the className of the portalled contents that consume lux tokens —
`auth-dialog.tsx`, `account-menu.tsx` (auth), `designs-screen.tsx` (two Selects, the card
DropdownMenu and the delete Dialog) and `studio-footer.tsx` (save-design Popover).
`search-dialog.tsx` already did this, so it was the convention, not a new pattern.

**Why:** the lux tokens (`--surface-1`, `--hairline`, `--ivory`, `--card-radius`,
`--inner-highlight`) are scoped to `.home-lux, .lux` (D-030, deliberately, so nothing leaks to the
Navbar/Footer/Testimonials). Radix Dialog/Popover/Select/DropdownMenu render through a portal at
`document.body` — outside every `.lux` ancestor. Every `var(--…)` on those nodes therefore resolved
to nothing: `background-color` came out `rgba(0, 0, 0, 0)` (the login dialog was, per the human,
"totally transparent"), the border and `--inner-highlight` ring vanished, the 28px/16px radii
collapsed to `0`, and text colours fell back to inheritance. The markup stayed perfect, which is why
typecheck, lint and every DOM-based e2e assertion were blind to it — only computed style exposes it.

**Alternatives rejected:** moving the tokens to `@theme`/`:root` (fixes all eight at a stroke but
discards D-030's scoping guarantee, so the palette becomes global); duplicating hex values at each
call site (drifts from the palette); a `.lux-scope` alias class (a second name for one thing).
A comment in `globals.css` now states the portal rule, and an e2e test asserts the computed
background of the auth dialog and the account menu so the regression cannot come back silently.

### D-054 · `/account` is a shell, and `Tabs` now forwards `orientation`

**What:** `/account` rebuilt as a five-panel shell (Profile · Orders · Saved designs · Addresses ·
Settings) behind a vertical tab list that collapses to a scrolling chip row below `lg`. The header
greets the shopper by first name. Orders and Saved designs read the same client stores their full
screens use, so they show real data; Profile, Addresses and Settings hold local state only, and
"Delete account" clears the local stores and signs out. `DesignCard` moved out of
`designs-screen.tsx` into `components/designs/design-card.tsx` so both screens share one card.

**Why:** the prompt asked for the shell and the UX only, with the backend left to later phases, so
nothing here invents persistence — the panels are honest about it in their own copy. Sharing
`DesignCard` follows DESIGN.md rule 3 (never a second card style) and keeps the library and the
account grid from drifting.

The tab list also exposed a bug in the shared primitive: `components/ui/tabs.tsx` destructured
`orientation` and passed it only as a `data-orientation` attribute, so Radix never received it. The
tablist therefore kept `aria-orientation="horizontal"` and roving focus kept moving left/right
inside a vertically stacked list — the arrow keys simply did nothing on desktop. `orientation` now
reaches the primitive as well as the attribute, which is what the shadcn wrapper meant to do.

**Alternatives rejected:** a persisted account store for the mock (the shell does not need one, and
it would have to be torn out in Phase 3); copying the design card into the account panel; keeping
horizontal arrow keys on a vertical list to avoid touching a shared primitive.
### D-055 · One informational template, and the tables are a plain grid

**What:** `/how-it-works`, `/materials`, `/cad-specs`, `/production-times`, `/warranty` and
`/contact` are six pages assembled from one template (`components/info/info-page.tsx` + a block
renderer), with a `/reviews` placeholder behind the testimonials link so nothing 404s while the
reviews grid waits for its own pass. Footer hrefs, the testimonials "See all reviews" target and the
newsletter "Join" were wired; all three diffs are href/handler lines only.

**Why:** the template keeps six pages on one layout (DESIGN.md rule 3) and makes the seventh a data
file. Its copy is generated from `productConfigs` rather than retyped, so `/materials` and
`/cad-specs` cannot drift from what the studio actually offers. Anything the site does not state —
warranty length, certifications, carriers, contact addresses — ships as a styled
"TODO: confirm with owner" note instead of invented copy.

**Alternatives rejected:** a shadcn `Table` with class overrides (it carries fills and row hover that
this spec forbids, so fighting it would be worse than the 40-line block); six bespoke page layouts;
filling the gaps with plausible marketing copy. The doc tables use `border-collapse` with a 1px
border on every cell, which is what makes a Word-like grid without doubled lines.

### D-056 · Legal pages are templates, and every gap is marked

**What:** `/privacy`, `/terms` and `/shipping-returns` on the same `InfoPage` template. `InfoPage`
gained two optional props — `notice` (rendered under the header) and `closingNote` (rendered after
the sections) — so a page can end in a line of links instead of the CTA band; the six
informational pages are untouched because `closing` stays optional. The draft banner and the
`Last updated: [date]` line live in `info-blocks.tsx` as `LegalDraftNotice`/`LegalUpdatedLine` so
the three pages cannot drift. `InfoLink` gained a `newTab` flag for links that sit inside a label.

Two link surfaces now exist as specified: the checkout review step's checkbox label reads
"I agree to the Terms of Service and Shipping & Returns" with both phrases opening in a new tab,
and the sign-up form carries "By creating an account you agree to the Terms of Service and Privacy
Policy" (sign-up only — sign-in has nothing to agree to). The cart-seeding helper moved to
`tests/e2e/seed-cart.ts` so the checkout and legal specs share one seed shape instead of two.

**Why:** the prompt is explicit that these are templates, so nothing invents a jurisdiction, a
refund window, a duration or a registration detail. Every one of those is a marked
"TODO: owner to confirm" note, `[Company legal name]` and `[Effective date]` stay as visible
placeholders, and each page opens with the reviewer's banner. A plausible-looking but invented
liability clause is worse than an obvious hole, because it looks finished.

**Alternatives rejected:** three bespoke page layouts (rule 3 — one template); a second inline-link
style for the label links; softening the TODO notes into vague prose that reads as settled policy.

### D-057 · Static demo reviews page

**What:** `/reviews` is a full-length page using one centralized demo review data file. The
three existing testimonial quotes remain verbatim; twelve supplied demo entries are appended.
The route labels its score and count as illustrative and unverified. The testimonials band's
"See all reviews" link opens the route in a new tab, "Launch Your Canvas" links to `/studio`, and
the per-card "Read all" links remain unchanged.

**Why:** the owner explicitly approved this one-off exception to `plan.md` Appendix A's
out-of-scope reviews/ratings rule. The copy is demo data, not asserted customer evidence.

**Alternatives rejected:** leaving `/reviews` as a placeholder; implying the sample copy is
verified feedback; changing the existing testimonial cards or their "Read all" behavior.

### D-058 · Route-level skeletons are one shared vocabulary, proven in jsdom

**What:** `components/ui/route-skeletons.tsx` holds one skeleton per page (`ShopPageSkeleton`,
`StudioHubPageSkeleton`, `DesignsPageSkeleton`, `AccountPageSkeleton`,
`StudioProductPageSkeleton`), each in two layers: a body block the screen itself can render around
its own header (`/studio` and `/account` do, while their client stores hydrate) and a page block the
route's `loading.tsx` owns. `studio-screen.tsx` and `account-screen.tsx` now import the shared
blocks instead of carrying private copies. `/products/[id]`'s Suspense fallback became the stage
shape instead of a product grid, which was the wrong layout for that route. The 404 and error stages
were rebuilt to the requested shapes, and `OfflineNotice` reuses `ErrorState`.

**Why:** a skeleton that reserves different geometry from the page it stands in for is the thing
that causes layout shift, so the shapes are asserted against the real screens' classes rather than
eyeballed. They are built from raw `Skeleton` blocks rather than `SectionSkeletons` so each one
carries exactly one `role="status"` — nesting a second one inside the first announces the pending
load twice.

**Alternatives rejected:** asserting the route-level `loading.tsx` from Playwright. It is not
observable in this app: Next renders nothing new until the flight response starts streaming, so a
held request just keeps showing the old page, and an aborted request is silently recovered from the
prefetch cache (both verified against `/shop`). Forcing it with network tricks made the test flaky,
which AGENTS.md forbids, so the contract is proven in `tests/unit/route-skeletons.test.tsx` where
it is deterministic. Also rejected: adding a `role="alert"` beside `ErrorState`'s own (it double-
announces), and a second shimmer animation on `Skeleton` — the house primitive is the documented
`animate-pulse` (DESIGN.md §5), so "shimmer, no spinners" is satisfied by reusing it.