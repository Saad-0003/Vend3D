import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // GLB imports resolve to hashed asset URLs in the webpack build (next.config.ts
  // `asset/resource`); Vite needs to treat them as assets too, or importing
  // `products/config` parses the binary as JavaScript.
  assetsInclude: ["**/*.glb"],
  // Vite crashes loading the Tailwind string-plugin PostCSS config when a test
  // imports a CSS module; tests don't need Tailwind output, so inline an empty
  // config instead of the project file. ()
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx", "src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "tests/e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**", "src/stores/**", "src/server/actions/**"],
    },
  },
});
