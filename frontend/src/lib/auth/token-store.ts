// In-memory holder for the current JWT access token. Deliberately not persisted to
// localStorage/sessionStorage — an XSS payload that can read those can steal a long-lived
// session. The real session lives in the httpOnly refresh cookie the API sets; this token
// is short-lived and reissued on page load via POST /api/auth/refresh.
let currentToken: string | null = null;

export function getAccessToken(): string | null {
  return currentToken;
}

export function setAccessToken(token: string | null): void {
  currentToken = token;
}
