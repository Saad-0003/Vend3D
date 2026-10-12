# Vend3D — Master Build Plan (MVP)

> **Product:** A 3D print-on-demand style storefront (think Shopify × 3D customizer). Users browse base products (shirts, mugs, caps, bottles), open an interactive 3D customizer, change colors/materials, place decals & text on the model, save designs, and check out.
> **Mode:** Fully agent-driven ("vibe coded"). Every phase below is written so a coding agent can execute it autonomously and verify its own work against the acceptance criteria.
> **Golden rule of this plan:** A phase is NOT done until its **Acceptance Criteria** pass and its **Tests** are written and green.

---

## 0. How to Use This Plan (Read First)

1. Work through phases **in order**. Do not start phase N until phase N−1's acceptance criteria pass.
2. Each phase has: **Goal → Tasks → Edge Cases → Tests → Acceptance Criteria (DoD)**.
3. When a phase is complete, mark its checkbox `- [x]` and commit with message `phase-N: <summary>`.
4. If you must deviate from this plan, record **what and why** in `DECISIONS.md` at repo root.
5. `agent.md` (rules of engagement) and `architecture.md` (system design) are binding companions to this file.
6. MVP discipline: if a feature is listed in **Out of Scope**, do not build it, stub it, or "just prepare" for it.

---

## 1. Tech Stack (Pinned — Do Not Substitute Without Logging in DECISIONS.md)

### 1.1 Core

| Layer             | Choice                                                       | Why                                                  |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Framework         | **Next.js 15 (App Router) + React 19 + TypeScript (strict)** | One deployable, RSC by default, API routes included  |
| Styling           | **Tailwind CSS v4**                                          | Utility-first, agent-friendly                        |
| UI components     | **shadcn/ui** (Radix primitives) + **lucide-react** icons    | Accessible, copy-in components, no runtime dep bloat |
| Animation         | **framer-motion**                                            | Micro-interactions, page transitions                 |
| 3D engine         | **three + @react-three/fiber v9 + @react-three/drei v10**    | WebGL on the user's GPU — zero server rendering cost |
| 3D asset pipeline | **@gltf-transform/cli** (Draco + meshopt + KTX2)             | 5–10× smaller models, smooth on low-end devices      |
| State (client)    | **zustand**                                                  | Customizer + cart state; tiny, no boilerplate        |
| Validation        | **zod** (shared schemas client+server)                       | One source of truth for every payload                |
| Forms             | **react-hook-form** + zod resolver                           | Login, checkout, admin forms                         |

### 1.2 Backend & Data (all free tier)

| Layer                                                                | Choice                                                                   | Free tier               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------- |
| Auth                                                                 | **Supabase Auth** (email + Google OAuth)                                 | 50k MAU                 |
| Database                                                             | **Supabase Postgres**                                                    | 500 MB — plenty for MVP |
| ORM / migrations                                                     | **Prisma**                                                               | OSS                     |
| File storage (GLB models, textures, user uploads, design thumbnails) | **Supabase Storage** (S3-compatible, built-in CDN)                       | 1 GB                    |
| Payments                                                             | **Demo card form (Visa / Mastercard) — no real gateway, no real charge** | Free                    |
| Hosting                                                              | **Vercel** (Hobby)                                                       | Free                    |
| Rate limiting                                                        | **Postgres-backed sliding window** (table + RPC) — no external service   | Free                    |

> **Caching decision (no Redis):** Product/catalog caching uses **Next.js built-in caching** — `unstable_cache` for DB reads, ISR (`revalidate`) for catalog pages, and Supabase Storage's CDN for assets. Postgres/Supabase have **no** built-in Redis-style cache, and at MVP scale we don't need one. _Post-MVP upgrade path:_ add Upstash Redis for hot-read caching and distributed rate limiting (see architecture.md §10).

### 1.3 Testing & Quality

| Type             | Tool                                                          |
| ---------------- | ------------------------------------------------------------- |
| Unit / component | **Vitest** + **React Testing Library** + jsdom                |
| API integration  | Vitest + supertest-style fetch against route handlers         |
| E2E              | **Playwright** (Chromium + WebKit)                            |
| Load smoke       | **k6** script against catalog + checkout endpoints            |
| Static analysis  | **ESLint** (next/core-web-vitals), **tsc --noEmit**, Prettier |

