export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface PasswordResetResponse {
  message: string;
  reset_token?: string;
}
