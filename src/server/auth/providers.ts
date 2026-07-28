/**
 * OAuth 2.0 providers (Google + GitHub), each reduced to two operations: build the
 * authorize URL to send the browser to, and exchange the returned `code` for the user's
 * identity (email + optional login/name). All network I/O flows through an injected
 * `FetchFn`, so the exchange is unit-testable with a fake — no real OAuth round-trip.
 */
export type ProviderId = "google" | "github";

interface OAuthIdentity {
  readonly email?: string;
  readonly login?: string;
  readonly name?: string;
}

import { asString } from "./json-fields.js";

export type FetchFn = typeof fetch;

export interface ProviderConfig {
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface OAuthProvider {
  readonly id: ProviderId;
  readonly label: string;
  authorizeUrl(redirectUri: string, state: string): string;
  exchange(code: string, redirectUri: string, fetchFn: FetchFn): Promise<OAuthIdentity>;
}

export function googleProvider(config: ProviderConfig): OAuthProvider {
  return {
    id: "google",
    label: "Google",
    authorizeUrl(redirectUri, state) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        access_type: "online",
        prompt: "select_account",
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    },
    async exchange(code, redirectUri, fetchFn) {
      const token = await postForm(fetchFn, "https://oauth2.googleapis.com/token", {
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const accessToken = asString(token.access_token);
      const info = await getJson(fetchFn, "https://openidconnect.googleapis.com/v1/userinfo", {
        Authorization: `Bearer ${accessToken}`,
      });
      return { email: asString(info.email), name: asString(info.name) };
    },
  };
}

export function githubProvider(config: ProviderConfig): OAuthProvider {
  return {
    id: "github",
    label: "GitHub",
    authorizeUrl(redirectUri, state) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        scope: "read:user user:email",
        state,
      });
      return `https://github.com/login/oauth/authorize?${params}`;
    },
    async exchange(code, redirectUri, fetchFn) {
      const token = await postForm(fetchFn, "https://github.com/login/oauth/access_token", {
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
      });
      const accessToken = asString(token.access_token);
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "skynet-capital",
      };
      const user = await getJson(fetchFn, "https://api.github.com/user", headers);
      let email = asString(user.email);
      if (!email) {
        // The public profile hides private emails; ask for the primary verified one.
        const emails = await getJsonArray(fetchFn, "https://api.github.com/user/emails", headers);
        const primary = emails.find(
          (e) => (e as { primary?: boolean }).primary && (e as { verified?: boolean }).verified,
        );
        email = asString((primary as { email?: unknown } | undefined)?.email);
      }
      return { email, login: asString(user.login), name: asString(user.name) };
    },
  };
}

// --- fetch helpers ----------------------------------------------------------

async function postForm(
  fetchFn: FetchFn,
  url: string,
  body: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetchFn(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  return (await response.json()) as Record<string, unknown>;
}

async function getJson(
  fetchFn: FetchFn,
  url: string,
  headers: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetchFn(url, { headers: { Accept: "application/json", ...headers } });
  return (await response.json()) as Record<string, unknown>;
}

async function getJsonArray(
  fetchFn: FetchFn,
  url: string,
  headers: Record<string, string>,
): Promise<unknown[]> {
  const response = await fetchFn(url, { headers: { Accept: "application/json", ...headers } });
  const parsed = (await response.json()) as unknown;
  return Array.isArray(parsed) ? parsed : [];
}
