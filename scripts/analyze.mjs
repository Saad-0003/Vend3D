// Cross-platform bundle analysis: `ANALYZE=true next build` is POSIX-only,
// so the env var is set here and next.config.ts reads it.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, ANALYZE: "true" },
});

process.exit(result.status ?? 1);
