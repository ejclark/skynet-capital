import { type JsonResponse, fetchJson } from "../http/fetch-json.js";

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
}

/** Real transport: Alpaca's key/secret header auth against the paper Trading API. */
export class FetchAlpacaTradingTransport implements AlpacaTradingTransport {
  private readonly config: AlpacaTradingConfig;

  constructor(config: AlpacaTradingConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
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
