import type { IncomingMessage, ServerResponse } from "node:http";
import type { FetchFn, OAuthProvider } from "./providers.js";
import { parseCookies, type Session, sessionCookie, signSession } from "./session.js";

/** Dependencies `completeOAuthCallback` needs from the Authenticator, passed in explicitly
 * so this module stays a plain function with no class coupling. */
export interface OAuthCallbackDeps {
  readonly provider: OAuthProvider;
  readonly redirectUri: string;
  readonly secure: boolean;
  readonly stateCookieName: string;
  readonly sessionTtlMs: number;
  readonly secret: string;
  readonly fetchFn: FetchFn;
  readonly now: () => number;
  readonly isAllowed: (email?: string, login?: string) => boolean;
  readonly loginPage: (error?: string) => string;
}

/**
 * Finish `/auth/<provider>/callback`: validate state, exchange the code, check the
 * allowlist, then set the session cookie and redirect home. Always owns the response.
 */
export async function completeOAuthCallback(
  req: IncomingMessage,
  res: ServerResponse,
  base: string,
  deps: OAuthCallbackDeps,
): Promise<void> {
  const {
    provider,
    redirectUri,
    secure,
    stateCookieName,
    sessionTtlMs,
    secret,
    fetchFn,
    now,
    isAllowed,
    loginPage,
  } = deps;

  const url = new URL(req.url ?? "/", base);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const expected = parseCookies(req.headers.cookie)[stateCookieName];
  if (!(code && state && expected) || state !== expected) {
    res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
    res.end(loginPage("Sign-in expired or was tampered with. Please try again."));
    return;
  }

  let identity: Awaited<ReturnType<OAuthProvider["exchange"]>>;
  try {
    identity = await provider.exchange(code, redirectUri, fetchFn);
  } catch {
    res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
    res.end(loginPage(`Couldn't complete ${provider.label} sign-in. Please try again.`));
    return;
  }

  if (!isAllowed(identity.email, identity.login)) {
    res.writeHead(403, { "content-type": "text/html; charset=utf-8" });
    res.end(
      loginPage(
        `${identity.email ?? "That account"} isn't on the guest list. Ask Eric to add you.`,
      ),
    );
    return;
  }

  const session: Session = {
    email: (identity.email ?? identity.login ?? "unknown").toLowerCase(),
    provider: provider.id,
    ...(identity.name ? { name: identity.name } : {}),
    exp: now() + sessionTtlMs,
  };
  res.writeHead(302, {
    location: "/",
    "set-cookie": sessionCookie(signSession(session, secret), sessionTtlMs, secure),
  });
  res.end();
}
