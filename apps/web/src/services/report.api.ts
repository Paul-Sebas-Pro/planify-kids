import type { WeeklyReport } from "@planify-kids/types";

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

async function request<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { method: "GET", headers });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as {
      message?: string;
    };
    throw new Error(err.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export const reportApi = {
  get: (startDate: string, endDate: string) =>
    request<{ success: boolean; data: WeeklyReport }>(
      `/family/report?startDate=${startDate}&endDate=${endDate}`,
    ),
};
