import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireRole,
} from "../../core/middleware/auth.middleware.js";
import {
  generatePlanningSchema,
  updateScheduleItemSchema,
  calendarQuerySchema,
} from "./planning.schema.js";
import {
  generatePlanningService,
  listSchedulesService,
  getScheduleService,
  getSchoolCalendarService,
  updateScheduleItemService,
  deleteScheduleService,
} from "./planning.service.js";

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

// GET /planning/calendar?startDate&endDate  (déclaré AVANT /:id, sinon capturé comme id)
planningRoutes.get(
  "/calendar",
  zValidator("query", calendarQuerySchema),
  async (c) => {
    const { familyId } = c.get("user");
    const { startDate, endDate } = c.req.valid("query");
    const entries = await getSchoolCalendarService(familyId, startDate, endDate);
    return c.json({ success: true, data: entries });
  },
);

// GET /planning/:id
planningRoutes.get("/:id", async (c) => {
  const { familyId } = c.get("user");
  const id = c.req.param("id");
  const schedule = await getScheduleService(id, familyId);
  return c.json({ success: true, data: schedule });
});

// PATCH /planning/items/:itemId  (tout membre authentifié de la famille)
planningRoutes.patch(
  "/items/:itemId",
  zValidator("json", updateScheduleItemSchema),
  async (c) => {
    const { familyId, role, memberId } = c.get("user");
    const itemId = c.req.param("itemId");
    const input = c.req.valid("json");
    const item = await updateScheduleItemService(
      itemId,
      { familyId, role, memberId },
      input,
    );
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
