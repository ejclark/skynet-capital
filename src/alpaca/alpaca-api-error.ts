/** Thrown when the Trading API returns a non-2xx status. */
export class AlpacaApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Alpaca API error ${status}: ${JSON.stringify(body)}`);
    this.name = "AlpacaApiError";
    this.status = status;
    this.body = body;
  }
}
