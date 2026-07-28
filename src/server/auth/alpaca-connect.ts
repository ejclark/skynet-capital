/**
 * Alpaca OAuth 2.0 "Connect" — the account-linking half of onboarding (distinct from the
 * Google/GitHub *login* providers). A participant authorizes Skynet Capital on Alpaca's
 * consent screen and we exchange the returned `code` for an access token, so we store a
 * revocable token instead of the user's raw API key/secret. All network I/O flows through an
 * injected `FetchFn`, so the exchange is unit-testable with a fake — no real OAuth round-trip.
 *
 * Docs: https://docs.alpaca.markets/docs/using-oauth2-and-trading-api
 */
import { asString } from "./json-fields.js";
import type { FetchFn } from "./providers.js";

/** Default OAuth scope: read/manage the account (balance + positions) for the board. */
export const ALPACA_DEFAULT_SCOPE = "account:write trading";

export interface AlpacaConnectConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  /** Override the requested scope; defaults to {@link ALPACA_DEFAULT_SCOPE}. */
  readonly scope?: string;
}

/** The token we persist as the participant's Alpaca credential. */
interface AlpacaConnection {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly scope?: string;
}

export interface AlpacaConnectProvider {
  readonly id: "alpaca";
  readonly label: "Alpaca";
  authorizeUrl(redirectUri: string, state: string): string;
  exchange(code: string, redirectUri: string, fetchFn: FetchFn): Promise<AlpacaConnection>;
}

const AUTHORIZE_URL = "https://app.alpaca.markets/oauth/authorize";
const TOKEN_URL = "https://api.alpaca.markets/oauth/token";

export function alpacaConnectProvider(config: AlpacaConnectConfig): AlpacaConnectProvider {
  const scope = config.scope ?? ALPACA_DEFAULT_SCOPE;
  return {
    id: "alpaca",
    label: "Alpaca",
    authorizeUrl(redirectUri, state) {
      const params = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: redirectUri,
        state,
        scope,
      });
      return `${AUTHORIZE_URL}?${params}`;
    },
    async exchange(code, redirectUri, fetchFn) {
      const response = await fetchFn(TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
        }).toString(),
      });
      const token = (await response.json()) as Record<string, unknown>;
      const accessToken = asString(token.access_token);
      if (!accessToken) {
        throw new Error("Alpaca OAuth exchange returned no access_token");
      }
      return {
        accessToken,
        tokenType: asString(token.token_type) ?? "Bearer",
        ...(asString(token.scope) ? { scope: asString(token.scope) as string } : {}),
      };
    },
  };
}
