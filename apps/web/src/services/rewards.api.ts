import type {
  Reward,
  RewardClaim,
  CreateRewardRequest,
  UpdateRewardRequest,
  ClaimRewardRequest,
  ReviewClaimRequest,
  Badge,
  MemberBadge,
} from "@planify-kids/types";

const BASE = "/api";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("auth-store");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as {
      message?: string;
    };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const rewardsApi = {
  list: () =>
    request<{ success: boolean; data: Reward[] }>("GET", "/rewards"),
  create: (body: CreateRewardRequest) =>
    request<{ success: boolean; data: Reward }>("POST", "/rewards", body),
  update: (id: string, body: UpdateRewardRequest) =>
    request<{ success: boolean; data: Reward }>("PATCH", `/rewards/${id}`, body),
  delete: (id: string) =>
    request<{ success: boolean }>("DELETE", `/rewards/${id}`),
  listClaims: () =>
    request<{ success: boolean; data: RewardClaim[] }>("GET", "/rewards/claims"),
  claim: (rewardId: string, body: ClaimRewardRequest) =>
    request<{ success: boolean; data: RewardClaim }>("POST", `/rewards/${rewardId}/claim`, body),
  reviewClaim: (claimId: string, body: ReviewClaimRequest) =>
    request<{ success: boolean; data: RewardClaim }>("PATCH", `/rewards/claims/${claimId}`, body),
};

export const badgesApi = {
  list: () =>
    request<{ success: boolean; data: Badge[] }>("GET", "/badges"),
  forMember: (memberId: string) =>
    request<{ success: boolean; data: MemberBadge[] }>("GET", `/badges/member/${memberId}`),
};
