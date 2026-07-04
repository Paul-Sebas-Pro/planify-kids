import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { prisma } from "../../config/database.js";
import { AppError } from "../../core/errors/AppError.js";

export const familyReportRoutes = new Hono();

familyReportRoutes.use("*", authMiddleware);

const querySchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

// GET /family/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
familyReportRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");

  const parsed = querySchema.safeParse({
    startDate: c.req.query("startDate"),
    endDate: c.req.query("endDate"),
  });

  if (!parsed.success) {
    throw new AppError("startDate et endDate sont requis (YYYY-MM-DD)", 400);
  }

  const { startDate, endDate } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate + "T23:59:59.999Z");

  const [children, items, badges, claims] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId, role: "CHILD" },
      select: { id: true, name: true, avatar: true, color: true },
      orderBy: { name: "asc" },
    }),
    prisma.scheduleItem.findMany({
      where: {
        schedule: { familyId },
        date: { gte: start, lte: end },
      },
      select: {
        assignedToMemberId: true,
        status: true,
        task: { select: { points: true } },
      },
    }),
    prisma.memberBadge.findMany({
      where: {
        member: { familyId },
        earnedAt: { gte: start, lte: end },
      },
      select: { memberId: true },
    }),
    prisma.rewardClaim.findMany({
      where: {
        member: { familyId },
        status: "APPROVED",
        claimedAt: { gte: start, lte: end },
      },
      select: { memberId: true },
    }),
  ]);

  const report = children.map((child) => {
    const childItems = items.filter((i) => i.assignedToMemberId === child.id);
    const completed = childItems.filter((i) => i.status === "COMPLETED");
    const skipped = childItems.filter((i) => i.status === "SKIPPED");
    const pointsEarned = completed.reduce((s, i) => s + i.task.points, 0);
    const badgesEarned = badges.filter((b) => b.memberId === child.id).length;
    const rewardsApproved = claims.filter((cl) => cl.memberId === child.id).length;

    return {
      memberId: child.id,
      name: child.name,
      avatar: child.avatar,
      color: child.color,
      tasksCompleted: completed.length,
      tasksSkipped: skipped.length,
      pointsEarned,
      badgesEarned,
      rewardsApproved,
    };
  });

  return c.json({
    success: true,
    data: { startDate, endDate, children: report },
  });
});
