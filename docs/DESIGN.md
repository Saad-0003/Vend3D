# Vend3D — Design System (extracted from the shipping landing page)

> **Source of truth = the code, not the mockups.** Every value below was read out of
> `src/app/globals.css`, `tailwind` config, `src/app/layout.tsx` and the landing
> components under `src/components/home/*`, `src/components/shared/*` and
> `src/components/landing/*`. Where this file and `docs/ui-reference/DESIGN.md`
> disagree, **this file wins** (the mockups describe an older Material-3 system that
> the landing page does not implement — see `DECISIONS.md` D-010 / D-030 / D-031).
>
> Read `AGENTS.md`, `ARCHITECTURE.md` and `plan.md` before writing code.

---

## 1. Two token layers — know which one you are in

The repo carries **two parallel token sets**. Using the wrong one is the most common
styling mistake in this codebase.

| Layer | Where | Consumed as | Who uses it |
| --- | --- | --- | --- |
| **shadcn / storefront** | `:root` in `globals.css` (`--stage`, `--deck`, `--glass`, `--signal`, `--on-signal`, `--primary`, …) | Tailwind utilities `bg-background`, `text-muted-foreground`, `bg-signal`, `type-*` scale | Navbar, Footer, Testimonials (`launch-banner`), every `/products`, `/cart`, `/checkout`, `/orders`, `/login` route, all `components/ui/*` |
| **"Midnight atelier" (`.home-lux`)** | `.home-lux { … }` in `globals.css` | arbitrary values `bg-[var(--surface-1)]`, `text-[var(--ivory)]`, plus `lux-*` utility classes | Home page only, wrapped once in `src/app/page.tsx` |

`.home-lux` exists so the redesign could not repaint the protected Navbar / Testimonials /
Footer (`DECISIONS.md` D-030). **Never move these tokens into a global `@theme` block.**

New screens (studio, designs, cart, checkout, admin) belong to the **shadcn/storefront
layer** and use the `.home-lux` tokens only where a primitive explicitly documents it.

### 1.1 Storefront tokens (canonical for new screens)

| Token | Value | Role |
| --- | --- | --- |
| `--stage` | `#0a0a0b` | page background (`--background`) |
| `--deck` | `#121214` | card surface (`--card`) |
| `--glass` | `#1a1a1d` | elevated / frosted surface (`--muted`, `--popover`) |
| `--signal` | `#c6f135` | Acid Lime — accent only |
| `--on-signal` | `#0a0a0b` | text on lime |
| `--primary` / `--primary-foreground` | `#f2f0eb` / `#0a0a0b` | ivory primary button |
| `--foreground` | `#ededed` | text primary |
| `--muted-foreground` | `#7c7c82` | text muted |
| `--secondary` | `rgba(255,255,255,0.06)` | glass pill fill |
| `--border` / `--input` | `rgba(255,255,255,0.08)` | hairline borders |
| `--ring` | `rgba(237,237,237,0.28)` | focus ring |
| `--destructive` | `#ffb4ab` | error text |
| `--radius` | `1rem` | base radius (`--radius-sm 0.6×`, `md 0.8×`, `lg 1×`, `xl 1.4×`, `2xl 1.75×`, `3xl 2×`, `4xl 2.6×`) |

Class helpers: `.glass-panel` (frosted Level-2 panel), `.hairline-t` (1px top rule),
`.tabular` (tabular numerals). `.light` is an opt-in alternative canvas — **do not use it**;
the app ships `class="dark"` on `<html>`.

### 1.2 Midnight-atelier tokens (`.home-lux` only)