---

## 2. Environment Setup (Pre-Phase Contract)

### 2.1 Required environment variables (`.env.example` must exist and be complete from Phase 1)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never exposed to client
DATABASE_URL=                     # pooled connection (port 6543) for Prisma
DIRECT_URL=                       # direct connection (port 5432) for migrations
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Hard environment rules

- `src/env.ts` validates **all** env vars with zod at boot; the app must **crash fast** with a clear error if any are missing — never fail silently at runtime.
- `NEXT_PUBLIC_` vars are the only ones allowed in client bundles. Service-role key usage = automatic phase failure.
- Node 20+, npm (lockfile committed). All commands must work from a clean clone: `npm install && npm run dev`.

### 2.3 npm scripts that must exist from Phase 1

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `format`

---

## 3. MVP Scope

**In scope:** auth, catalog, 3D viewer + customizer (color/material/decal/text), save/load designs, cart, demo card-payment checkout (no real gateway), orders, admin CRUD for products/models, asset optimization, full test suite, deployment.

**Out of scope (do NOT build):** real payment capture/live mode, shipping integrations, user-to-user marketplace, social/sharing features, reviews/ratings, multi-language, mobile native apps, server-side 3D rendering of final products, AI design generation, Redis/queues, multi-vendor.

---

---

# PHASES

## Phase 1 — Project Scaffolding & Design System

**Goal:** Clean, strict, runnable skeleton every later phase builds on.

**Tasks**

- [x] `create-next-app` with App Router, TS strict, Tailwind v4, ESLint, `/src` dir, import alias `@/*`
- [x] Init shadcn/ui; add base components: button, input, card, dialog, dropdown-menu, toast (sonner), skeleton, tabs, form, table, badge
- [x] `src/env.ts` zod-validated env; `.env.example`; Prettier + pre-commit lint (`lint-staged` optional)
- [x] Base layout: sticky navbar (logo, nav links, cart icon w/ count badge, auth buttons), footer, dark theme tokens via CSS variables
- [x] Route skeleton with placeholder pages: `/` `/products` `/products/[id]` `/customize/[productId]` `/cart` `/checkout` `/orders` `/designs` `/admin` `/login` `/signup`
- [x] Landing page: hero (static headline + CTA), featured-products placeholder grid, "how it works" 3-step strip — final copy can be lorem-free but simple
- [x] Git repo init, README with setup steps, `DECISIONS.md` created

**Edge cases**

- [x] App must build with zero TS errors and zero ESLint errors from day one (`npm run build` in CI mode).
- [x] 404 (`not-found.tsx`) and global error boundary (`error.tsx`) with "try again" reset.

**Tests**

- [x] Vitest smoke test renders landing page
- [x] Playwright: all skeleton routes return 200

**Acceptance criteria**

- [x] `npm install && npm run dev` works from clean clone; all routes render placeholders; lint/typecheck green

---

## Phase 2 — Database Schema, Supabase Project & Seed Data

**Goal:** Real, migrated, seeded Postgres behind the app.

**Schema (Prisma models — see architecture.md §5 for full ERD):**

- [ ] `Profile` (id = Supabase auth user id, displayName, avatarUrl, role: `customer|admin`)
- [ ] `Product` (id, slug unique, name, description, category enum: SHIRT/MUG/CAP/BOTTLE/OTHER, basePriceCents int, active bool, previewImageUrl, modelUrl, customizableZones jsonb, createdAt/updatedAt)
- [ ] `Design` (id, userId FK, productId FK, name, config jsonb, thumbnailUrl, createdAt/updatedAt)
- [ ] `CartItem` (id, userId FK, designId FK nullable, productId FK, quantity, unitPriceCents snapshot, addedAt)
- [ ] `Order` (id, userId FK, status enum: PENDING/PAID/FAILED/CANCELLED, totalCents, checkoutKey unique, paymentMethod default `DEMO_CARD`, cardBrand `VISA|MASTERCARD`, cardLast4, createdAt)
- [ ] `OrderItem` (id, orderId FK, productId, designId nullable, quantity, unitPriceCents, designConfigSnapshot jsonb)
- [ ] `RateLimitEntry` (key, windowStart, count) — for Phase 12

