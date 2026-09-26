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
 *
 * A route matches its own path (plus a query string), never as a prefix of a longer one:
 * `/v2/account/portfolio/history` and `/v2/account/activities` share `/v2/account`'s first
 * segment, and a prefix match once answered both with the account payload — numbers as
 * strings, no `equity` series — which the net-worth route read as a history and threw on
 * (the crawl's ninth dead end, PR #3801). An endpoint with no fixture answers 404, the same
 * contract the options endpoints already hold offline, so every caller takes its own honest
 * "no history yet" path instead of a 500.
 */
export class FixtureTradingTransport implements AlpacaTradingTransport {
  private readonly fixture: AccountFixture;

  constructor(fixture: AccountFixture) {
    this.fixture = fixture;
  }

  get(path: string): Promise<JsonResponse> {
    if (isRoute(path, "/v2/account")) return ok(this.fixture.account);
    if (isRoute(path, "/v2/positions")) return ok(this.fixture.positions ?? []);
    if (isRoute(path, "/v2/orders")) return ok(this.fixture.orders ?? []);
    if (isRoute(path, "/v2/clock")) return ok(this.fixture.clock ?? { is_open: true });
    return Promise.resolve({ status: 404, body: null });
  }

  post(_path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve({ status: 200, body: {} });
  }

  delete(_path: string): Promise<JsonResponse> {
    return Promise.resolve({ status: 204, body: null });
  }
}

/** `path` is `route` itself or `route` with a query string — never a longer path under it. */
function isRoute(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}?`);
}

function ok(body: unknown): Promise<JsonResponse> {
  return Promise.resolve({ status: 200, body });
}