| Variable | Value | Notes |
| --- | --- | --- |
| `--ink` | `#0a0a0b` | page background of redesigned sections |
| `--surface-1` | `#101012` | card surface / band background |
| `--surface-2` | `#17171a` | recessed stage, hover chip, active tab pill |
| `--surface-3` | `#1f1f23` | slider track |
| `--hairline` | `rgba(255,255,255,0.08)` | 1px border |
| `--hairline-strong` | `rgba(255,255,255,0.14)` | hover border |
| `--ivory` | `#f3f0e8` | text primary / primary button fill |
| `--muted` | `#8c8c93` | text muted |
| `--faint` | `#5a5a61` | slider end labels |
| `--lime` | `#c6f135` | identical to `--signal` (deliberate, see globals.css comment) |
| `--lime-glow` | `rgba(198,241,53,0.18)` | spotlight / dropzone hover / hero orb |
| `--brass` | `#b9a877` | PMS readout only |
| `--card-radius` | `28px` | big cards |
| `--inner-radius` | `16px` | swatch, dropzone, inner modules |
| `--stage-radius` | `36px` | 3D stage |
| `--soft-shadow` | `0 30px 80px -30px rgba(0,0,0,0.8)` | floating stage |
| `--inner-highlight` | `inset 0 1px 0 rgba(255,255,255,0.06)` | every card carries this, not a drop shadow |

> **Card radius is `28px`, not 40px.** The "about 40px" figure in the brief does not match
> the shipped code: `--card-radius: 28px` and the Testimonials card uses `rounded-[28px]`.
> `--stage-radius: 36px` is the largest radius in the system.


---

## 2. Typography

Three families, loaded once in `src/app/layout.tsx` via `next/font/google` and exposed as
CSS variables on `<body>`: `--font-geist-sans`, `--font-geist-mono`, `--font-instrument`.
There is **no `tailwind.config.ts`** — the project is Tailwind v4, configured entirely in
`globals.css` (`@theme inline` + `@utility`).

### (a) Large headings — tight condensed serif

`Instrument Serif` (weight 400 only), `--font-instrument`, fallback
`Georgia, "Times New Roman", serif`. Applied by
`.home-lux .lux-display, .home-lux h1, .home-lux h2 { font-weight: 400; letter-spacing: -0.03em; }`.

| Class | Value | Used by |
| --- | --- | --- |
| `.lux-h1` | `clamp(2.75rem, 6vw, 5.5rem)`, `line-height: 0.95` | section H1s |
| `.hero-h1` | `clamp(2.75rem, 5.6vw, 6rem)`, `line-height: 0.95` | hero only |
| `.lux-h2` | `clamp(2.25rem, 4.5vw, 4.5rem)`, `line-height: 1` | section H2s |
| `.lux-display` (ad-hoc) | `text-[18px]`–`text-[20px]` | card titles, product names |

Hero headline: two lines, each in an `overflow-hidden` block with the inner span animated
from `y: 110%` → `0%` over `0.85s` (`EASE`, stagger `0.1 + i*0.09`). `"Own it."` is
`text-[var(--lime)]`.

Storefront headings outside `.home-lux` use the `type-*` scale on **Geist Sans**
(`--font-heading`), all `font-medium`: `type-headline-lg` 40/48 `-0.03em`,
`type-headline-lg-mobile` 28/34 `-0.025em`, `type-headline-sm` 22/28 `-0.02em`,
`type-title-md` 16/22 `-0.015em`.

### (b) Body text

Geist Sans, `font-weight: 400`, `-webkit-font-smoothing: antialiased` on `body`.
Inside `.home-lux`, body copy sits in muted tone: `text-[15px]` or `text-[17px]` with
`leading-[1.6]` in `text-[var(--muted)]` (hero, bento cards, process). Storefront scale:
`type-body-lg` 16/26 `-0.01em`, `type-body-md` 14/22 `-0.005em`, `type-label-md` 13/18,
`type-label-sm` 11/14 `0.01em`.

### (c) Labels / eyebrows / numerals — wide-tracked mono caps

Geist Mono (`--font-geist-mono`).

- `.lux-eyebrow` — `11px`, `line-height 1.2`, `letter-spacing: 0.18em`, uppercase.
  Lime in section headers (`Engineered precision`, `Hardware collection`),
  `text-[var(--muted)]` in the hero pill and the marquee.
- `.lux-mono` — family only; sizes come from Tailwind. `text-[11px]` +
  `tracking-[0.16em]`–`tracking-[0.18em]` + uppercase for `SVG / PNG`, `MATTE`,
  `GLOSSY`; `text-[13px]` tabular for hex; `text-[14px]` tabular for prices.
- `.lux-tabular` — `font-variant-numeric: tabular-nums` (storefront equivalent `.tabular`).
- PMS readout: `text-[11px] tracking-[0.18em] uppercase text-[var(--brass)]`, format
  `PMS <A–Z>-<000>`, e.g. `PMS A-078`.
