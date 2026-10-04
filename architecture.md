# Vend3D — Architecture

> Companion to `plan.md`. This document is the single source of truth for **how the system is structured**. If code and this document disagree, either fix the code or log the change in `DECISIONS.md` and update this file.

---

## 1. System Overview

```
                          ┌────────────────────────────────────────────┐
                          │                 VERCEL (CDN)               │
                          │   Next.js 15 App Router · RSC · ISR        │
                          └───────────────┬────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼──────────────────────────────────┐
        │                                 │                                  │
┌───────▼────────┐              ┌─────────▼─────────┐              ┌─────────▼────────┐
│  BROWSER       │              │  SERVER (Vercel)  │              │  Demo payment    │
│                │   HTTPS      │                   │  (no calls)  │                  │
│ • Storefront   │◄────────────►│ • Server actions  │              │ • Card form (UI) │
│ • 3D customizer│              │ • Route handlers  │              │ • Confirm page   │
│   (WebGL/GPU)  │              │ • Auth middleware │              └──────────────────┘
│ • zustand state│              └────┬───────┬──────┘
└───────┬────────┘                   │       │
        │ direct (anon key, RLS)     │       │ service role / pooled
┌───────▼────────────────────────────▼───────▼─────────────────────────┐
│                           SUPABASE                                   │
│  Postgres (Prisma)  ·  Auth (email + Google OAuth)  ·  Storage + CDN │
│   ├─ buckets: models (public) / uploads (user) / thumbnails (public) │
└──────────────────────────────────────────────────────────────────────┘
```

**Core architectural bet:** all 3D rendering and customization happens **client-side on the user's GPU**. The server never renders 3D. What crosses the wire is only (a) compressed GLB/texture assets from the storage CDN and (b) tiny `DesignConfig` JSON documents. This is why the entire system runs on free tiers.

---

## 2. Application Layers (Next.js)

| Layer             | Location                        | Responsibility                                            |
| ----------------- | ------------------------------- | --------------------------------------------------------- |
| Server Components | `src/app/**/page.tsx` (default) | Data fetching, SEO, catalog rendering                     |
| Client Components | `"use client"` islands          | Customizer canvas, forms, cart badge                      |
| Server Actions    | `src/server/actions/*.ts`       | Authenticated mutations (save design, cart, checkout)     |
| Route Handlers    | `src/app/api/**/route.ts`       | Rate-limited utility endpoints (no payment webhooks)      |
| Middleware        | `src/middleware.ts`             | Session refresh, route protection                         |
| Domain libs       | `src/lib/**`                    | Pure, unit-tested logic (money, design config, cart math) |
| Stores            | `src/stores/*.ts`               | zustand: customizer state, cart mirror                    |

**Rule:** business logic lives in `src/lib` (pure functions) and is called from actions/handlers — never embedded in JSX.

---

## 3. Request Flows

### 3.1 Browse catalog (cached read)

```
Browser → GET /products (ISR, revalidate=300)
        → cache HIT: served from Vercel edge
        → cache MISS: server → unstable_cache('products') → Supabase Postgres → render → store
Admin product mutation → revalidateTag('products') → next request regenerates
```

### 3.2 Customize + save design

```
Browser → GET /customize/[productId] (RSC shell, customizer chunk lazy-loaded)
Model/textures → fetched directly from Supabase Storage CDN (not via API)
User edits → zustand store (client only) → DesignConfig JSON
Save → server action: auth check → zod validate → Postgres INSERT → thumbnail → Storage
```

### 3.3 Checkout (money path — highest rigor, demo payment)

```
1. Browser → /checkout: order summary + demo card form (Visa/Mastercard).
   Card number/expiry/CVC are validated in the browser only and NEVER sent to the server.
2. Browser → server action placeOrder({ checkoutKey, cardBrand, cardLast4 })
   (rate limited, auth required, zod-validated; extra fields rejected)
3. Server: load cart from DB → recompute prices from Product table →
   transaction { create Order(PAID, DEMO_CARD) + OrderItems(with snapshots), clear cart }
   — idempotent on checkoutKey (unique constraint)
4. Browser → /checkout/success?order=<id> (read-only confirmation page)
```

**Invariants on the money path:**

- Client totals are display-only. Server always recomputes.
- OrderItems store `designConfigSnapshot` + `unitPriceCents` so order history survives product edits/deletes.
- `placeOrder` is the ONLY writer of `status = PAID`. The success page never writes.
- No card data (number, expiry, CVC) is ever sent to, stored by, or logged on the server. Only brand + last4 persist.
- No external payment gateway is called. A real Pakistan-supported gateway is Post-MVP (needs a merchant account).

### 3.4 Admin model upload

```
Admin UI → signed upload to Storage bucket `models/` (admin-only write policy)
→ server validates (magic bytes, size) → Product.modelUrl set → revalidateTag
```

---

