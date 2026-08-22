import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

describe("jwt utils", () => {
  it("firma e verifica correttamente un access token", () => {
    const token = signAccessToken({ userId: "user_123", email: "test@example.com" });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("user_123");
    expect(payload.email).toBe("test@example.com");
  });

  it("firma e verifica correttamente un refresh token", () => {
    const token = signRefreshToken("user_456");
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe("user_456");
  });

  it("rifiuta un access token manomesso", () => {
    const token = signAccessToken({ userId: "user_123", email: "test@example.com" });
    const tampered = token.slice(0, -3) + "xyz";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("rifiuta un refresh token verificato come access token (segreti diversi)", () => {
    const refreshToken = signRefreshToken("user_789");
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});
