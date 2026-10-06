import api from "../index";
import type { AccountType, AuthResponse, User } from "../../types";

export const authService = {
  async register(input: { name: string; email: string; password: string; accountType: AccountType; orgName: string }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/register", input);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
    return data;
  },

  /** `credential` is the ID token from Google's sign-in button. */
  async google(credential: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/google", { credential });
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>("/api/auth/me");
    return data.user;
  },

  async updateProfile(input: { name: string; phone: string; location: string; accountType: AccountType; orgName: string }): Promise<User> {
    const { data } = await api.patch<{ user: User }>("/api/auth/me", input);
    return data.user;
  },

  // Signs out every other device; returns a new login for this one.
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/password", { currentPassword, newPassword });
    return data;
  },

  async forgotPassword(email: string): Promise<string> {
    const { data } = await api.post<{ message: string }>("/api/auth/forgot-password", { email });
    return data.message;
  },

  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/reset-password", { token, password });
    return data;
  },
};
