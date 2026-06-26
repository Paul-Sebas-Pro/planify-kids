export interface ChildReport {
  memberId: string;
  name: string;
  avatar: string | null;
  color: string | null;
  tasksCompleted: number;
  tasksSkipped: number;
  pointsEarned: number;
  badgesEarned: number;
  rewardsApproved: number;
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  children: ChildReport[];
}
