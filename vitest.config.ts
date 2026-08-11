import { defineConfig } from "vitest/config";

/** Unit tests deliberately use a plain Node runner, isolated from the Worker build. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: false,
  },
});