- Footer / Testimonial labels: `text-[11px] tracking-[0.14em] uppercase
  text-muted-foreground`.

### Sizes actually used (px)

`10` avatar initials · `11` eyebrow / label / badge · `13` nav tab + card mono ·
`14` price · `15` body + link · `17` hero/bento body · `18`/`20` card title ·
`22`–`88` display headings.

---

## 3. Shape, border, elevation

- **Big cards:** `rounded-[var(--card-radius)]` (28px), `border border-[var(--hairline)]`,
  `bg-[var(--surface-1)]`, `[box-shadow:var(--inner-highlight)]`; on hover only
  `border-[var(--hairline-strong)]` over `transition-colors duration-500`. No drop shadow.
- **Inner modules:** `rounded-[var(--inner-radius)]` (16px) — swatch panel, dropzone.
- **Pills:** `rounded-full` — buttons, chips, tab bar, avatar, marquee diamonds.
- **Testimonials card:** `rounded-[28px] ring-1 ring-foreground/10`; inner quote tiles
  `rounded-2xl bg-foreground/[0.04] ring-1 ring-foreground/10 backdrop-blur`.
- **Benefits band:** `rounded-2xl` + 20px dot-matrix
  `radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`.
- **Hairlines only** — 1px, never thicker (`.hairline-t`); used as section dividers and
  the 4-column metrics grid.
- **Textures (existing — do not invent new ones):** `.lux-grain` (3% fractal-noise SVG
  overlay, hero + benefits), `.lux-grid-bg` (64px editorial grid, radial-mask fade, hero
  backdrop), `.lux-brushed` (90° brushed metal: 1px 5%-white lines over
  `linear-gradient(180deg,#232327,#16161a)`).
- **Depth via light, not shadow:** `.glass-panel` = `rgba(18,18,20,0.65)` +
  `blur(24px) saturate(180%)` + `1px solid rgba(255,255,255,0.12)` +
  `0 20px 40px -15px rgba(0,0,0,0.5)`.
- **Soft glows:** hero orb `size-[min(34rem,80%)] blur-[80px]` filled with
  `radial-gradient(circle, var(--lime-glow), transparent 70%)`; product image
  `drop-shadow-[0_40px_50px_rgba(0,0,0,0.5)]`; product-card hover wash
  `radial-gradient(120% 80% at 50% 120%, <hex>33, transparent 70%)`.
- **Bento spotlight:** `radial-gradient(220px circle at X% Y%, var(--lime-glow), transparent 70%)`
  from spring-smoothed pointer position (opt-in `glow` prop).

---

## 4. Layout

| Rule | Value | Where |
| --- | --- | --- |
| Content max width | `max-w-[1280px]` | `Section` (home) + hero grid |
| Gutters | `px-4 sm:px-6` (16 → 24px) inside `Section`; hero `px-4 sm:px-6` | `.home-lux` |
| Section spacing | `py-20 sm:py-28 lg:py-36` (80 → 112 → 144px) | `Section` |
| Band alternation | `band` prop paints `bg-[var(--surface-1)]` | ink → surface-1 → ink |
| Header / Footer width | `max-w-[1400px]`, `px-4 pt-1 sm:px-6` / `px-6 md:px-10` | protected |
| Product grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, `gap-5` | collection |
| Bento grid | `md:grid-cols-12`, `gap-4`, spans 7+5 / 5+5 | precision |
| Metrics grid | `1 → md:grid-cols-4` with hairline dividers | benefits |


---

## 5. Components (as shipped)

### Navbar — `components/shared/site-header.tsx` — **do not restyle**
`sticky top-0 z-50 px-4 pt-1 sm:px-6`; inner bar `h-14 rounded-full bg-background/80
ring-1 ring-foreground/10 backdrop-blur-xl max-w-[1400px]`. Left `Logo` (cube mark +
`vend`/`3d` wordmark, 19px, `-0.03em`, `3d` lime). Centre pill tab bar
`bg-foreground/[0.04] rounded-full p-1`, tabs `rounded-full px-4 py-1.5 type-label-md`,
active = `bg-foreground/[0.08] text-foreground`. Right: `CartButton` (`size-9 rounded-full`
bag, badge `bg-signal text-on-signal size-4 text-[10px]`), white avatar circle
(`size-8 rounded-full bg-primary`, `User size-4` stroke 1.5), then `MobileNav` (`md:hidden`).

