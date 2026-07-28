import { fetchJson, type JsonResponse } from "../http/fetch-json.js";

/**
 * Network seam for the Alpaca Trading API (paper). Injected everywhere above, so the
 * client and adapter are unit-testable with a fake transport — no network, no keys.
 */
export interface AlpacaTradingTransport {
  get(path: string): Promise<JsonResponse>;
  post(path: string, body: unknown): Promise<JsonResponse>;
}

export interface AlpacaTradingConfig {
  /** Paper endpoint: https://paper-api.alpaca.markets */
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  /** OAuth bearer token (from "Connect with Alpaca"); when set, used instead of key/secret. */
  readonly accessToken?: string;
}

/**
 * Real transport for the paper Trading API. Authenticates with an OAuth Bearer token when one
 * is present (Connect flow), otherwise Alpaca's classic key/secret headers.
 */
export class FetchAlpacaTradingTransport implements AlpacaTradingTransport {
  private readonly config: AlpacaTradingConfig;

  constructor(config: AlpacaTradingConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    if (this.config.accessToken) {
      return { Authorization: `Bearer ${this.config.accessToken}` };
    }
    return {
      "APCA-API-KEY-ID": this.config.apiKey,
      "APCA-API-SECRET-KEY": this.config.apiSecret,
    };
  }

  get(path: string): Promise<JsonResponse> {
    return fetchJson("GET", `${this.config.baseUrl}${path}`, this.headers());
  }

  post(path: string, body: unknown): Promise<JsonResponse> {
    return fetchJson("POST", `${this.config.baseUrl}${path}`, this.headers(), body);
  }
}
