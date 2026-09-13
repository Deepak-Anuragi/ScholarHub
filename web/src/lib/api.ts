const API_SERVER =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

function normalizeEndpoint(endpoint: string): string {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;

  // When called on the server side (SSR / Server Component), hit the Express server directly.
  // When called in the browser, route through the Next.js rewrite proxy (/api/...)
  if (typeof window === "undefined") {
    return `${API_SERVER}${apiPath}`;
  }
  return apiPath;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("scholars_token") || localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const api = {
  async get<T = unknown>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = normalizeEndpoint(endpoint);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      ...init,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        (errorBody as { error?: string })?.error ??
          `Request failed with status ${res.status}`
      );
    }

    return res.json() as Promise<T>;
  },

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    init?: RequestInit
  ): Promise<T> {
    const url = normalizeEndpoint(endpoint);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        (errorBody as { error?: string })?.error ??
          `Request failed with status ${res.status}`
      );
    }

    return res.json() as Promise<T>;
  },

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    init?: RequestInit
  ): Promise<T> {
    const url = normalizeEndpoint(endpoint);
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        (errorBody as { error?: string })?.error ??
          `Request failed with status ${res.status}`
      );
    }

    return res.json() as Promise<T>;
  },

  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    init?: RequestInit
  ): Promise<T> {
    const url = normalizeEndpoint(endpoint);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        (errorBody as { error?: string })?.error ??
          `Request failed with status ${res.status}`
      );
    }

    return res.json() as Promise<T>;
  },

  async delete<T = unknown>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = normalizeEndpoint(endpoint);
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      ...init,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        (errorBody as { error?: string })?.error ??
          `Request failed with status ${res.status}`
      );
    }

    return res.json() as Promise<T>;
  },
};