### Buttons
- **Ivory pill (marketing CTA):** `ShimmerButton` — `background="#f3f0e8"`,
  `shimmerColor="#0a0a0b"`, `shimmerDuration="4s"`, `borderRadius="999px"`,
  `h-12 px-7 text-[15px] font-medium text-[var(--ink)]`, inner highlight
  `shadow-[inset_0_-8px_10px_#ffffff1f]`, `active:translate-y-px`.
- **Lime pill:** `Button className="bg-signal text-on-signal hover:bg-signal/90 h-11 rounded-full px-6"`.
- **Glass pill / secondary:** `variant="secondary" border-foreground/10 bg-foreground/[0.06]
  hover:bg-foreground/10 h-11 rounded-full px-6`.
- **Ghost pill (hero "Shop"):** `h-12 rounded-full px-7 text-[15px] text-[var(--ivory)]
  ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]`.
- **Text link + underline wipe:** lime `text-[15px] font-medium`, `h-px w-0 → w-full`
  underline, arrow `translate-x-1` on hover (`duration-300`).
- shadcn `Button` variants: `default`, `outline`, `secondary`, `ghost`, `destructive`,
  `link`; sizes `xs…lg`, `icon`, `icon-sm`, `icon-lg`.

### Chips / tabs
Collection filter: `TabsList h-11 rounded-full border border-[var(--hairline)]
bg-transparent p-1`, triggers `rounded-full px-4 text-[13px] text-[var(--muted)]`;
active pill is a `layoutId="tab-pill"` motion span (`bg-[var(--surface-2)] ring-1
ring-[var(--hairline-strong)]`, spring `stiffness 260 damping 30`).

### Rating
`StarRow` — `size-3.5 fill-current` lime stars, `strokeWidth={0}`. Product card:
`rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur` +
tabular number. Hero trust row: 4 gradient-initials avatars (`size-8 rounded-full ring-2
ring-[var(--ink)]`, 10px semibold ink text) + 5 stars + `NumberTicker`.

### Swatch dots
`size-4 rounded-full ring-1`; active adds `ring-2 ring-[var(--lime)] ring-offset-2
ring-offset-[var(--surface-1)]`; inactive `ring-[var(--hairline-strong)]`; Radix `Tooltip`
(`delayDuration={120}`); `aria-label={`${name} — ${colorway}`}`. Hero colourways are the
disabled variant: `size-6 opacity-40 ring-1`.

### Sliders
`.home-lux .lux-slider` reskins the shadcn Radix slider: track
`height: 10px; border-radius: 999px; background: var(--surface-3)`; range
`border-radius: 999px`; thumb `size: 22px; border-radius: 999px; border: 2px solid
var(--lime); background: var(--ink); box-shadow: 0 2px 10px rgba(0,0,0,0.6)`, focus
`outline: 2px solid var(--lime); outline-offset: 2px`.
Landing demo tracks: hue
`linear-gradient(to_right,#f43f5e,#facc15,#c6f135,#22d3ee,#6366f1,#f43f5e)`, gloss
`linear-gradient(to_right,#2a2a2e,#f3f0e8)`; bar `h-5 rounded-full ring-1
ring-[var(--hairline)]`, thumb `size-4 border-2 border-[var(--lime)] bg-[var(--ink)]`.

### Dropzone
`h-24 rounded-[var(--inner-radius)] border border-dashed` lime at 45% →
`border-[var(--lime)]` + `bg-[var(--lime-glow)]` on hover (`duration-500`); content =
`FileDown size-7` lime (stroke 1.5) + `lux-mono text-[11px] tracking-[0.16em] uppercase`
`SVG / PNG`, floating `y: [0,6,0]` over 5s.

### Engrave / depth chip
Not in the landing page today — specified in `docs/ui-reference/HOMEPAGE.md` as a mono
pill reading `DEPTH: 0.12mm FIBER`. `EngraveControl` builds it from the tokens above
(`lux-mono`, `text-[11px]`, `tracking-[0.16em]`, uppercase, `--surface-2` fill,
`--hairline` ring).

