import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireRole,
} from "../../core/middleware/auth.middleware.js";
import { createTaskSchema, updateTaskSchema } from "./tasks.schema.js";
import {
  listTasksService,
  createTaskService,
  updateTaskService,
  deleteTaskService,
} from "./tasks.service.js";

export const tasksRoutes = new Hono();

tasksRoutes.use("*", authMiddleware);

// GET /tasks?all=true  (active par défaut, all=true pour tout afficher)
tasksRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");
  const activeOnly = c.req.query("all") !== "true";
  const tasks = await listTasksService(familyId, activeOnly);
  return c.json({ success: true, data: tasks });
});

// POST /tasks  (parent uniquement)
tasksRoutes.post(
  "/",
  requireRole("PARENT"),
  zValidator("json", createTaskSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const input = c.req.valid("json");
    const task = await createTaskService(familyId, input);
    return c.json({ success: true, data: task }, 201);
  },
);

// PATCH /tasks/:id  (parent uniquement)
tasksRoutes.patch(
  "/:id",
  requireRole("PARENT"),
  zValidator("json", updateTaskSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const task = await updateTaskService(id, familyId, input);
    return c.json({ success: true, data: task });
  },
);

// DELETE /tasks/:id  (parent uniquement)
tasksRoutes.delete("/:id", requireRole("PARENT"), async (c) => {
  const { familyId } = c.get("user");
  const id = c.req.param("id");
  await deleteTaskService(id, familyId);
  return c.json({ success: true });
});
