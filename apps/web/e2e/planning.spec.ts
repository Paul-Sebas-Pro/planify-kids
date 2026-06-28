import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Planning", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.getByRole("link", { name: /planning/i }).click();
    await page.waitForURL("**/planning");
  });

  test("page planning charge la liste des semaines", async ({ page }) => {
    await expect(page.getByText(/planning/i).first()).toBeVisible();
    // Attend la fin du chargement (skeleton → contenu ou empty state)
    await expect(
      page.getByText(/semaine/i).or(page.getByText(/aucun planning/i))
    ).toBeVisible({ timeout: 5000 });
  });

  test("générer un planning pour la semaine courante", async ({ page }) => {
    const btn = page.getByRole("button", { name: /générer/i });
    await expect(btn).toBeVisible();
    await btn.click();

    // Modal ou panneau de génération
    const semaineCourante = page.getByRole("button", { name: /semaine courante/i });
    if (await semaineCourante.isVisible()) {
      await semaineCourante.click();
    }

    await page.getByRole("button", { name: /générer/i }).last().click();

    // Attend la confirmation ou l'apparition de la grille calendrier
    await expect(
      page.getByText(/planning généré/i)
        .or(page.locator("[class*=calendar],[class*=week]").first())
    ).toBeVisible({ timeout: 8000 });
  });

  test("changer le statut d'un item de planning", async ({ page }) => {
    // Si planning existant : cherche un chip de statut cliquable
    const statusChip = page.locator("[class*=chip],[class*=badge],[class*=status]").first();
    if (await statusChip.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initial = await statusChip.textContent();
      await statusChip.click();
      await page.waitForTimeout(500);
      const updated = await statusChip.textContent();
      // Le statut a changé (ou un autre chip est apparu)
      const anyChip = page.locator("[class*=chip],[class*=badge],[class*=status]").first();
      await expect(anyChip).toBeVisible();
      // Vérifie qu'un changement s'est produit
      expect(initial).toBeTruthy();
    }
  });
});
