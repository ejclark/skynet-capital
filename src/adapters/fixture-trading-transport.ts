import type { AlpacaTradingTransport } from "../alpaca/trading-transport.js";
import type { JsonResponse } from "../http/fetch-json.js";

/**
 * One account's canned Alpaca responses — the raw shapes the Trading API returns
 * (numbers as strings). Everything above the transport (`AlpacaTradingClient`,
 * `buildParticipantSnapshot`) is unchanged, so a fixture-backed board is identical
 * to a live one minus the network.
 */
export interface AccountFixture {
  /** `/v2/account` payload. */
  readonly account: unknown;
  /** `/v2/positions` payload (defaults to `[]`). */
  readonly positions?: unknown;
  /** `/v2/orders` payload (defaults to `[]`). */
  readonly orders?: unknown;
  /** `/v2/clock` payload (defaults to open). */
  readonly clock?: unknown;
}

/**
 * An `AlpacaTradingTransport` that serves committed fixtures instead of hitting the
 * network — the request/response half of offline mode. Routes by path so a single
 * fixture drives account, positions, orders, and clock reads. Writes (POST) are
 * accepted as no-ops so the offline path never rejects an order for the wrong reason.
 */
export class FixtureTradingTransport implements AlpacaTradingTransport {
  private readonly fixture: AccountFixture;

  constructor(fixture: AccountFixture) {
    this.fixture = fixture;
  }

  get(path: string): Promise<JsonResponse> {
    if (path.startsWith("/v2/account")) return ok(this.fixture.account);
    if (path.startsWith("/v2/positions")) return ok(this.fixture.positions ?? []);
    if (path.startsWith("/v2/orders")) return ok(this.fixture.orders ?? []);
    if (path.startsWith("/v2/clock")) return ok(this.fixture.clock ?? { is_open: true });
    return Promise.resolve({ status: 404, body: null });
  }

  post(_path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve({ status: 200, body: {} });
  }
}

function ok(body: unknown): Promise<JsonResponse> {
  return Promise.resolve({ status: 200, body });
}
