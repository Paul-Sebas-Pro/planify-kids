import * as argon2 from "argon2";
import { prisma } from "../../config/database";
import type { CreateMemberInput, UpdateMemberInput } from "./members.schema";

export function getMembersByFamily(familyId: string) {
  return prisma.familyMember.findMany({
    where: { familyId },
    orderBy: { createdAt: "asc" },
  });
}

export function getMemberById(id: string, familyId: string) {
  return prisma.familyMember.findFirst({
    where: { id, familyId },
  });
}

export function createMember(familyId: string, input: CreateMemberInput) {
  return prisma.familyMember.create({
    data: {
      familyId,
      name: input.name,
      role: input.role,
      color: input.color ?? null,
      avatar: input.avatar ?? null,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
    },
  });
}

export function updateMember(id: string, input: UpdateMemberInput) {
  return prisma.familyMember.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
      ...(input.birthDate !== undefined && {
        birthDate: new Date(input.birthDate),
      }),
    },
  });
}

export function deleteMember(id: string) {
  return prisma.familyMember.delete({ where: { id } });
}

export async function updateMemberPin(id: string, pin: string) {
  const hash = await argon2.hash(pin);
  return prisma.familyMember.update({ where: { id }, data: { pin: hash } });
}

export async function getMemberTimelineData(memberId: string) {
  const [completedTasks, earnedBadges, approvedClaims] = await Promise.all([
    prisma.scheduleItem.findMany({
      where: { assignedToMemberId: memberId, status: "COMPLETED" },
      include: { task: { select: { name: true, points: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.memberBadge.findMany({
      where: { memberId },
      include: { badge: { select: { name: true, description: true, icon: true } } },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.rewardClaim.findMany({
      where: { memberId, status: "APPROVED" },
      include: { reward: { select: { name: true, pointsCost: true, icon: true } } },
      orderBy: { claimedAt: "desc" },
    }),
  ]);

  type Event = {
    type: "TASK_COMPLETED" | "BADGE_EARNED" | "REWARD_CLAIMED";
    date: string;
    title: string;
    description: string | null;
    points: number | null;
    icon: string | null;
  };

  const events: Event[] = [
    ...completedTasks.map((item) => ({
      type: "TASK_COMPLETED" as const,
      date: item.date.toISOString(),
      title: item.task.name,
      description: null,
      points: item.task.points,
      icon: null,
    })),
    ...earnedBadges.map((mb) => ({
      type: "BADGE_EARNED" as const,
      date: mb.earnedAt.toISOString(),
      title: mb.badge.name,
      description: mb.badge.description,
      points: null,
      icon: mb.badge.icon,
    })),
    ...approvedClaims.map((claim) => ({
      type: "REWARD_CLAIMED" as const,
      date: claim.claimedAt.toISOString(),
      title: claim.reward.name,
      description: null,
      points: -claim.reward.pointsCost,
      icon: claim.reward.icon,
    })),
  ];

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events.slice(0, 100);
}
