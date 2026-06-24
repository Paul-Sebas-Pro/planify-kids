import type { Notification } from "@planify-kids/types";

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

async function request<T>(method: string, path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const notificationsApi = {
  list: () =>
    request<{ success: boolean; data: Notification[] }>("GET", "/notifications").then(
      (r) => r.data,
    ),

  markRead: (id: string) =>
    request<{ success: boolean }>("PATCH", `/notifications/${id}/read`),

  markAllRead: () =>
    request<{ success: boolean }>("PATCH", "/notifications/read-all"),
};