### Scroll progress
`ScrollProgress` — `fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-[var(--lime)]`,
`scaleX` spring (`stiffness 120, damping 30, restDelta 0.001`) on `useScroll()`.

### Footer — `components/shared/site-footer.tsx` — **do not restyle**
`mt-24 rounded-t-[28px] border-t border-foreground/10 bg-card/40`, `max-w-[1400px]
lg:grid-cols-12`, two link columns with `text-[11px] tracking-[0.14em] uppercase` headings,
`size-9 rounded-full border` social icons (stroke 1.5), newsletter form.
(Home only: `main:has(.home-lux) + footer { margin-top: 4rem }`.)

### Other shipped pieces
`Skeleton` (`bg-muted animate-pulse rounded-md`), `NumberTicker`, `Marquee` (`--duration`,
`--gap`), `Badge`, `Card`, `Dialog`, `DropdownMenu`, `HoverCard`, `Input`, `Label`,
`Table`, `Tabs`, `Tooltip`, `Sonner` toaster (`bottom-center`), `BorderBeam`,
`ShimmerButton`, `BlurFade`.


---

## 6. Motion

| Property | Value | Source |
| --- | --- | --- |
| Easing | `EASE = [0.22, 1, 0.36, 1]` = `cubic-bezier(0.22,1,0.36,1)` | `components/home/motion.ts` |
| Spring | `{ stiffness: 120, damping: 20 }` | idem |
| Reveal | `opacity 0→1, y 18→0, blur 8px→0`, `duration 0.8`, `EASE` | `revealBlur` |
| Reduced-motion reveal | `opacity` only, `duration 0.4` | `revealCalm` |
| Stagger | `0.08s` (0 when reduced) | `staggerParent` |
| Viewport trigger | `{ once: true, margin: "-15% 0px -15% 0px" }` | `viewportOnce` |
| Section heading words | `0.7s`, `EASE`, `delay i * 0.09`, blur 10px→0 | precision-bento |
| Card list reveal | `0.7s`, `EASE`, `delay i * 0.08`, blur 8px | collection |
| Card exit | `opacity 0, scale 0.97`, `0.25s` | collection |
| Hover | card `y: -4` (disabled under reduced motion); image `scale-[1.04]` over `duration-700`; "Customize" bar `translate-y-full → 0` `duration-500`; border colour `duration-500`; arrow `translate-x-1` `duration-300` | collection, bento |
| Idle loops | hero product float `y: [-6,6,-6]` 9s `easeInOut`; decal icon `y: [0,6,0]` 5s; `lux-pulse-dot` 3s — all paused under reduced motion | hero, demos, globals.css |
| Marquee | 38s; 4× slower (160s) on hover; paused under reduced motion | category-strip |
| Page-level | Lenis smooth scroll (`autoRaf`), skipped when `prefers-reduced-motion: reduce` | `components/smooth-scroll.tsx` |
| Cursor effects | spotlight + slider-hover gated by `useIsTouch()` (`(pointer: coarse)`) and `useReducedMotion()` | bento, demos |

**Libraries installed:** `framer-motion` 14, `lenis` 1.3, `shadcn` 4 (Radix via the
`radix-ui` meta-package, `lucide-react` icons), `sonner`, `tailwind-merge` + `clsx`
(behind `cn`), `class-variance-authority`, `tw-animate-css`, `three` +
`@react-three/fiber` + `@react-three/drei`, `zustand`, `zod`, `react-hook-form`,
`prisma`, `@supabase/*`. **No `motion` (v11 package), no Magic UI, no Lottie.**
Magic-UI-style pieces were hand-copied into `components/ui/` (`shimmer-button`,
`marquee`, `number-ticker`, `border-beam`, `blur-fade`).

**Only `transform`, `opacity` and `blur` are animated.** Nothing else.

**Page transition (new screens):** fade + 8px rise, 600–800ms, `EASE` — implemented in
`PageShell` (§8).


---

## 7. GLOBAL RULES (binding)

1. **Vibe:** clean, minimal, luxurious, dark. Plenty of empty space, one idea per section,
   hairline borders, no clutter, no decorative noise beyond what the landing page already has.
2. **Lime is a signal colour only** (primary action, active/selected state, progress).
   Never large lime fills except the existing primary CTAs.
