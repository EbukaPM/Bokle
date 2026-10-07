// Client-side fetch wrapper: on a 401, tries one silent token refresh
// (access tokens expire every 15 min) before surfacing the error.

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/v1/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const opts: RequestInit = {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  };

  let res = await fetch(url, opts);

  if (res.status === 401 && !url.includes("/auth/")) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(url, opts);
    }
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiError(json?.error || "Request failed", res.status, json?.details);
  }

  return json.data as T;
}

export const api = {
  get: <T = unknown>(url: string) => apiFetch<T>(url),
  post: <T = unknown>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put: <T = unknown>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
