// Thin fetch wrapper (section 44/46/74): every API error the server sends
// back as { error: { code, message } } is normalized into an ApiError so UI
// components can branch on `.code` instead of parsing strings.

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Your local practice database could not be reached.", 0);
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const err = (body && typeof body === "object" && "error" in body ? (body as any).error : null) ?? {
      code: "UNKNOWN_ERROR",
      message: typeof body === "string" && body ? body : "An unexpected error occurred.",
    };
    throw new ApiError(err.code, err.message, res.status, err.details);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined }),
};

export function downloadFile(path: string, filename: string): void {
  const a = document.createElement("a");
  a.href = `/api${path}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
