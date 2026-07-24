import { createHmac, timingSafeEqual } from "node:crypto";

/** The signed-in identity carried in the session cookie. */
export interface Session {
  readonly email: string;
  readonly provider: "google" | "github";
  readonly name?: string;
  /** Expiry as epoch milliseconds. */
  readonly exp: number;
}

const COOKIE_NAME = "skynet_session";

/**
 * Stateless signed sessions: `base64url(json).hmac`. No server-side session store — the
 * cookie itself is the session, and the HMAC (keyed by `SKYNET_SESSION_SECRET`) makes it
 * unforgeable. Tamper with the payload and the signature no longer matches; let it age past
 * `exp` and it's rejected. Small, dependency-free, and unit-testable without a browser.
 */
export function signSession(session: Session, secret: string): string {
  const payload = base64url(JSON.stringify(session));
  return `${payload}.${hmac(payload, secret)}`;
}

/** Verify signature + expiry; returns the session or undefined if invalid/expired. */
export function verifySession(token: string, secret: string, now: number): Session | undefined {
  const dot = token.lastIndexOf(".");
  if (dot < 1) {
    return undefined;
  }
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, hmac(payload, secret))) {
    return undefined;
  }
  try {
    const session = JSON.parse(fromBase64url(payload)) as Session;
    if (typeof session.exp !== "number" || session.exp < now) {
      return undefined;
    }
    return session;
  } catch {
    return undefined;
  }
}

/** Serialize the session cookie (HttpOnly, SameSite=Lax; Secure under HTTPS). */
export function sessionCookie(token: string, maxAgeMs: number, secure: boolean): string {
  return cookie(COOKIE_NAME, token, { maxAgeMs, secure, httpOnly: true, sameSite: "Lax" });
}

/** Serialize an expired session cookie for logout. */
export function clearSessionCookie(secure: boolean): string {
  return cookie(COOKIE_NAME, "", { maxAgeMs: 0, secure, httpOnly: true, sameSite: "Lax" });
}

/** Read the raw session token from a request's Cookie header. */
export function sessionTokenFromCookies(cookieHeader: string | undefined): string | undefined {
  return parseCookies(cookieHeader)[COOKIE_NAME];
}

// --- cookie helpers ---------------------------------------------------------

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) {
    return out;
  }
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) {
      continue;
    }
    const name = part.slice(0, eq).trim();
    if (name) {
      out[name] = decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return out;
}

interface CookieOptions {
  readonly maxAgeMs: number;
  readonly secure: boolean;
  readonly httpOnly: boolean;
  readonly sameSite: "Lax" | "Strict";
}

export function cookie(name: string, value: string, options: CookieOptions): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${Math.floor(options.maxAgeMs / 1000)}`,
    `SameSite=${options.sameSite}`,
  ];
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

// --- crypto/encoding helpers ------------------------------------------------

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function base64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}