**Rules**

- [ ] Money is **always integer cents**. Never float. Any float money type = phase failure.
- [ ] All FKs indexed; `slug`, `checkoutKey` unique; `Design.config` validated by zod before write
- [ ] Supabase Storage buckets: `models` (public read), `uploads` (user-scoped), `thumbnails` (public read) — with RLS policies per architecture.md §7
- [ ] Prisma migrations committed; `npm run db:seed` inserts 3–5 sample products linked to **GLB models supplied by the human** (AI-generated or downloaded from model sites), placed in `models-src/`. The seed references them by filename; if a referenced file is missing, **stop and ask the human** — never substitute or fabricate a model. Record each model's source/license in `models-src/SOURCES.md`
- [ ] Enable RLS on all tables; Prisma (service role) bypasses RLS, so **every server read/write must enforce ownership in code** (see agent.md security rules)

**Edge cases**

- [ ] Migration must be reversible; seed must be idempotent (upsert by slug)
- [ ] Deleting a product with existing OrderItems must NOT cascade-delete order history → use `active=false` soft-delete; FK `onDelete: Restrict`

**Tests**

- [ ] Unit: zod schemas accept valid / reject invalid design configs
- [ ] Integration: seed runs twice without duplicates

**Acceptance criteria**

- [ ] `db:migrate` + `db:seed` green on empty DB; products visible via a temporary Prisma Studio check

---

## Phase 3 — Authentication & Profiles

**Goal:** Supabase Auth wired end-to-end.

> **Status:** the *UI* half of this phase is built and green (login/signup pages, shared dialog,
> navbar island, guarded `/account`, `?next=` contract) behind a swappable `AuthService` interface
> implemented as a browser-local mock — see D-051. `/account` is the five-panel shell (Profile ·
> Orders · Saved designs · Addresses · Settings) described in D-054: its panels are UX only, with
> the backend deferred. The *server* half (`middleware.ts`, `Profile` rows, admin gate) needs
> Phase 2's schema and is deliberately not started.

**Tasks**

- [x] `/login`, `/signup` with email+password (react-hook-form + zod) — *done (D-051); "Continue with Google" is not built: with no Supabase behind it the button could only be a dead stub*
- [ ] `middleware.ts`: refresh session; protect `/cart`, `/checkout`, `/orders`, `/designs`, `/admin` (redirect to `/login?next=...` and return after login) — *not built; `/account` is guarded client-side by `RequireAuth` (redirect + return after) until it exists (D-051)*
- [ ] On first login, create `Profile` row (server action, service key, idempotent upsert) — *not built: no `prisma/` yet*
- [x] Navbar reflects auth state (avatar + dropdown: My Designs, My Orders, Sign out) — *done: Account / Designs / Orders / Sign out in the popover (D-051)*
- [ ] Admin gate: `/admin/*` returns 403 UI unless `profile.role === 'admin'` (check server-side on every admin request — never trust a client flag) — *not built*
- [ ] Sign out; session expiry handled gracefully (middleware refresh, server actions re-check auth and return 401 → client redirects to login) — *the UI part is wired (Sign out in the account menu); refresh and 401 handling need middleware*

**Edge cases**

- [x] OAuth user without displayName → derive from email prefix — *the mock derives a display name from the email local part when none is given (`displayNameFromEmail`), tested*
- [x] Signup with existing email → friendly inline error, no account enumeration ("If this email exists…" style where applicable) — *done: sign-up says "already exists"; sign-in returns one identical message for unknown email and wrong password, so it is not an enumeration oracle (D-051)*
- [ ] Email confirmation required vs autoconfirm: pick one, document in README; handle "check your inbox" state — *deferred to the Supabase wiring — there is no server to confirm against yet*
- [ ] Session expires mid-checkout → cart preserved (it lives server-side from Phase 8), user returns after re-login — *not built: needs middleware + a server cart*

**Tests**

