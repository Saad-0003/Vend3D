import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Only in CI: one retry absorbs flake, never masks a real failure locally.
  retries: process.env.CI ? 1 : 0,
  /**
   * One worker locally, same as CI.
   *
   * `next dev` compiles each route on its first hit and those compiles are
   * CPU-bound and serial per route — on this machine `/customize/[productId]`
   * alone takes ~4s of 3719 modules. Two browsers cold-hitting different routes
   * at once starve each other, and what a starved navigation looks like is a
   * product bug that is not there: `router.push` sits waiting on a flight
   * payload that has not arrived (sign-up completes, the navbar flips to the
   * signed-in menu, yet the URL never leaves `/signup`), or hydration never
   * lands and the submit button stays disabled for the whole timeout. The
   * checkout spec already avoids the studio route for the same reason
   * ("compiling it in every parallel worker starves the rest of the suite").
   *
   * Verified: 58/58 with a cold dev server at one worker; 57/58 at two, with
   * the depending failure mode changing between runs. Serialising costs a few
   * minutes locally and removes a whole class of false failures.
   */
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    // No hard waitForTimeout in specs (agent.md §3).
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
