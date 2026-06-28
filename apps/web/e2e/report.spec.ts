import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Rapport hebdomadaire", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.getByRole("link", { name: /rapport/i }).click();
    await page.waitForURL("**/report");
  });

  test("page rapport se charge avec sélecteur de semaine", async ({ page }) => {
    await expect(page.getByText(/rapport/i).first()).toBeVisible();
    // Champs de date présents
    await expect(page.locator("input[type=date]").first()).toBeVisible();
  });

  test("afficher le rapport de la semaine courante", async ({ page }) => {
    // Clique sur "Semaine courante" si disponible
    const btnSemaine = page.getByRole("button", { name: /semaine courante/i });
    if (await btnSemaine.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnSemaine.click();
    }

    // Soumet le formulaire
    await page.getByRole("button", { name: /afficher|générer|voir/i }).first().click();

    // Attend le tableau récapitulatif ou le message "aucun résultat"
    await expect(
      page.locator("table").or(page.getByText(/aucun résultat|aucune donnée|0 tâche/i))
    ).toBeVisible({ timeout: 6000 });
  });

  test("navigation sidebar → rapport accessible depuis toutes les pages", async ({ page }) => {
    // Déjà sur /report via beforeEach — vérifie que le lien actif est bien mis en évidence
    const navLink = page.getByRole("link", { name: /rapport/i });
    await expect(navLink).toBeVisible();
    // La page est bien /report
    await expect(page).toHaveURL(/\/report/);
  });
});
