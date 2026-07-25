/**
 * Alpaca API credentials for a single account (bot paper account or a human's account).
 *
 * Two auth modes: the classic key/secret pair, or an OAuth `accessToken` obtained via the
 * "Connect with Alpaca" flow. When `accessToken` is present it takes precedence and the client
 * authenticates with a Bearer header; `apiKey`/`apiSecret` may then be blank.
 */
export interface AlpacaCredentials {
  readonly apiKey: string;
  readonly apiSecret: string;
  /** OAuth bearer token from the Connect flow; when set, used instead of key/secret. */
  readonly accessToken?: string;
  /** Defaults to the paper endpoint when unset. */
  readonly baseUrl?: string;
}
