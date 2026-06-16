import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireRole,
} from "../../core/middleware/auth.middleware";
import {
  generatePlanningSchema,
  updateScheduleItemSchema,
} from "./planning.schema";
import {
  generatePlanningService,
  listSchedulesService,
  getScheduleService,
  updateScheduleItemService,
  deleteScheduleService,
} from "./planning.service";

export const planningRoutes = new Hono();

planningRoutes.use("*", authMiddleware);

// POST /planning/generate  (parent uniquement)
planningRoutes.post(
  "/generate",
  requireRole("PARENT"),
  zValidator("json", generatePlanningSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const input = c.req.valid("json");
    const schedule = await generatePlanningService(familyId, input);
    return c.json({ success: true, data: schedule }, 201);
  },
);

// GET /planning?limit=N  (défaut 20, max 100)
planningRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 20), 1), 100);
  const schedules = await listSchedulesService(familyId, limit);
  return c.json({ success: true, data: schedules });
});

// GET /planning/:id
planningRoutes.get("/:id", async (c) => {
  const { familyId } = c.get("user");
  const id = c.req.param("id");
  const schedule = await getScheduleService(id, familyId);
  return c.json({ success: true, data: schedule });
});

// PATCH /planning/items/:itemId  (tout membre authentifié)
planningRoutes.patch(
  "/items/:itemId",
  zValidator("json", updateScheduleItemSchema),
  async (c) => {
    const itemId = c.req.param("itemId");
    const input = c.req.valid("json");
    const item = await updateScheduleItemService(itemId, input);
    return c.json({ success: true, data: item });
  },
);

// DELETE /planning/:id  (parent uniquement)
planningRoutes.delete("/:id", requireRole("PARENT"), async (c) => {
  const { familyId } = c.get("user");
  const id = c.req.param("id");
  await deleteScheduleService(id, familyId);
  return c.json({ success: true });
});
