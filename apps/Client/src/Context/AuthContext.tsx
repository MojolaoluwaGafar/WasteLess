import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResponse, User } from "../types";
import { SIGNED_OUT_EVENT } from "../API";
import { authService } from "../API/services/authService";
import { clearAuth, getToken, TOKEN_KEY, USER_KEY } from "../utils/authToken";
import { readJson, writeJson } from "../utils/storage";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (response: AuthResponse) => void;
  signOut: () => void;
  /** After the profile changes. */
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Some accounts from the first version have no name saved; showing the page
// must never depend on one.
const withName = (user: User | null): User | null =>
  user ? { ...user, name: user.name?.trim() || user.email?.split("@")[0] || "Friend" } : null;

// The saved session is read synchronously so the first render already knows
// who is signed in; loading it in an effect would bounce people to the login
// page on every refresh (the first version did). The profile is then
// refreshed from the server once, which also catches a revoked login.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken);
  const [user, setUserState] = useState<User | null>(() => (getToken() ? withName(readJson<User | null>(USER_KEY, null)) : null));

  const setUser = useCallback((next: User) => {
    const named = withName(next);
    writeJson(USER_KEY, named);
    setUserState(named);
  }, []);

  const signIn = useCallback(
    ({ token: nextToken, user: nextUser }: AuthResponse) => {
      try {
        localStorage.setItem(TOKEN_KEY, nextToken);
      } catch {
        // Without storage the session lasts until the tab closes.
      }
      setToken(nextToken);
      setUser(nextUser);
    },
    [setUser],
  );

  const signOut = useCallback(() => {
    clearAuth();
    setToken(null);
    setUserState(null);
  }, []);

  // The API client fires this on a 401.
  useEffect(() => {
    window.addEventListener(SIGNED_OUT_EVENT, signOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, signOut);
  }, [signOut]);

  useEffect(() => {
    if (!token) return;
    authService.me().then(setUser).catch(() => {
      // A 401 signs out through the event above; anything else (offline,
      // server waking up) keeps the saved profile.
    });
    // Only on first load: signIn already has a fresh profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(token && user), signIn, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
