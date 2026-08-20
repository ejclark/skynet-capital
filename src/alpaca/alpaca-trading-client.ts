import type { Side } from "../domain/types.js";
import type { AlpacaTradingTransport } from "./trading-transport.js";

/** Alpaca account payload (subset). Numeric fields arrive as strings over the wire. */
export interface AlpacaAccount {
  readonly id: string;
  readonly cash: string;
  readonly portfolio_value: string;
  readonly status: string;
}

/** Alpaca position payload (subset). */
export interface AlpacaPosition {
  readonly symbol: string;
  readonly qty: string;
  readonly avg_entry_price: string;
  readonly market_value: string;
  /** Yesterday's closing price — the base the desk's day-change column measures from. */
  readonly lastday_price?: string;
}

/** Alpaca order payload (subset). */
export interface AlpacaOrder {
  readonly id: string;
  readonly symbol: string;
  readonly qty: string;
  readonly side: Side;
  readonly status: string;
  readonly filled_qty?: string;
  readonly filled_avg_price?: string | null;
  readonly submitted_at?: string;
  readonly filled_at?: string | null;
}

export interface PlaceOrderParams {
  readonly symbol: string;
  readonly qty: number;
  readonly side: Side;
}

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

function ensureOk<T>(response: { status: number; body: unknown }): T {
  if (response.status < 200 || response.status >= 300) {
    throw new AlpacaApiError(response.status, response.body);
  }
  return response.body as T;
}

/**
 * Typed wrapper over the Alpaca paper Trading API endpoints we use. All HTTP flows
 * through the injected transport, so this is fully unit-testable with a fake.
 */
export class AlpacaTradingClient {
  private readonly transport: AlpacaTradingTransport;

  constructor(transport: AlpacaTradingTransport) {
    this.transport = transport;
  }

  async getAccount(): Promise<AlpacaAccount> {
    return ensureOk<AlpacaAccount>(await this.transport.get("/v2/account"));
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    return ensureOk<AlpacaPosition[]>(await this.transport.get("/v2/positions"));
  }

  /** Most-recent orders (any status), newest first — the account's transaction history. */
  getRecentOrders(limit = 15): Promise<AlpacaOrder[]> {
    return this.listOrders({ limit });
  }

  /**
   * One page of order history, newest first. `until` (an ISO timestamp, exclusive, matched on
   * submission time) is the pagination cursor: pass the previous page's oldest `submitted_at` to
   * walk arbitrarily far back — Alpaca caps `limit` at 500 per request but keeps the full record.
   */
  async listOrders(params: { limit?: number; until?: string } = {}): Promise<AlpacaOrder[]> {
    const query = new URLSearchParams({
      status: "all",
      limit: String(params.limit ?? 15),
      direction: "desc",
      nested: "false",
      ...(params.until ? { until: params.until } : {}),
    });
    return ensureOk<AlpacaOrder[]>(await this.transport.get(`/v2/orders?${query.toString()}`));
  }

  /** Market clock — whether the market is currently open. */
  async isMarketOpen(): Promise<boolean> {
    const clock = ensureOk<{ is_open?: boolean }>(await this.transport.get("/v2/clock"));
    return clock.is_open === true;
  }

  async placeOrder(params: PlaceOrderParams): Promise<AlpacaOrder> {
    const response = await this.transport.post("/v2/orders", {
      symbol: params.symbol,
      qty: params.qty,
      side: params.side,
      type: "market",
      time_in_force: "day",
    });
    return ensureOk<AlpacaOrder>(response);
  }
}