- [x] Unit: auth helper returns user/null correctly — *`tests/unit/auth-lib.test.ts` (29) and `tests/unit/auth-service.test.ts` (10)*
- [x] Playwright: signup → logout → login flow; protected route redirects to login and back — *`tests/e2e/auth.spec.ts`, 10 tests × chromium + webkit*

**Acceptance criteria**

- [ ] Full auth round-trip works; non-admin cannot reach `/admin` (server-verified) — *the round-trip works behind the mock (D-051); the server-verified admin gate still needs Phase 2*

---

## Phase 4 — Product Catalog & Storefront

**Goal:** Fast, cached, shoppable catalog.

**Tasks**

- [ ] `/products`: responsive grid (card: preview image, name, category badge, price, "Customize" CTA) with category filter tabs + text search (server-side via query params)
- [ ] `/products/[slug]`: detail page — big preview, description, price, stock-less MVP notice if needed, primary CTA → `/customize/[productId]`
- [ ] Caching: catalog list + detail via `unstable_cache` keyed by query; pages ISR with `revalidate = 300`; revalidate on admin product mutation (`revalidateTag('products')`)
- [ ] Empty state (no products / no search results), loading skeletons, image `next/image` with proper sizes
- [ ] Price formatting helper `formatCents(cents, currency)` — single source, unit-tested

**Edge cases**

- [ ] Unknown slug → 404 page (not a crash)
- [ ] `active=false` products hidden from catalog and direct URL → 404
- [ ] Long product names/descriptions truncate cleanly; missing preview image → placeholder

**Tests**

- [ ] Unit: `formatCents` incl. 0, negatives blocked, locale
- [ ] Integration: catalog query filters by category & search
- [ ] Playwright: browse → filter → open detail → CTA navigates to customizer

**Acceptance criteria**

- [ ] Catalog renders from real DB data; Lighthouse-style sanity: catalog page TTFB served from cache on repeat visit

---

## Phase 5 — 3D Viewer Core

**Goal:** Smooth, resilient GLB rendering at 60fps on a mid-range laptop.

**Tasks**

- [ ] `<ProductViewer>` client component: R3F `<Canvas>` with `dpr={[1, 1.75]}`, `<Suspense>` fallback (skeleton + spinner), `OrbitControls` (damped, zoom limits, pan disabled), `<Environment preset="city">`, soft contact shadows, `<Stage>`-style framing
- [ ] `useGLTF` with **Draco + meshopt** decoders configured; model preloading for catalog hover (optional, behind flag)
- [ ] Camera reset button; fullscreen toggle; touch controls verified
- [ ] **WebGL-unavailable fallback:** try/catch canvas creation → render static preview image + message "3D not supported in this browser" (detect via canvas `webgl` context probe)
- [ ] **Model load failure:** `<ErrorBoundary>` around model → retry button (max 3) → fallback to preview image
- [ ] Loading progress bar via drei `useProgress`
- [ ] Dispose geometries/materials/textures on unmount (no GPU memory leaks across navigation)

**Edge cases**

- [ ] Slow network: 20s model-load timeout → error state (not infinite spinner)
- [ ] Corrupt/404 GLB → error boundary, logged
- [ ] iOS Safari texture memory: cap texture size at 2048px; test on mobile viewport
- [ ] Tab backgrounded/foregrounded — no context loss crash (`frameloop="demand"` or default, verify)

**Tests**

- [ ] Playwright: customizer canvas exists, no page errors, screenshot matches baseline (loose threshold)
- [ ] Unit: fallback branch renders when WebGL probe mocked false

**Acceptance criteria**

- [ ] Any seeded product renders its model; orbit/zoom smooth; fallbacks verified by mocking

---

## Phase 6 — Customization Engine (the core feature)

**Goal:** Real-time color, material, decal and text customization, described by a single serializable `DesignConfig`.

**DesignConfig (zod schema — THE contract, lives in `src/lib/design/config.ts`):**

```ts
{
  version: 1,
  productId: string,
  baseColor: string,                // hex
  material: { roughness: 0..1, metalness: 0..1 },
  decals: [{ id, imageUrl, meshTarget, position:[x,y,z], rotation:[x,y,z], scale, opacity }],
  texts:  [{ id, content, color, fontFamily, meshTarget, position, rotation, scale }]
}
```

