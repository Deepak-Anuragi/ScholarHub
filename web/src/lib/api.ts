import {
  libraries,
  libraryDetails,
  libraryReviews,
  librarySlots,
} from "./mock-data";

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

export const api = {
  async get<T = unknown>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = normalizeEndpoint(endpoint);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
        "Content-Type": "application/json",
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
        "Content-Type": "application/json",
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
        "Content-Type": "application/json",
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
        "Content-Type": "application/json",
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

// Convenience helpers with graceful fallback for SSR / cold build
export async function fetchLibraries(query = ""): Promise<any[]> {
  try {
    const data = await api.get<{ libraries: any[] }>(
      `/libraries${query ? `?${query}` : ""}`
    );
    return data.libraries ?? [];
  } catch {
    return libraries;
  }
}

export async function fetchLibraryById(id: string): Promise<any | null> {
  try {
    const data = await api.get<{ library: any }>(`/libraries/${id}`);
    return data.library ?? null;
  } catch {
    return libraryDetails[id] ?? null;
  }
}

export async function fetchLibrarySlots(id: string): Promise<any[]> {
  try {
    const data = await api.get<{ slots: any[] }>(`/libraries/${id}/slots`);
    return data.slots ?? [];
  } catch {
    return librarySlots[id] ?? [];
  }
}

export async function fetchLibraryReviews(id: string): Promise<any[]> {
  try {
    const data = await api.get<{ reviews: any[] }>(`/libraries/${id}/reviews`);
    return data.reviews ?? [];
  } catch {
    return libraryReviews[id] ?? [];
  }
}
