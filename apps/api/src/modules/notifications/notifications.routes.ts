import { Hono } from "hono";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import {
  listNotificationsService,
  markReadService,
  markAllReadService,
} from "./notifications.service.js";

export const notificationsRoutes = new Hono();

notificationsRoutes.use("*", authMiddleware);

// GET /notifications
notificationsRoutes.get("/", async (c) => {
  const { memberId, familyId } = c.get("user");
  const notifications = await listNotificationsService(memberId, familyId);
  return c.json({ success: true, data: notifications });
});

// PATCH /notifications/read-all
notificationsRoutes.patch("/read-all", async (c) => {
  const { memberId, familyId } = c.get("user");
  await markAllReadService(memberId, familyId);
  return c.json({ success: true });
});

// PATCH /notifications/:id/read
notificationsRoutes.patch("/:id/read", async (c) => {
  const { memberId, familyId } = c.get("user");
  const id = c.req.param("id");
  await markReadService(id, memberId, familyId);
  return c.json({ success: true });
});
