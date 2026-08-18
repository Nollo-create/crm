import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Minimal config: keep vitest's default test discovery, add the app's "@/" path
// alias, and stub "server-only" so pure modules that carry the guard remain
// unit-testable (mirrors scripts/run-seed.mjs; app-side protection is unchanged).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest.server-only-stub.ts", import.meta.url)),
    },
  },
});