**Tasks**

- [ ] Zustand `useCustomizerStore`: holds current DesignConfig, undo/redo history (past/future stacks, cap 50), dirty flag
- [ ] UI panel (right sidebar): color swatches + custom hex picker; material sliders (roughness/metalness); decal upload (PNG/JPG/SVG, ≤2 MB, client-side type+size validation); text input (≤30 chars, curated font list only); per-item transform controls (move/rotate/scale via drag on model + numeric inputs); delete per decal/text
- [ ] Rendering: color via material tint; decals via drei `<Decal>`; text rendered to canvas texture then `<Decal>` (never raw HTML inside canvas)
- [ ] Capture thumbnail: `canvas.toDataURL` snapshot (≥800px) for design library & cart display
- [ ] "Reset to defaults" with confirm dialog; unsaved-changes guard on route leave
- [ ] Uploaded decal files → Supabase Storage `uploads/{userId}/...`; **textures loaded with `crossOrigin="anonymous"`**; storage bucket CORS configured (see architecture.md §6)

**Edge cases**

- [ ] XSS: text content sanitized/escaped at render-to-texture; config strings validated with zod on save (server)
- [ ] Decal upload: reject wrong MIME, >2 MB, or pixel dimensions >4096 (mobile GPU) with inline error
- [ ] Undo across decal deletion restores full state incl. image reference
- [ ] Config schema `version` field — unknown version on load → migrate or reject with friendly message (never crash)
- [ ] Upload succeeds but user abandons → orphan cleanup note in Phase 12 cron (acceptable for MVP: document it)

**Tests**

- [ ] Unit: store actions (set color, add/remove decal, undo/redo, history cap)
- [ ] Unit: zod schema rejects oversized text, bad hex, unknown version
- [ ] Playwright: change color → add text → thumbnail captured → undo restores

**Acceptance criteria**

- [ ] Full customization round-trip works at interactive framerate; config JSON serializes/deserializes losslessly

---

## Phase 7 — Save / Load Designs (Design Library)

**Goal:** Users persist and revisit their creations.

**Tasks**

- [ ] Save dialog (name ≤50 chars) → server action validates DesignConfig (zod), stores row + uploads thumbnail to `thumbnails/{userId}/{designId}.png`
- [ ] `/designs`: user's design grid (thumbnail, name, product, updated date), actions: **Open in customizer**, rename, duplicate, delete (confirm)
- [ ] Opening a design loads config into customizer store and navigates to `/customize/[productId]?design=<id>`
- [ ] Autosave-lite: warn if navigating away with unsaved changes (dirty flag)
- [ ] Pagination or load-more at 12+ designs

**Edge cases**

