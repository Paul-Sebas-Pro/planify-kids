import type { GamificationEvent } from "@planify-kids/types";

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

export const logsApi = {
  list: (params?: { memberId?: string; limit?: number }) => {
    const token = getToken();
    const qs = new URLSearchParams();
    if (params?.memberId) qs.set("memberId", params.memberId);
    if (params?.limit) qs.set("limit", String(params.limit));
    return fetch(`${BASE}/logs?${qs}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((r) => r.json() as Promise<{ success: boolean; data: GamificationEvent[] }>)
      .then((r) => r.data);
  },
};
