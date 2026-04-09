import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { registerService, loginService } from "./auth.service.js";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";

export const authRoutes = new Hono();

// POST /auth/register
authRoutes.post(
  "/register",
  zValidator("json", registerSchema),
  async (c: Context) => {
    const input = c.req.valid("json" as never);
    const result = await registerService(input);
    return c.json({ success: true, data: result }, 201);
  }
);

// POST /auth/login
authRoutes.post(
  "/login",
  zValidator("json", loginSchema),
  async (c: Context) => {
    const input = c.req.valid("json" as never);
    const result = await loginService(input);
    return c.json({ success: true, data: result });
  }
);

// GET /auth/me  (protégée)
authRoutes.get("/me", authMiddleware, (c: Context) => {
  const user = c.get("user");
  return c.json({ success: true, data: user });
});
