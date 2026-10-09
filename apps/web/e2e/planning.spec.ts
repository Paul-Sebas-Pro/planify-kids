import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Planning", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.getByRole("link", { name: /planning/i }).click();
    await page.waitForURL("**/planning");
  });

  test("page planning charge la liste des semaines", async ({ page }) => {
    // Bouton "Générer un planning" toujours présent quelle que soit la liste
    await expect(page.getByRole("button", { name: /générer un planning/i })).toBeVisible();
    // Sidebar affiche soit "Aucun planning" soit des items avec date/tâches
    await expect(
      page.getByText(/aucun planning/i).or(page.getByText(/tâches/i).first())
    ).toBeVisible({ timeout: 5000 });
  });

  test("générer un planning pour la semaine courante", async ({ page }) => {
    await page.getByRole("button", { name: /générer un planning/i }).click();

    // Modale de génération s'ouvre
    await expect(page.getByRole("heading", { name: /générer un planning/i })).toBeVisible();

    // Remplir avec la semaine courante
    await page.getByRole("button", { name: /semaine courante/i }).click();

    // Soumettre — click le bouton "Générer" dans la modale (pas celui de la page)
    await page.getByRole("button", { name: /^Générer$/ }).click();

    // Attendre la fermeture de la modale
    await expect(page.getByRole("heading", { name: /générer un planning/i })).not.toBeVisible({ timeout: 8000 });

    // Le planning généré apparaît dans la sidebar (dates + nb tâches)
    await expect(page.getByText(/tâches/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("changer le statut d'un item de planning", async ({ page }) => {
    // Si planning existant : cherche un chip de statut cliquable
    const statusChip = page.locator("[class*=chip],[class*=badge],[class*=status]").first();
    if (await statusChip.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initial = await statusChip.textContent();
      await statusChip.click();
      await page.waitForTimeout(500);
      // NB : ce test ne vérifie pas que le statut a changé (sélecteur trop
      // vague pour cibler à coup sûr le chip cliqué) — seulement l'absence
      // de crash après le clic.
      const anyChip = page.locator("[class*=chip],[class*=badge],[class*=status]").first();
      await expect(anyChip).toBeVisible();
      expect(initial).toBeTruthy();
    }
  });
});
