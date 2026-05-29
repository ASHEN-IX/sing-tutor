import axios from "axios";
import { API_BASE_URL } from "./api";
import { AuthResponse, AuthUser, PasswordResetResponse } from "@/types/auth";
import { clearAuthTokens, getRefreshToken, setAuthTokens } from "./authStore";

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function register(email: string, password: string, name: string): Promise<AuthUser> {
  const response = await authClient.post<AuthResponse>("/api/auth/register", {
    email,
    password,
    name,
  });
  setAuthTokens(response.data.tokens.access_token, response.data.tokens.refresh_token);
  return response.data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await authClient.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  setAuthTokens(response.data.tokens.access_token, response.data.tokens.refresh_token);
  return response.data.user;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await authClient.post("/api/auth/logout", {
      refresh_token: refreshToken,
    });
  } finally {
    clearAuthTokens();
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await authClient.get<AuthUser>("/api/auth/me");
  return response.data;
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  const response = await authClient.post<PasswordResetResponse>("/api/auth/forgot-password", {
    email,
  });
  return response.data;
}

export async function confirmPasswordReset(resetToken: string, newPassword: string): Promise<PasswordResetResponse> {
  const response = await authClient.post<PasswordResetResponse>("/api/auth/reset-password", {
    reset_token: resetToken,
    new_password: newPassword,
  });
  return response.data;
}
