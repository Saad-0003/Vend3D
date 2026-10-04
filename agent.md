# Vend3D — Agent Instructions (Rules of Engagement)

> **Read this file first, before any code.** You are a coding agent building Vend3D, a 3D product-customization storefront, by executing `plan.md` phase by phase. `architecture.md` defines the system you are building. These three files are your contract.
>
> Suggested use: paste this file into your agent's system/instruction context, keep `plan.md` and `architecture.md` in the repo root, and hand the agent **one phase at a time**.

---

## 1. Mission

Build the MVP defined in `plan.md` — nothing more, nothing less. You win by finishing all 14 phases with green tests, not by adding clever extras. **MVP discipline is a feature.**

---

## 2. Workflow for Every Task (non-negotiable)

1. **Read** the current phase in `plan.md` plus relevant `architecture.md` sections before writing code.
2. **Implement** the phase's tasks. Check boxes as you complete them.
3. **Verify:** `npm run lint && npm run typecheck && npm run test && npm run build` — all must pass.
4. **Prove it against Acceptance Criteria.** Do not mark a phase `- [x]` until every criterion is met and its tests exist and pass.
5. **Commit:** `phase-N: <short summary>` with a body listing key decisions.
6. **Log deviations** in `DECISIONS.md` (what, why, alternatives rejected). Deviation without a log entry = task failure.
7. If blocked (missing credential, ambiguous requirement): **stop and ask the human** — never guess credentials, never silently widen scope, never stub-and-forget.

---

## 3. Hard Rules (violating any of these = redo the work)

### Money

- Money is **integer cents** end-to-end. Floats are forbidden for currency. Formatting happens only at the UI edge via `formatCents()`.

### Security

- `SUPABASE_SERVICE_ROLE_KEY` never appears in client components, `NEXT_PUBLIC_` vars, or committed files.
- Every protected server action starts with `requireUser()` or `requireAdmin()` — no exceptions, no "it's only called from the UI so it's safe."
- Every request body, query param set, and `DesignConfig` is validated with **zod** before use.
- Ownership checks in code on every user-scoped read/write (`userId === session.user.id`). RLS is backup, not the primary guard.
- Demo payments: card number, expiry and CVC never leave the browser — never send, store, or log them (only brand + last4 persist). `placeOrder` is the only writer of `status = PAID`, idempotent on `checkoutKey`. The success page only reads orders.
- No `dangerouslySetInnerHTML`. User text is rendered to canvas textures, never to HTML.
- Never commit secrets. If a secret leaks into git history, stop and tell the human immediately.

### Data

- Schema changes only via new Prisma migrations — never hand-edit the DB or old migrations.
- Products are soft-deleted (`active=false`). Order/design history must survive product deletion.
- Every FK indexed; every list query paginated or bounded.

### Code quality

- TypeScript **strict**; `any` is banned unless a comment justifies it (rare).
- Server Components by default; `"use client"` only where interactivity demands it.
- Business logic in pure functions under `src/lib` (unit-testable); server actions are thin wrappers.
- No new dependencies without logging why in `DECISIONS.md` (check bundle impact).
- No `waitForTimeout` in Playwright — use locator assertions.

### 3D-specific

- R3F canvas: `dpr={[1, 1.75]}`, lazy-loaded via `next/dynamic` with `ssr:false`.
- Textures ≤2048px, loaded with `crossOrigin="anonymous"`.
- Always dispose geometries/materials/textures on unmount.
- Every model load path has: suspense fallback, error boundary, 20s timeout, WebGL-unavailable fallback.

### Scope

- Do not build anything in `plan.md` "Out of Scope" or "Post-MVP" — including "harmless little stubs."
- Do not add Redis, queues, email sending, or any real payment gateway. The architecture deliberately omits them for MVP.

---

## 4. Commands

```bash
npm run dev            # local dev (requires .env.local — copy from .env.example)
npm run lint           # eslint — must be clean
npm run typecheck      # tsc --noEmit — must be clean
npm run test           # vitest unit/integration
npm run test:e2e       # playwright (headless)
npm run build          # production build — must pass before any phase is marked done
npm run db:migrate     # prisma migrate dev
npm run db:seed        # idempotent seed
npm run optimize:models# gltf-transform pipeline (Phase 11)
```

If any command fails and you didn't cause it, fix the cause — never paper over it (no `--force`, no disabling checks, no `@ts-ignore` as a lifestyle).

---

## 5. Definition of Done (per phase)

- [ ] All phase tasks checked in `plan.md`
- [ ] Phase tests written and passing; coverage does not regress
- [ ] lint + typecheck + build green
- [ ] Edge cases listed in the phase are handled (not just the happy path)
- [ ] Deviations logged in `DECISIONS.md`
- [ ] Commit made with phase message

---

## 6. Common Pitfalls (learned wisdom — don't rediscover these)

1. **Client recomputing prices** — display only; the server always recomputes from DB at checkout.
2. **Double-submit checkout** — disable button on submit + client-generated `checkoutKey` + unique `checkoutKey` on Order.
3. **Success page writing state** — it only reads the order (ownership-checked); `placeOrder` is the only PAID writer.
4. **Next.js caching surprises** — after admin mutations you must call `revalidateTag`; catalog staleness bugs are almost always a missing invalidation.
5. **three.js in the main bundle** — if the storefront's initial JS balloons past 250 KB, the customizer chunk leaked into a shared import graph. Keep three imports inside `components/three/` and dynamic boundaries.
6. **Decal texture CORS** — if decals render black/blank, it's CORS or a missing `crossOrigin` attribute, almost never the decal math.
7. **Prisma vs Supabase RLS** — Prisma uses the service connection and bypasses RLS; that's why ownership checks in server code are mandatory.
8. **Seed idempotency** — upsert by slug; tests run seed twice.
9. **Versioned DesignConfig** — never read a config without zod validation; unknown `version` = friendly error, not a crash.
10. **Env drift** — new env var? Add to `.env.example` AND `src/env.ts` in the same commit.

---

## 7. What to Ask the Human (stop-and-ask triggers)

- Any missing credential or Supabase/Vercel access
- A requirement that contradicts `architecture.md` or a prior `DECISIONS.md` entry
- Anything needing a paid tier or credit card
- Temptation to add a dependency with native binaries or heavy bundle cost
- Test failures you cannot reproduce locally

---

## 8. Tone & Output Conventions

- Be terse in code comments: explain _why_, not _what_.
- Prefer deleting code over adding abstractions; three similar lines beat a premature helper.
- Match existing file conventions before inventing new ones.
- Every user-facing string in plain, friendly English; every error message actionable ("Upload failed: PNG/JPG/SVG under 2 MB only").
