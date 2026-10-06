import { removeKey } from "./storage";

export const TOKEN_KEY = "wasteless.authToken";
export const USER_KEY = "wasteless.user";

// The first version of the app stored these under plain "token" and "user".
const LEGACY_KEYS = ["token", "user", "userPurpose"];

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  removeKey(TOKEN_KEY);
  removeKey(USER_KEY);
  LEGACY_KEYS.forEach(removeKey);
}
