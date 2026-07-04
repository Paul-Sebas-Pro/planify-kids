import { Hono } from "hono";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { prisma } from "../../config/database.js";

export const badgesRoutes = new Hono();

badgesRoutes.use("*", authMiddleware);

// GET /badges  - liste tous les badges disponibles
badgesRoutes.get("/", async (c) => {
  const badges = await prisma.badge.findMany({
    orderBy: { conditionValue: "asc" },
  });
  return c.json({ success: true, data: badges });
});

// GET /badges/member/:memberId  - badges gagnés par un membre
badgesRoutes.get("/member/:memberId", async (c) => {
  const memberId = c.req.param("memberId");
  const memberBadges = await prisma.memberBadge.findMany({
    where: { memberId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });
  return c.json({ success: true, data: memberBadges });
});
