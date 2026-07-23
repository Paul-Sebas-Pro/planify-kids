import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  workers: 1,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    baseURL: process.env["BASE_URL"] ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Simule un utilisateur FR (app 100% francophone) — sans ça, la locale
    // par défaut de Chromium headless (en-US) déclenche la détection auto
    // de langue navigateur (i18n/config.ts) et bascule l'UI en anglais,
    // cassant tous les sélecteurs de texte français des specs e2e.
    locale: "fr-FR",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env["CI"]
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:5173",
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
