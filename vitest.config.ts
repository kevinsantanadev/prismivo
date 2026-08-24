import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

/** Unit tests deliberately use a plain Node runner, isolated from the Worker build. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: false,
  },
});
