import {
  type Session,
  cookie,
  parseCookies,
  sessionTokenFromCookies,
  signSession,
  verifySession,
} from "../../../src/server/auth/session.js";

const secret = "top-secret";
const session: Session = { email: "eric@gmail.com", provider: "google", exp: 10_000 };

describe("session signing", () => {
  it("round-trips a valid, unexpired session", () => {
    const token = signSession(session, secret);
    expect(verifySession(token, secret, 5_000)).toEqual(session);
  });

  it("rejects a tampered payload", () => {
    const token = signSession(session, secret);
    const tampered = `x${token.slice(1)}`;
    expect(verifySession(tampered, secret, 5_000)).toBeUndefined();
  });

  it("rejects a wrong secret", () => {
    const token = signSession(session, secret);
    expect(verifySession(token, "other", 5_000)).toBeUndefined();
  });

  it("rejects an expired session", () => {
    const token = signSession(session, secret);
    expect(verifySession(token, secret, 20_000)).toBeUndefined();
  });
});

describe("cookies", () => {
  it("parses a Cookie header", () => {
    expect(parseCookies("a=1; skynet_session=abc; b=2")).toMatchObject({
      a: "1",
      skynet_session: "abc",
      b: "2",
    });
  });

  it("reads the session token by name", () => {
    expect(sessionTokenFromCookies("skynet_session=tok; other=1")).toBe("tok");
    expect(sessionTokenFromCookies(undefined)).toBeUndefined();
  });

  it("serializes flags (HttpOnly always, Secure only when asked)", () => {
    const secure = cookie("n", "v", {
      maxAgeMs: 1000,
      secure: true,
      httpOnly: true,
      sameSite: "Lax",
    });
    expect(secure).toContain("HttpOnly");
    expect(secure).toContain("Secure");
    const insecure = cookie("n", "v", {
      maxAgeMs: 1000,
      secure: false,
      httpOnly: true,
      sameSite: "Lax",
    });
    expect(insecure).not.toContain("Secure");
  });
});
