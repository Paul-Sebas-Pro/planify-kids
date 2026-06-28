import { Hono } from "hono";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { GamificationLog } from "../../config/gamification-log.model.js";

export const logsRoutes = new Hono();

logsRoutes.use("*", authMiddleware);

// GET /logs?memberId=&limit=
logsRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");
  const memberId = c.req.query("memberId");
  const limit = Math.min(
    Math.max(Number(c.req.query("limit") ?? 50), 1),
    100,
  );

  const filter: Record<string, string> = { familyId };
  if (memberId) filter.memberId = memberId;

  const logs = await GamificationLog.find(filter)
    .sort({ ts: -1 })
    .limit(limit)
    .lean();

  return c.json({ success: true, data: logs });
});
