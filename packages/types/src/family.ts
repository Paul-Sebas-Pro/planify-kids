export type Role = "PARENT" | "CHILD";

export interface Family {
  id: string;
  name: string;
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

export interface CreateMemberRequest {
  name: string;
  role: Role;
  color?: string;
  avatar?: string;
  birthDate?: string;
}
