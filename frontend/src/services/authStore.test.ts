import { describe, expect, it, beforeEach } from "vitest";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    clearAuthTokens();
    window.localStorage.clear();
  });

  it("stores and reads tokens", () => {
    setAuthTokens("access-123", "refresh-456");

    expect(getAccessToken()).toBe("access-123");
    expect(getRefreshToken()).toBe("refresh-456");
  });

  it("clears tokens", () => {
    setAuthTokens("access-123", "refresh-456");
    clearAuthTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