## 4. Caching Strategy (No Redis — Deliberate)

| Data                   | Mechanism                                      | TTL / invalidation                                                 |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| Catalog pages          | Next.js ISR                                    | `revalidate = 300` + `revalidateTag('products')` on admin mutation |
| Catalog/detail queries | `unstable_cache`                               | tag-based, same as above                                           |
| Model/texture assets   | Supabase Storage CDN + immutable cache headers | content-addressed or versioned URLs                                |
| Design thumbnails      | Storage CDN                                    | overwrite on save (URL contains designId + `?v=updatedAt` to bust) |
| Session                | Supabase JWT (client-held, middleware refresh) | token expiry                                                       |
| Rate limiting          | Postgres sliding-window table                  | — (see §8)                                                         |

**Why no Redis:** Postgres/Supabase have no built-in cache layer, and MVP traffic is served adequately by ISR + CDN. **Post-MVP trigger to add Upstash Redis:** catalog queries measurably hot (>500 rpm), need for distributed rate limiting across >1 region, or session-caching requirements.

---

## 5. Data Model (ERD)

```
Profile ──────────────┐
  id (uuid, = auth.users.id, PK)
  displayName text
  avatarUrl text?
  role enum(customer, admin) default customer
  createdAt

Product
  id uuid PK
  slug text UNIQUE
  name text
  description text
  category enum(SHIRT, MUG, CAP, BOTTLE, OTHER)
  basePriceCents int CHECK (>= 0)
  active bool default true          -- soft delete flag
  previewImageUrl text
  modelUrl text                     -- GLB in storage bucket
  customizableZones jsonb           -- mesh names allowed for decals/text
  createdAt / updatedAt

Design ────────────────────────────► belongs to Profile, Product
  id uuid PK
  userId uuid FK → Profile(id)      ON DELETE CASCADE
  productId uuid FK → Product(id)   ON DELETE RESTRICT
  name text (≤50)
  config jsonb                      -- validated DesignConfig (zod, versioned)
  thumbnailUrl text?
  createdAt / updatedAt
  INDEX (userId, updatedAt DESC)

CartItem
  id uuid PK
  userId uuid FK → Profile(id)      ON DELETE CASCADE
  productId uuid FK → Product(id)   ON DELETE RESTRICT
  designId uuid FK → Design(id)?    ON DELETE SET NULL
  quantity int CHECK (1..10)
  unitPriceCents int                -- snapshot at add-time
  addedAt timestamptz
  UNIQUE (userId, productId, designId)   -- merge duplicates at DB level

Order
  id uuid PK
  userId uuid FK → Profile(id)
  status enum(PENDING, PAID, FAILED, CANCELLED)
  totalCents int
  checkoutKey text UNIQUE           -- idempotency anchor (client UUID per checkout attempt)
  paymentMethod text default 'DEMO_CARD'
  cardBrand enum(VISA, MASTERCARD)  -- display only
  cardLast4 text                    -- display only; full card data is never stored
  createdAt
  INDEX (userId, createdAt DESC)

OrderItem
  id uuid PK
  orderId uuid FK → Order(id)       ON DELETE CASCADE
  productId uuid                    -- no FK: history must survive product deletion
  designId uuid?                    -- no FK for the same reason
  productName text                  -- snapshot
  quantity int
  unitPriceCents int                -- snapshot
  designConfigSnapshot jsonb?       -- immutable copy

RateLimitEntry
  key text PK part (e.g. "login:1.2.3.4", "save:uuid")
  windowStart timestamptz PK part
  count int
```

**Cross-cutting rules**

- Money = integer cents everywhere; format only at the UI edge via `formatCents()`.
- Every FK has an index. Every enum is a Postgres enum (not free text).
- Products are soft-deleted (`active=false`) so order/design history never breaks.
- `updatedAt` maintained by Prisma `@updatedAt`.

---

## 6. Storage Layout & CORS

```
buckets/
  models/                 public read · admin write
    {productSlug}.glb     (Draco+meshopt optimized, textures ≤2048px)
  uploads/                user-scoped
    {userId}/{uuid}.png   decal images (≤2 MB, validated)
  thumbnails/             public read · owner write
    {userId}/{designId}.png
```

- Customizer loads textures with `crossOrigin="anonymous"`; bucket CORS allows `GET` from app origins (localhost:3000 + prod domain).
- Signed upload URLs are minted server-side after auth + rate-limit checks.
- `uploads/` is **private**: read via owner policy or server-side signed URL only.

---

## 7. Security Model