- [ ] Design whose product was soft-deleted → card shows "Product unavailable", open disabled
- [ ] Loading another user's design id → 403/404 (ownership check server-side, always)
- [ ] Duplicate names allowed (don't over-constrain); name sanitization
- [ ] Thumbnail upload failure → save design without thumbnail, placeholder shown, warn user

**Tests**

- [ ] Integration: save → list → load round-trip preserves config exactly
- [ ] Integration: user B cannot read/delete user A's design
- [ ] Playwright: save design → appears in library → reopen restores colors/text

**Acceptance criteria**

- [ ] Round-trip fidelity proven by test; ownership enforced by test

---

## Phase 8 — Cart

**Goal:** Server-persisted cart surviving sessions and devices.

**Tasks**

- [ ] Add-to-cart from customizer ("Add current design to cart" — auto-saves design first if dirty) and from product detail (base product, no design)
- [ ] CartItem stores `unitPriceCents` **snapshot** from product at add-time
- [ ] `/cart`: line items (thumbnail/preview, name, design badge, qty stepper, remove), subtotal, shipping-free MVP note, CTA to checkout
- [ ] Zustand cart slice mirrors server state for navbar badge; rehydrates from server on login/navigation
- [ ] Quantity stepper 1–10; optimistic update with rollback on server error; merge duplicates (same product+design → qty+1)

**Edge cases**

- [ ] Price changed since add-to-cart → cart shows a "price updated" notice and new price (server re-validates at checkout too)
- [ ] Cart item referencing soft-deleted product → row flagged unavailable, excluded from checkout, removable
- [ ] Double-click add → single line item (server upsert on (userId, productId, designId) unique)
- [ ] Cart badge never stale after login/logout (clear local state on auth change)

**Tests**

- [ ] Unit: cart store merge/qty logic
- [ ] Integration: concurrent adds don't duplicate (unique constraint holds)
- [ ] Playwright: add → change qty → remove → badge counts correct

**Acceptance criteria**

- [ ] Cart survives logout/login on second device/browser (server source of truth)

---

## Phase 9 — Checkout & Orders (Demo Card Payment)

**Goal:** Real order-flow shape, zero real money, zero external gateway. Stripe is not used (no access); no real Pakistani gateway is integrated either — those need a merchant account (see Post-MVP).

**Tasks**

- [x] `/checkout`: order summary + **demo card form** (cardholder name, card number, expiry MM/YY, CVC) accepting **Visa or Mastercard** only; visible banner: "Demo checkout — no real payment is taken. Do not enter real card details." — *done as a 3-step flow (details → payment → review) with a persistent "Demo payment, no real charge" banner; client store instead of a server action (D-048)*
- [x] Pure helpers in `src/lib/payment/card.ts`: Luhn check, brand detect (Visa: starts with 4; Mastercard: 51–55 or 2221–2720), expiry-not-in-past, CVC 3 digits; live brand icon + input formatting (spaces) in the form
- [x] **Card data stays in the browser.** Card number, expiry and CVC are validated client-side only and are NEVER sent to the server, stored, or logged. Server action `placeOrder` receives only `{ checkoutKey, cardBrand, cardLast4 }` — *the store keeps only brand + last4; the payment step's form is unmounted and reset when the step is left (D-048)*
- [ ] `placeOrder` server action (auth + rate limit + zod): loads cart from DB, **recomputes prices from DB** (never trust client totals), then in one transaction creates Order (`status=PAID`, `paymentMethod=DEMO_CARD`, brand + last4) + OrderItems (with `designConfigSnapshot`) and clears the cart
- [x] **Idempotency:** `checkoutKey` = client-generated UUID per checkout attempt, unique on Order; a repeat call returns the existing order. Submit button disables + shows "Processing…" (simulated ~1.5s delay for demo feel) — *idempotency lives in the orders store until the server action lands (D-048)*
- [ ] `/checkout/success?order=<id>`: confirmation message ("Order placed — demo payment, no money was charged") with order summary; page only **reads** the order (ownership-checked). `/checkout/cancelled` = simple "no charge made, cart kept" page — *built as the prompt's read-only `/order/[id]` instead (D-048)*
- [ ] `/orders`: order history (id, date, items w/ thumbnails, total, status badge); `/orders/[id]` detail
- [ ] Order confirmation "email" = documented stub (log + TODO) — out of scope to send real email

**Edge cases**

- [x] Double-click / network retry / two tabs → one order only (unique `checkoutKey`) — *store-level idempotency, tested; the DB unique constraint arrives with the migration*
- [x] Invalid card (bad Luhn, expired, non-Visa/Mastercard, short CVC) → inline field errors, nothing sent to server
- [ ] Product soft-deleted between cart and payment → order still created from **snapshotted** config/price for available items; unavailable items excluded and the user is told (order history integrity)
- [x] Empty cart at checkout → redirect to `/cart`
- [ ] Local currency: MVP single currency (USD), documented

**Tests**

- [x] Unit: Luhn, brand detection, expiry and CVC validation (valid + invalid fixtures) — *`tests/unit/payment-card.test.ts`*
- [ ] Integration: `placeOrder` called twice with same `checkoutKey` → order created exactly once — *store-level version tested; server action needs Phase 2*
- [ ] Integration: checkout rejects tampered client-side total; server payload schema rejects any extra card fields (number/CVC/expiry) — *totals are recomputed from the cart in `lib/checkout/order.ts`; no server payload exists yet*
- [x] Playwright: full flow login → customize → cart → demo card 4242 4242 4242 4242 → success page shows order — *cart → checkout → `/order/[id]`; the login step is not built (Phase 3)*

**Acceptance criteria**

- [ ] End-to-end demo purchase green in Playwright; duplicate submit/retry safe; no card data present in any server payload, DB row or log

---

## Phase 10 — Admin Panel

**Goal:** Non-technical product & model management (also your demo's back-office wow factor).

**Tasks**

- [ ] `/admin` layout with sidebar: Products, Models/Assets, Orders, (Users read-only list optional)
- [ ] Products CRUD: create/edit (name, slug auto-from-name w/ uniqueness suffix, category, price in dollars→cents, description, active toggle, preview image upload, model picker from assets), soft-delete with confirm
- [ ] Model asset upload: GLB/GLTF upload → `models/` bucket; **server-side post-upload check** (extension + magic bytes + size ≤15 MB); show optimization hint if not Draco-compressed
- [ ] Orders table: list with status, detail view, manual status override (PAID→CANCELLED only, with confirm; MVP refund = documented no-op)
- [ ] Every admin mutation calls `revalidateTag('products')`/relevant tag
- [ ] Server-side admin role check in **every** admin route handler/server action (helper `requireAdmin()`)

**Edge cases**

- [ ] Slug collision → append `-2`, `-3`…
- [ ] Price input "12.99" → 1299 cents; reject "abc", negative, >$10,000
- [ ] Uploading 50 MB model → rejected with clear limit message
- [ ] Editing product that's in users' carts → allowed; carts keep their price snapshot, notice shown (Phase 8 behavior)

**Tests**

- [ ] Integration: `requireAdmin` blocks customer role (403)
- [ ] Integration: product create → appears in catalog after revalidation
- [ ] Playwright: admin creates product → customer session sees it

**Acceptance criteria**

- [ ] Full CRUD round-trip from UI; cache invalidation visible without redeploy

---

## Phase 11 — Asset Pipeline & Performance Pass

**Goal:** Demo-day smooth. Models tiny, pages instant.

**Tasks**

- [ ] Script `npm run optimize:models` (gltf-transform): draco + meshopt + resize textures ≤2048 + prune/dedup; run over `models-src/` source dir → `public/models/optimized/` (or re-upload to bucket)
- [ ] Enforce in admin upload UI: warn when file isn't optimized
- [ ] Customizer code-split: `next/dynamic` with `ssr:false` for the R3F canvas; three.js excluded from initial bundle
- [ ] Audit: no model/texture fetched twice (dedupe keys), `useGLTF.preload` only on customizer route
- [ ] Images: all previews via `next/image`; lazy below fold
- [ ] Bundle budget: initial JS for storefront < 250 KB gz (customizer chunk exempt, loaded on demand) — check with `@next/bundle-analyzer`, record in DECISIONS.md
- [ ] Cache headers sanity: static assets immutable; catalog ISR working (Phase 4)

**Edge cases**

- [ ] Optimization script fails on a corrupt GLB → logs file, exits non-zero, doesn't half-overwrite output
- [ ] Low-end device: dpr cap + `<PerformanceMonitor>` (drei) optionally lowering shadows — implement flag, default on

**Tests**

- [ ] Script test: optimized output smaller than source for sample model
- [ ] Playwright (desktop + mobile emulation): customizer interactive (canvas responds) within performance budget — record timings in `docs/perf.md`

**Acceptance criteria**

- [ ] Storefront repeat-visit loads cached; customizer chunk loads on demand; models ≤ ~2 MB each optimized

---

## Phase 12 — Security Hardening & Edge-Case Sweep

**Goal:** Nothing embarrassing survives a malicious classmate.

**Tasks**

- [ ] Global input audit: every server action/route validates body with zod; no `any` on request data
- [ ] **Rate limiting (Postgres sliding window, no Redis):** RPC `check_rate_limit(key, max, windowSeconds)` increments `RateLimitEntry`; apply to: login attempts (5/min/IP), design saves (30/min/user), checkout session creation (10/min/user), admin mutations (60/min/user), uploads (10/min/user). Return 429 with Retry-After
- [ ] Security headers via `next.config`: CSP (allow `blob:` for three textures, Supabase origins), X-Frame-Options DENY, Referrer-Policy, Permissions-Policy
- [ ] Storage RLS re-audit: `uploads/` write only own folder, read own + server; `models/` public read, admin write; `thumbnails/` public read, owner write
- [ ] XSS sweep: any `dangerouslySetInnerHTML` → remove; user text never rendered as HTML
- [ ] CSRF: server actions only from same origin (Next default)
- [ ] Secrets sweep: `git grep` for keys; `.env*` gitignored; service-role key never in client code paths
- [ ] Error hygiene: no stack traces/DB errors leaked to client; central `toUserMessage(error)` mapper
- [ ] Orphan upload cleanup: documented SQL/cron approach (Supabase scheduled function) — implement if time permits, else `docs/known-limitations.md`
- [ ] Dependency audit: `npm audit` — zero high/critical

**Tests**

- [ ] Integration: rate limiter returns 429 after threshold
- [ ] Integration: cross-user access attempts on designs/orders/uploads all 403/404
- [ ] Playwright: OWASP-lite pass — reflected XSS strings in text/decal name fields render inert

**Acceptance criteria**

- [ ] All security tests green; headers verified via response inspection

---

## Phase 13 — Testing & SQA Deliverables

**Goal:** The SQA artifacts your course rubric expects, backed by real green suites.

**Tasks**

- [ ] Coverage: `vitest --coverage` ≥ 70% lines on `src/lib`, stores, and server actions (exempt: generated shadcn/ui files)
- [ ] Playwright suite consolidated: auth, catalog, customize, designs, cart, checkout, admin, security — run headless in CI (`playwright.yml` GitHub Action)
- [ ] k6 smoke: 50 VUs / 1 min against `/products` + product detail; record p95 in `docs/load-test.md` (expect cached ISR pages to hold easily)
- [ ] SQA docs in `docs/sqa/`: `test-plan.md` (scope, strategy, env, entry/exit criteria), `test-cases.md` (ID → requirement → steps → expected, traceable to phases), `defect-log.md` (template + any real defects found), `coverage-report.md`
- [ ] GitHub Actions CI: install → lint → typecheck → unit → build → (e2e on main)

**Edge cases (testing itself)**

- [ ] Flaky e2e: no hard `waitForTimeout` — use locator assertions/expect polls; retries=1 in CI only
- [ ] Tests must not touch production Supabase — dedicated test project/branch DB; `.env.test`

**Acceptance criteria**

- [ ] CI green on main; SQA docs complete and consistent with actual suites

---

## Phase 14 — Deployment & Launch Checklist

**Goal:** Public URL your instructor can click.

**Tasks**

- [ ] Vercel project connected to GitHub repo; production env vars set (payments remain demo-only — documented)
- [ ] Supabase: production project, Google OAuth redirect URLs updated to prod domain
- [ ] Seed production DB with demo products; create one admin account (credentials in private notes, NOT repo)
- [ ] Custom 404/500 pages final; favicon + OG image; `<title>`/meta per route
- [ ] `README.md` final: architecture diagram, setup, demo script, demo card number, known limitations
- [ ] Launch checklist run: signup→customize→save→cart→pay→order visible; admin create product; mobile viewport check; all from prod URL
- [ ] Tag release `v1.0.0-mvp`; mark all phases `- [x]`

**Rollback:** Vercel instant rollback to previous deployment — document the button location in README.

**Acceptance criteria**

- [ ] Instructor-flow passes on production URL from a fresh incognito session

---

## Appendix A — Post-MVP Roadmap (Do Not Build Now)

Upstash Redis (hot cache + distributed rate limit) · server-side render of final product previews (queue + worker) · real email (Resend) · real payment gateway (Pakistan-supported, e.g. Safepay or PayFast — needs a merchant account) · social sharing of designs · product reviews · multi-currency · AI-generated decals

## Appendix B — Demo Script (5 minutes)

1. Browse catalog → open shirt → 2. recolor + upload logo decal + add text → 3. save design "Demo Tee" → 4. add to cart → checkout w/ demo card 4242 4242 4242 4242 → 5. show order + reopen saved design → 6. admin: create a mug live → appears in catalog instantly.
