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
