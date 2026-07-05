export type Role = "PARENT" | "CHILD";

export interface Family {
  id: string;
  name: string;
  code?: string | null;
  timezone: string;
  locale: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId?: string;
  name: string;
  avatar?: string;
  color?: string;
  birthDate?: string;
  role: Role;
  points: number;
  createdAt: string;
}

export interface ChildStats {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  points: number;
  badges: Array<{
    earnedAt: string;
    badge: { name: string; icon: string };
  }>;
  _count: { assignments: number };
}

export interface FamilyStatsSummary {
  totalPoints: number;
  totalTasksCompleted: number;
  totalBadges: number;
}

export interface FamilyStats {
  children: ChildStats[];
  summary: FamilyStatsSummary;
}

export interface CreateMemberRequest {
  name: string;
  role: Role;
  color?: string;
  avatar?: string;
  birthDate?: string;
}
