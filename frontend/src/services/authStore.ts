let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

const ACCESS_KEY = "vocalai_access_token";
const REFRESH_KEY = "vocalai_refresh_token";

export function setAuthTokens(accessToken: string, refreshToken: string) {
  cachedAccessToken = accessToken;
  cachedRefreshToken = refreshToken;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearAuthTokens() {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
}

export function getAccessToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window === "undefined") return null;
  cachedAccessToken = window.localStorage.getItem(ACCESS_KEY);
  return cachedAccessToken;
}

export function getRefreshToken(): string | null {
  if (cachedRefreshToken) return cachedRefreshToken;
  if (typeof window === "undefined") return null;
  cachedRefreshToken = window.localStorage.getItem(REFRESH_KEY);
  return cachedRefreshToken;
}
