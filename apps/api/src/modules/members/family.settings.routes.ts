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

const CALENDAR_ZONES = [
  "ZONE_A",
  "ZONE_B",
  "ZONE_C",
  "GUADELOUPE",
  "GUYANE",
  "MARTINIQUE",
  "LA_REUNION",
  "MAYOTTE",
  "NOUVELLE_CALEDONIE",
  "POLYNESIE_FRANCAISE",
  "SAINT_PIERRE_ET_MIQUELON",
  "WALLIS_ET_FUTUNA",
] as const;

const patchFamilySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  schoolZone: z.enum(CALENDAR_ZONES).nullable().optional(),
});

// GET /family  (parent uniquement) — inclut le code famille pour le login enfant tablette
familySettingsRoutes.get("/", requireRole("PARENT"), async (c) => {
  const { familyId } = c.get("user");
  const family = await prisma.family.findUniqueOrThrow({
    where: { id: familyId },
    select: { id: true, name: true, code: true, schoolZone: true },
  });
  return c.json({ success: true, data: family });
});

// PATCH /family  (parent uniquement)
familySettingsRoutes.patch(
  "/",
  requireRole("PARENT"),
  zValidator("json", patchFamilySchema),
  async (c) => {
    const { familyId } = c.get("user");
    const body = c.req.valid("json");
    const family = await prisma.family.update({
      where: { id: familyId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.schoolZone !== undefined && { schoolZone: body.schoolZone }),
      },
      select: { id: true, name: true, code: true, schoolZone: true },
    });
    return c.json({ success: true, data: family });
  },
);