| Surface         | Control                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| AuthN           | Supabase Auth JWT; middleware refresh; server re-verifies on every protected action                                                                  |
| AuthZ (app)     | `requireUser()` / `requireAdmin()` helpers in every server action — ownership (`userId === auth.user.id`) checked in code                            |
| AuthZ (DB)      | RLS enabled on all tables as defense-in-depth (client direct reads where used: own designs/orders only)                                              |
| AuthZ (storage) | Bucket policies per §6                                                                                                                               |
| Payments        | Demo-only: card data never leaves the browser; unique `checkoutKey`; server-side price recompute; no external gateway                                |
| Input           | zod validation on every boundary (actions, handlers, design config)                                                                                  |
| Rate limiting   | Postgres sliding window RPC — see §8                                                                                                                 |
| Headers         | CSP (allow `blob:`, `data:` for three.js textures; Supabase origins), X-Frame-Options DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin |
| XSS             | User text rendered to canvas texture, never HTML; no `dangerouslySetInnerHTML` anywhere                                                              |
| Secrets         | service-role key server-only; zod-validated env; `.env*` gitignored                                                                                  |

**Threat assumptions (documented for the SQA report):** we protect against cross-user data access, price tampering, duplicate/replayed order submissions, XSS via custom text, upload abuse, and brute-force login. We explicitly do NOT defend (MVP) against: DDoS beyond Vercel/Supabase platform defaults, sophisticated bot abuse, or payment fraud (demo payments, no real charges).

---

## 8. Rate Limiting (Postgres sliding window — Redis-free)

```sql
-- RPC: check_rate_limit(p_key text, p_max int, p_window_secs int) returns bool
-- 1. DELETE stale rows for key where windowStart < now() - window
-- 2. UPSERT current window row, count + 1
-- 3. RETURN count <= p_max
```

Applied at: login 5/min/IP · save design 30/min/user · checkout 10/min/user · upload 10/min/user · admin mutations 60/min/user. Exceeded → HTTP 429 + `Retry-After`. Atomicity guaranteed by the single-statement upsert inside one transaction. Documented limitation: cleanup of stale rows happens lazily per-key (acceptable at MVP scale; add a scheduled job post-MVP).

---

## 9. Performance Budget

| Metric                     | Budget                                              |
| -------------------------- | --------------------------------------------------- |
| Storefront initial JS (gz) | < 250 KB (customizer chunk exempt)                  |
| Customizer chunk           | loaded on demand only (`next/dynamic`, `ssr:false`) |
| GLB per product            | ≤ ~2 MB after Draco/meshopt                         |
| Texture max                | 2048px (mobile GPU safety)                          |
| Canvas dpr                 | [1, 1.75]                                           |
| Catalog repeat visit       | served from ISR/edge cache                          |
| k6 smoke (Phase 13)        | 50 VUs / 1 min, p95 < 800 ms on cached catalog      |

---

## 10. Scaling Path (Production Shape)

1. **Stateless server** — no in-memory session/cart state → Vercel scales horizontally by default.
2. **Assets at the edge** — models/textures on CDN; API never serves binaries.
3. **DB** — Supabase compute scales vertically without migration; add read replicas if catalog reads dominate.
4. **Hot reads** → introduce Upstash Redis in front of catalog queries (swap `unstable_cache` wrapper — call sites unchanged).
5. **Rate limiting** → move sliding window to Upstash for cross-region consistency.
6. **Heavy work** (e.g., server-side render of final product previews) → background queue (Upstash QStash) + worker; never block requests.
7. **Observability** → Vercel Analytics + Sentry free tier; structured logs on the money path.

---

## 11. Failure Modes & Fallbacks

| Failure                                 | Behavior                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| WebGL unavailable                       | static preview image + notice                                                                     |
| Model 404/corrupt/timeout (20s)         | error boundary → retry (3×) → preview image                                                       |
| Supabase outage                         | catalog: stale ISR cache serves; mutations: user-friendly error, no partial writes (transactions) |
| `placeOrder` network retry after commit | same `checkoutKey` returns the existing order                                                     |
| Double-submit / two tabs                | idempotent no-op (unique `checkoutKey`)                                                           |
| Thumbnail upload fails                  | design saves anyway, placeholder shown                                                            |
| Session expires mid-flow                | middleware refresh; else 401 → login → return to `?next=`                                         |

---

## 12. Directory Map (target state)

```
src/
  app/                    # routes (RSC shells + page-level client islands)
    (store)/              # /, /products, /products/[slug]
    customize/[productId]/
    cart/ checkout/ orders/ designs/
    admin/                # server-guarded
    api/                  # utility endpoints only
  components/             # ui/ (shadcn), three/ (viewer, customizer), shared/
  lib/                    # money.ts, design/config.ts, cart-math.ts, rate-limit.ts
  server/actions/         # designs.ts, cart.ts, checkout.ts, admin.ts
  server/auth.ts          # requireUser / requireAdmin
  stores/                 # customizer.ts, cart.ts (zustand)
  env.ts                  # zod-validated env
prisma/                   # schema + migrations + seed.ts
docs/                     # sqa/, perf.md, load-test.md, known-limitations.md
tests/                    # unit mirrors src/, e2e/ (playwright), load/ (k6)
```
