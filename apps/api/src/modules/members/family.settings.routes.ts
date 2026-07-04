import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  authMiddleware,
  requireRole,
} from "../../core/middleware/auth.middleware.js";
import { prisma } from "../../config/database.js";

export const familySettingsRoutes = new Hono();

familySettingsRoutes.use("*", authMiddleware);

const patchFamilySchema = z.object({
  name: z.string().min(1).max(80),
});

// PATCH /family  (parent uniquement)
familySettingsRoutes.patch(
  "/",
  requireRole("PARENT"),
  zValidator("json", patchFamilySchema),
  async (c) => {
    const { familyId } = c.get("user");
    const { name } = c.req.valid("json");
    const family = await prisma.family.update({
      where: { id: familyId },
      data: { name },
      select: { id: true, name: true },
    });
    return c.json({ success: true, data: family });
  },
);
