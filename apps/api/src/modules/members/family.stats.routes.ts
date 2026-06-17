import { Hono } from "hono";
import { authMiddleware } from "../../core/middleware/auth.middleware";
import { prisma } from "../../config/database";

export const familyStatsRoutes = new Hono();

familyStatsRoutes.use("*", authMiddleware);

// GET /family/stats
familyStatsRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");

  const children = await prisma.familyMember.findMany({
    where: { familyId, role: "CHILD" },
    select: {
      id: true,
      name: true,
      color: true,
      avatar: true,
      points: true,
      badges: {
        select: {
          earnedAt: true,
          badge: { select: { name: true, icon: true } },
        },
        orderBy: { earnedAt: "desc" },
      },
      _count: {
        select: {
          assignments: { where: { status: "COMPLETED" } },
        },
      },
    },
    orderBy: { points: "desc" },
  });

  type ChildRow = {
    points: number;
    badges: unknown[];
    _count: { assignments: number };
  };
  const rows = children as ChildRow[];
  const totalPoints = rows.reduce((s, c) => s + c.points, 0);
  const totalTasksCompleted = rows.reduce((s, c) => s + c._count.assignments, 0);
  const totalBadges = rows.reduce((s, c) => s + c.badges.length, 0);

  return c.json({
    success: true,
    data: {
      children,
      summary: { totalPoints, totalTasksCompleted, totalBadges },
    },
  });
});