3. **Reuse landing-page components.** Never create a second button, card, chip or slider style.
4. **Navbar and Footer: do not change their design or markup.** Only allowed edits are
   `href` / `onClick` wiring (Studio → `/studio`, Designs → `/designs`, bag icon → open
   cart drawer, avatar → auth dialog or account menu, footer links → their routes) and an
   active-tab state based on the current route. The Testimonials section: same rule,
   wiring only ("Launch Your Canvas" → `/studio`, "See all reviews" → `/reviews`).
5. **Project name is Vend3D.** No Stripe or real payment anywhere. Demo card form only,
   always labelled "Demo payment, no real charge".
6. **3D model files (GLB) are supplied later by the owner.** Always provide a graceful
   placeholder when a GLB is missing.
7. **Follow AGENTS.md, ARCHITECTURE.md and plan.md.** Do not change stack, folder structure
   or data models beyond what a screen needs.
8. **Layout:** max content width 1280px, gutters 24px mobile / 48px desktop, section
   spacing 128px desktop / 80px mobile (match the landing page), consistent card grid.
9. **Motion:** ease `cubic-bezier(0.22,1,0.36,1)`; reveals 600–800ms, hovers 250–350ms;
   only transform/opacity/blur; every async area has a Skeleton; honour
   `prefers-reduced-motion`; disable cursor effects on touch; page transitions
   fade + 8px rise.
10. **Accessibility:** AA contrast, 2px lime focus rings, 44px touch targets, `aria-label`s
    on swatches and sliders, `aria-live` for price/cart changes.
11. **Responsive checks at 390, 768, 1024, 1440, 1920 for every screen.**
12. **Every screen ships with loading, empty and error states.**
13. **Commit per screen.** Keep the app runnable at every commit. Finish every prompt with
    a short report: files created/edited, packages added, anything not done.


---

## 8. Shared primitives

All under `src/components/` and reusable from any route.

| Primitive | Path | Purpose |
| --- | --- | --- |
| `PageShell` | `src/components/ui/page-shell.tsx` | page transition (fade + 8px rise, 800ms, `EASE`) + 1280px content width + 24/48px gutters + 80/128px section rhythm. Lenis is already global in the root layout, so no second provider is needed. |
| `PageHeader` | `src/components/ui/page-header.tsx` | mono eyebrow (`.lux-eyebrow`, lime), serif H1 (`lux-display`), optional muted intro, optional right-side action. |
| `ProductCard` | `src/components/ui/product-card.tsx` | the landing-page collection card, re-exported so every screen renders one identical card. |
| `EmptyState` | `src/components/ui/empty-state.tsx` | dashed-lime hairline panel, mono eyebrow, serif title, muted body, optional CTA. |
| `ErrorState` | `src/components/ui/error-state.tsx` | destructive-tinted panel, `role="alert"`, retry button. |
| `SectionSkeletons` | `src/components/ui/section-skeletons.tsx` | `card-grid` / `product-grid` / `list` rows in card radius + `Skeleton`. |
| `HueColorControl` | `src/components/studio/controls/hue-color-control.tsx` | **moved** from `home/precision-demos.tsx` (`ColorDemo`): gradient hue slider + big swatch + hex + PMS code + `hueColor` helper. |
| `FinishControl` | `src/components/studio/controls/finish-control.tsx` | **moved** (`MaterialDemo`): matte↔glossy slider driving a specular highlight. |
| `DecalDropzone` | `src/components/studio/controls/decal-dropzone.tsx` | **moved** (`DecalsDemo`): dashed lime SVG/PNG zone, now clickable/uploadable with validation (PNG/JPG/SVG ≤ 2 MB). |
| `EngraveControl` | `src/components/studio/controls/engrave-control.tsx` | new: depth chip `DEPTH: 0.12mm FIBER` + `.lux-slider` depth control. |
| `hslToHex` | stays in `src/components/home/motion.ts`, re-exported by `hue-color-control.tsx` | unchanged; the home page keeps importing it from `motion.ts`. |

The three landing demos in `src/components/home/precision-demos.tsx` now **delegate** to the
moved controls — no duplicated markup. Prompt 01 removes the bento section; nothing else
imports `precision-demos`, so deleting it later breaks nothing.

