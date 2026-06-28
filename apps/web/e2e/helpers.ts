import type { Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@planify.kids";
export const DEMO_PASSWORD = "demo1234";

export async function loginAs(page: Page, email = DEMO_EMAIL, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL("**/dashboard");
}
