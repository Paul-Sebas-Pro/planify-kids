import type {
  Schedule,
  ScheduleDetail,
  GeneratePlanningRequest,
  ScheduleItemDetail,
  TaskExchange,
  ProposeExchangeRequest,
  RespondExchangeRequest,
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

export const planningApi = {
  generate: (body: GeneratePlanningRequest) =>
    request<{ success: boolean; data: Schedule }>(
      "POST",
      "/planning/generate",
      body,
    ),
  list: () =>
    request<{ success: boolean; data: Schedule[] }>("GET", "/planning"),
  get: (id: string) =>
    request<{ success: boolean; data: ScheduleDetail }>(
      "GET",
      `/planning/${id}`,
    ),
  updateItem: (itemId: string, status: ScheduleItemDetail["status"]) =>
    request<{ success: boolean; data: ScheduleItemDetail }>(
      "PATCH",
      `/planning/items/${itemId}`,
      { status },
    ),
  delete: (id: string) =>
    request<{ success: boolean }>("DELETE", `/planning/${id}`),
};

export const exchangesApi = {
  list: () =>
    request<{ success: boolean; data: TaskExchange[] }>("GET", "/exchanges"),
  propose: (body: ProposeExchangeRequest) =>
    request<{ success: boolean; data: TaskExchange }>(
      "POST",
      "/exchanges",
      body,
    ),
  respond: (id: string, body: RespondExchangeRequest) =>
    request<{ success: boolean; data: TaskExchange }>(
      "PATCH",
      `/exchanges/${id}`,
      body,
    ),
};
