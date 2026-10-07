import type { FamilyChallenge, CreateChallengeDto } from "@planify-kids/types";

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
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: string;
      message?: string;
    };
    throw new Error(err.error ?? err.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const challengesApi = {
  list: () =>
    request<{ success: boolean; data: FamilyChallenge[] }>("GET", "/challenges"),
  create: (body: CreateChallengeDto) =>
    request<{ success: boolean; data: FamilyChallenge }>("POST", "/challenges", body),
  markFailed: (id: string) =>
    request<{ success: boolean; data: FamilyChallenge }>("PATCH", `/challenges/${id}`, { status: "FAILED" }),
};
