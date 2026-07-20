export type RewardStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Reward {
  id: string;
  familyId: string;
  name: string;
  icon: string;
  pointsCost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardClaim {
  id: string;
  memberId: string;
  rewardId: string;
  status: RewardStatus;
  claimedAt: string;
  reward: { name: string; icon: string; pointsCost: number };
  member: { name: string; color?: string; avatar?: string };
}

export interface CreateRewardRequest {
  name: string;
  icon: string;
  pointsCost: number;
}

export interface UpdateRewardRequest {
  name?: string;
  icon?: string;
  pointsCost?: number;
}

export interface ClaimRewardRequest {
  memberId: string;
}

export interface ReviewClaimRequest {
  status: "APPROVED" | "REJECTED";
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  conditionValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemberBadge {
  id: string;
  memberId: string;
  badgeId: string;
  earnedAt: string;
  badge: Badge;
}
