import { getAccessToken } from "@/lib/auth/token-store";

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080";
}

/**
 * fetch() wrapper for calls made from the browser: attaches the in-memory access token
 * and always sends credentials so the httpOnly refresh cookie round-trips to the API.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}
