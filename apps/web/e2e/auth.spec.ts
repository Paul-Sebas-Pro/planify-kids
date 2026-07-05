import { test, expect } from "@playwright/test";
import { loginAs, DEMO_EMAIL } from "./helpers";

test.describe("Authentification", () => {
  test("login avec credentials valides → dashboard", async ({ page }) => {
    await loginAs(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("login avec mot de passe incorrect → message d'erreur", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/mot de passe/i).fill("mauvais-mdp");
    await page.getByRole("button", { name: /se connecter/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("utilisateur authentifié redirigé vers dashboard depuis /login", async ({ page }) => {
    await loginAs(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("déconnexion → retour sur page par défaut", async ({ page }) => {
    await loginAs(page);
    await page.getByRole("button", { name: /déconnexion/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
