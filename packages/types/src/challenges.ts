export type ChallengeStatus = "ACTIVE" | "COMPLETED" | "FAILED";

export interface FamilyChallenge {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  targetPoints: number;
  bonusPoints: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateChallengeDto {
  title: string;
  description?: string;
  targetPoints: number;
  bonusPoints: number;
  startDate: string;
  endDate: string;
}
