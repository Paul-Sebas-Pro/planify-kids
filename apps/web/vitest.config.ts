import { defineConfig } from "vitest/config";
import { resolve } from "path";

// Tests unitaires uniquement : les specs Playwright de e2e/ se lancent avec
// `pnpm e2e` (elles plantent sous Vitest, qui les ramassait par défaut).
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
