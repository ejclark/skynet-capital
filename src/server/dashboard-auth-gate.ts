import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { keyOf } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server.js";

/**
 * The auth gate — either per-user OAuth (`config.auth`) or the legacy shared password. Exact
 * same order/behavior as before: OAuth's own routes (/login, /logout, provider callbacks) are
 * checked first, then the session/password check. Returns `{ handled: true }` once a response
 * has been written (redirect, 401, or an auth-route response); otherwise `{ handled: false,
 * session }` so the caller can proceed to the authorized routes with the resolved session.
 */
export async function gateRequest(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
): Promise<{ handled: true } | { handled: false; session: Session | undefined }> {
  const auth = config.auth;

  if (auth) {
    const base = baseUrlFrom(req);
    const secure = base.startsWith("https");
    if (path === "/login") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(auth.loginPage());
      return { handled: true };
    }
    if (path === "/logout") {
      res.writeHead(302, { location: "/login", "set-cookie": auth.clearCookie(secure) });
      res.end();
      return { handled: true };
    }
    if (await auth.handleAuthRoute(req, res, path, base)) {
      return { handled: true };
    }
    if (!auth.sessionFrom(req)) {
      if (path === "/events") {
        res.writeHead(401, { "content-type": "text/plain" });
        res.end("unauthorized");
      } else {
        res.writeHead(302, { location: "/login" });
        res.end();
      }
      return { handled: true };
    }
    return { handled: false, session: auth.sessionFrom(req) };
  }

  if (!isAuthorized(url, config.password)) {
    res.writeHead(401, { "content-type": "text/plain" });
    res.end("unauthorized");
    return { handled: true };
  }
  return { handled: false, session: undefined };
}

/** True when the signed-in session's email is an owner on the given owner-gated dep, if wired. */
export function isOwnerOf(
  dep: { isOwner: (email: string) => boolean } | undefined,
  session: Session | undefined,
): boolean {
  return Boolean(dep && session && dep.isOwner(session.email.toLowerCase()));
}

function isAuthorized(url: string, password?: string): boolean {
  if (!password) {
    return true;
  }
  return keyOf(url) === password;
}

/** External origin of the request (honors Fly's x-forwarded-proto). */
function baseUrlFrom(req: IncomingMessage): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "http";
  const host = req.headers.host ?? "localhost";
  return `${proto}://${host}`;
}
