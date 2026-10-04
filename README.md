# Vend3D

A 3D print-on-demand storefront: browse blank products, customize color, material, decals and
text in a live in-browser 3D studio, save designs, and check out with a **demo** card form. No
real payment gateway is integrated and no card data ever leaves the browser.

The project is built phase by phase from [`plan.md`](./plan.md) against
[`ARCHITECTURE.md`](./ARCHITECTURE.md), with every deviation logged in
[`DECISIONS.md`](./DECISIONS.md) and the rules of engagement in [`AGENTS.md`](./AGENTS.md).

**Status:** Phase 1 complete (project scaffolding & design system). Phases 2–14 are not built
yet — the routes below render placeholders.

## Requirements

- Node.js 20 or newer
- npm (a committed `package-lock.json` pins every dependency)
- A free-tier Supabase project (Auth + Postgres + Storage) — needed from Phase 2 onward

## Setup

```bash
npm install
cp .env.example .env.local     # then fill in every value
npm run dev
```

The app is at <http://localhost:3000>.

### Environment variables

| Variable                        | Scope           | Purpose                                                         |
| ------------------------------- | --------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client          | Supabase project URL                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client          | public anon key, RLS-scoped                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only** | bypasses RLS; never in a client bundle or a `NEXT_PUBLIC_*` var |
| `DATABASE_URL`                  | server          | pooled Postgres connection (port 6543) for Prisma               |
| `DIRECT_URL`                    | server          | direct connection (port 5432) for migrations                    |
| `NEXT_PUBLIC_APP_URL`           | client          | canonical app origin                                            |

`src/env.ts` validates all six with zod and the server boots through
`src/instrumentation.ts`, so a missing or malformed value fails immediately with the offending
key named — never a silent 500 later. `.env*` is gitignored; `.env.example` is committed with
empty values only.

## Scripts

| Command                   | What it does                                       |
| ------------------------- | -------------------------------------------------- |
| `npm run dev`             | local dev server                                   |
| `npm run build`           | production build (also type-checks and lints)      |
| `npm run start`           | serve the production build                         |
| `npm run lint`            | ESLint (`next/core-web-vitals`, `next/typescript`) |
| `npm run typecheck`       | `tsc --noEmit`                                     |
| `npm run test`            | Vitest unit/component suite                        |
| `npm run test:e2e`        | Playwright suite (Chromium + WebKit)               |
| `npm run format`          | Prettier write (`format:check` verifies)           |
| `npm run db:migrate`      | `prisma migrate dev` (Phase 2)                     |
| `npm run db:seed`         | `prisma db seed` (Phase 2)                         |
| `npm run optimize:models` | gltf-transform Draco/meshopt pipeline (Phase 11)   |
| `npm run analyze`         | production build with the bundle analyzer          |

Playwright browsers install once with `npx playwright install`.

> Run `npm run build` only when no dev server is running — both write to `.next`, and a concurrent
> `npm run dev` corrupts the build output (see DECISIONS D-025).

## Routes

| Route                         | Phase | State                                               |
| ----------------------------- | ----- | --------------------------------------------------- |
| `/`                           | 1     | storefront: hero, featured collection, how it works |
| `/products`, `/products/[id]` | 4     | placeholders                                        |
| `/customize/[productId]`      | 5–6   | placeholder                                         |
| `/cart`                       | 8     | placeholder                                         |
| `/checkout`                   | 9     | placeholder (demo card form comes later)            |
| `/orders`                     | 9     | placeholder                                         |
| `/designs`                    | 7     | placeholder                                         |
| `/admin`                      | 10    | placeholder                                         |
| `/login`, `/signup`           | 3     | placeholder forms                                   |

Unknown paths render `src/app/not-found.tsx`; an unhandled render error renders
`src/app/error.tsx` with a working "Try again" reset.

## Design system

`src/app/globals.css` holds the tokens from `docs/ui-reference/DESIGN.md`: dark obsidian stage
`#0A0A0B`, recessed deck `#121214`, elevated glass `#1A1A1D`, hairline borders at 8% white,
Geist type, and the Acid Lime accent `#C6F135` exposed as `--color-signal`. The accent is a
functional marker only — active swatch rings, the status dot, the active tool pip and slider
fill — never a button or badge fill. shadcn/ui (Radix primitives) provides the component layer
in `src/components/ui`.

## Architecture in one paragraph

Next.js 15 App Router with React Server Components by default; all 3D rendering and
customization happen client-side on the user's GPU via three.js + React Three Fiber, loaded in
a lazy `next/dynamic` chunk. The server only ever handles tiny `DesignConfig` JSON documents
and asset URLs, which is what keeps the whole system on free tiers. Business logic lives in
pure functions under `src/lib`, mutations in thin server actions under `src/server/actions`,
and every user-scoped read/write re-checks ownership in code because Prisma connects with the
service role and therefore bypasses RLS.

## License / attribution

Course project. Design mockups in `docs/ui-reference/` are human-supplied references and are
not part of the shipped app.
