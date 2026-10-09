import { describe, it, expect } from "vitest";
import { apiErrorMessage } from "./http-error";

const json = (body: unknown, status = 400, statusText = "Bad Request") =>
  new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });

describe("apiErrorMessage", () => {
  it("lit le champ `error` renvoyé par l'API", async () => {
    const res = json({ success: false, error: "Email ou mot de passe incorrect" }, 401);
    expect(await apiErrorMessage(res)).toBe("Email ou mot de passe incorrect");
  });

  it("message de verrouillage (429) affiché tel quel", async () => {
    const res = json(
      { success: false, error: "Trop de tentatives. Réessayez dans 15 min." },
      429,
    );
    expect(await apiErrorMessage(res)).toBe(
      "Trop de tentatives. Réessayez dans 15 min.",
    );
  });

  it("repli sur `message` si `error` absent", async () => {
    expect(await apiErrorMessage(json({ message: "Rôle insuffisant" }, 403))).toBe(
      "Rôle insuffisant",
    );
  });

  it("corps non JSON — repli sur statusText", async () => {
    const res = new Response("<html>Bad gateway</html>", {
      status: 502,
      statusText: "Bad Gateway",
    });
    expect(await apiErrorMessage(res)).toBe("Bad Gateway");
  });

  it("HTTP/2 (statusText vide) et corps non JSON — repli sur le code HTTP", async () => {
    const res = new Response("<html></html>", { status: 502, statusText: "" });
    expect(await apiErrorMessage(res)).toBe("HTTP 502");
  });

  it("champ error vide — ignoré", async () => {
    expect(await apiErrorMessage(json({ error: "" }, 500, ""))).toBe("HTTP 500");
  });
});
