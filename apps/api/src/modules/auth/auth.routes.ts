import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema, loginChildSchema } from "./auth.schema.js";
import {
  registerService,
  loginService,
  loginChildService,
  getFamilyMembersService,
} from "./auth.service.js";
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

// GET /auth/family-members?code=XXXXXX  (public — pour sélection enfant tablette)
authRoutes.get("/family-members", async (c: Context) => {
  const code = c.req.query("code");
  if (!code || code.length !== 6) {
    return c.json({ success: false, error: "Code famille invalide (6 caractères)" }, 400);
  }
  const result = await getFamilyMembersService(code);
  return c.json({ success: true, data: result });
});

// POST /auth/login-child
authRoutes.post(
  "/login-child",
  zValidator("json", loginChildSchema),
  async (c: Context) => {
    const input = c.req.valid("json" as never);
    const result = await loginChildService(input);
    return c.json({ success: true, data: result });
  }
);

// GET /auth/me  (protégée)
authRoutes.get("/me", authMiddleware, (c: Context) => {
  const user = c.get("user");
  return c.json({ success: true, data: user });
});
