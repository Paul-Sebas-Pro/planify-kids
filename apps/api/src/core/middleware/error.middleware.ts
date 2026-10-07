import type { Context } from "hono";
import { AppError } from "../errors/AppError.js";
import { ZodError } from "zod";

export function errorMiddleware(err: unknown, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      { success: false, error: err.message, code: err.code },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      { success: false, error: "Données invalides", details: err.flatten().fieldErrors },
      400
    );
  }

  console.error("Erreur non gérée :", err);
  return c.json({ success: false, error: "Erreur interne du serveur" }, 500);
}
