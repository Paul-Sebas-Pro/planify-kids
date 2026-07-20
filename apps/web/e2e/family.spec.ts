import { test, expect } from "@playwright/test";

// Régression : l'API renvoie birthDate en ISO datetime complet
// ("2015-06-01T00:00:00.000Z"), mais le formulaire d'édition membre le
// réinjectait tel quel dans un <input type="date"> + react-hook-form.
// Le champ s'affichait vide (le navigateur rejette le format), mais RHF
// soumettait quand même la valeur brute mise en cache par reset() —
// 400 systématique dès qu'on modifiait un membre ayant une date de
// naissance, quel que soit le champ réellement changé.
test.describe("Famille — édition membre", () => {
  test("modifier un membre avec date de naissance n'envoie pas un birthDate invalide", async ({
    page,
  }) => {
    const fakeMember = {
      id: "member-1",
      familyId: "fam-1",
      name: "Alice",
      role: "CHILD",
      color: "#FF9800",
      avatar: "🦊",
      birthDate: "2015-06-01T00:00:00.000Z",
      points: 10,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    await page.route("**/api/family/members", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ json: { success: true, data: [fakeMember] } });
      }
      return route.continue();
    });

    let patchBody: unknown = null;
    await page.route("**/api/family/members/member-1", (route) => {
      if (route.request().method() === "PATCH") {
        patchBody = route.request().postDataJSON();
        return route.fulfill({ json: { success: true, data: fakeMember } });
      }
      return route.continue();
    });

    await page.addInitScript((member) => {
      localStorage.setItem(
        "auth-store",
        JSON.stringify({
          state: {
            token: "fake-token",
            user: { id: "user-1", email: "demo@planify.kids" },
            family: { id: "fam-1", name: "Demo" },
            member,
          },
          version: 0,
        }),
      );
    }, fakeMember);

    await page.goto("/family");
    await page.getByText("Alice").first().waitFor();

    // Le champ affiche bien la date (pas vide, pas rejetée par le navigateur)
    await page.getByText("Modifier").first().click();
    await expect(page.locator('input[type="date"]')).toHaveValue("2015-06-01");

    await page.getByRole("button", { name: /^Enregistrer$/ }).click();

    // La modale doit disparaître entièrement — pas juste changer de heading.
    // Un bug déjà rencontré ici : editTarget repassait à null sans que
    // showForm ne repasse à false, donc la modale restait ouverte mais son
    // heading changeait silencieusement de "Modifier le membre" à "Nouveau
    // membre" (un check restreint au seul heading "Modifier" passait à tort).
    await expect(page.getByRole("heading", { name: /modifier le membre/i })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /nouveau membre/i })).not.toBeVisible();

    expect(patchBody).toMatchObject({ birthDate: "2015-06-01" });
  });
});
