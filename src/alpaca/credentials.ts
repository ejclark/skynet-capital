/** Alpaca API credentials for a single account (bot paper account or a human's account). */
export interface AlpacaCredentials {
  readonly apiKey: string;
  readonly apiSecret: string;
  /** Defaults to the paper endpoint when unset. */
  readonly baseUrl?: string;
}
