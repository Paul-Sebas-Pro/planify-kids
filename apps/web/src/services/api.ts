import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  Family,
  FamilyMember,
  CreateMemberRequest,
  TaskTemplate,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "@planify-kids/types";

const BASE = "/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = (await res
      .json()
      .catch(() => ({ message: res.statusText }))) as {
      message?: string;
    };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponseData {
  tokens: AuthTokens;
  user: { id: string; email: string };
  family: Family;
  member: FamilyMember;
}

export const authApi = {
  login: (body: LoginRequest) =>
    request<{ success: boolean; data: AuthResponseData }>(
      "POST",
      "/auth/login",
      body,
    ),
  register: (body: RegisterRequest) =>
    request<{ success: boolean; data: AuthResponseData }>(
      "POST",
      "/auth/register",
      body,
    ),
  me: () =>
    request<{
      success: boolean;
      data: { sub: string; familyId: string; role: string };
    }>("GET", "/auth/me"),
};

// ─── Members ─────────────────────────────────────────────────────────────────

export const membersApi = {
  list: () =>
    request<{ success: boolean; data: FamilyMember[] }>(
      "GET",
      "/family/members",
    ),
  create: (body: CreateMemberRequest) =>
    request<{ success: boolean; data: FamilyMember }>(
      "POST",
      "/family/members",
      body,
    ),
  update: (id: string, body: Partial<CreateMemberRequest>) =>
    request<{ success: boolean; data: FamilyMember }>(
      "PATCH",
      `/family/members/${id}`,
      body,
    ),
  delete: (id: string) =>
    request<{ success: boolean }>("DELETE", `/family/members/${id}`),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksApi = {
  list: (all = false) =>
    request<{ success: boolean; data: TaskTemplate[] }>(
      "GET",
      `/tasks${all ? "?all=true" : ""}`,
    ),
  create: (body: CreateTaskRequest) =>
    request<{ success: boolean; data: TaskTemplate }>("POST", "/tasks", body),
  update: (id: string, body: UpdateTaskRequest) =>
    request<{ success: boolean; data: TaskTemplate }>(
      "PATCH",
      `/tasks/${id}`,
      body,
    ),
  delete: (id: string) =>
    request<{ success: boolean }>("DELETE", `/tasks/${id}`),
};
