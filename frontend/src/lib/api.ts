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
  // FormData bodies (file uploads) need the browser to set their own multipart boundary —
  // setting Content-Type ourselves would drop it and break the upload.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

/** Triggers a browser download for a file-returning endpoint (e.g. /export .xlsx routes). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await apiFetch(path);
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
