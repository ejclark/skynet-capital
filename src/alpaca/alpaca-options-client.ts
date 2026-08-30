import { type AlpacaOrder, ensureOk } from "./alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "./trading-transport.js";

/**
 * Typed wrapper over the Alpaca OPTIONS endpoints the desk ticket uses — kept separate from
 * `alpaca-trading-client.ts` (the equity surface) so each stays a small cohesive unit.
 *
 * Two transports, because Alpaca splits the work across two hosts:
 *  - the TRADING transport (paper-api.alpaca.markets) lists contracts and places orders;
 *  - the optional DATA transport (data.alpaca.markets) adds indicative quotes and greeks.
 * The data host is strictly an enrichment: every method that touches it fails SOFT (returns
 * what the contracts endpoint alone can say), so the chain still renders with honest
 * last-close premiums when the quote feed is down or unwired. Nothing that places an order
 * ever depends on the data host.
 *
 * Options orders are `time_in_force: "day"` always — that is all Alpaca supports for options,
 * and the ticket says so rather than offering a GTC that would be refused.
 */

/** One row of an option chain, merged from contracts (+ quotes when available). */
export interface OptionChainRow {
  readonly occSymbol: string;
  readonly strike: number;
  /** Previous close premium $/share, from the contracts endpoint. */
  readonly closePrice?: number;
  readonly openInterest?: number;
  readonly bid?: number;
  readonly ask?: number;
  // The greeks the data host quoted for this contract, each carried ONLY when it arrived as a
  // finite number. A greek the feed omitted stays absent, so the desk reads it as ABSENT rather
  // than as a confident 0.00 — "no decay", "no convexity" — that nobody actually measured.
  /** Premium change per $1 of spot. Calls (0,1); puts (-1,0). */
  readonly delta?: number;
  /** Delta change per $1 of spot. */
  readonly gamma?: number;
  /** Dollars per share per day of decay. Negative for a long option. */
  readonly theta?: number;
  /** Dollars per share per 1 volatility point. */
  readonly vega?: number;
  /** Dollars per share per 1 rate point. */
  readonly rho?: number;
}

/** Contract payload subset (Trading API `/v2/options/contracts`). Numbers arrive as strings. */
export interface AlpacaOptionContract {
  readonly symbol: string;
  readonly expiration_date: string;
  readonly strike_price: string;
  readonly type: "call" | "put";
  readonly tradable?: boolean;
  readonly open_interest?: string | null;
  readonly close_price?: string | null;
}

/**
 * One row of the Account Activities feed (`/v2/account/activities`), narrowed to the fields an
 * option lifecycle event might carry. Alpaca reports expiration/assignment/exercise as non-trade
 * activities (`OPEXP`/`OPASN`/`OPEXC`) and the paired underlying-share trade that settles an
 * assignment or exercise as `OPTRD`. Every field beyond `id`/`activity_type` is optional on
 * purpose: the non-trade types are not documented as carrying `side`, and normalization
 * (`../trading/option-lifecycle.ts`) never assumes a field this type doesn't guarantee.
 */
export interface AlpacaAccountActivity {
  readonly id: string;
  readonly activity_type: string;
  /** Non-trade activities key on `date`; trade activities (`OPTRD`) on `transaction_time`. */
  readonly date?: string;
  readonly transaction_time?: string;
  readonly symbol?: string;
  readonly qty?: string | number;
  readonly price?: string | number;
  readonly side?: string;
  readonly net_amount?: string | number;
}

export interface PlaceOptionOrderParams {
  readonly occSymbol: string;
  readonly contracts: number;
  readonly side: "buy" | "sell";
  readonly type: "limit" | "market";
  /** Premium per share; required by Alpaca for limit orders. */
  readonly limitPrice?: number;
  readonly positionIntent: "buy_to_open" | "sell_to_open" | "buy_to_close" | "sell_to_close";
}

const num = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

/** The greeks the snapshot payload carries, in the order a chain reads them. */
const GREEK_KEYS = ["delta", "gamma", "theta", "vega", "rho"] as const;
type GreekKey = (typeof GREEK_KEYS)[number];
/** The `greeks` block of a snapshot, before any of it is trusted. */
type RawGreeks = Partial<Record<GreekKey, unknown>>;

/**
 * Parse one greek. Unlike `num`, zero and negatives are legitimate here (a deep-OTM gamma, a put's
 * delta, any long option's theta), so finiteness is the only gate. Everything that is not a number
 * or a numeric string is ABSENT — `Number` would otherwise hand back a confident 0 for `null`, `""`
 * and `[]`, and a 1 for `true`, and a fabricated greek is worse on a desk than a blank one.
 */
const greek = (value: unknown): number | undefined => {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Every greek the snapshot quoted honestly, omitting each one it did not. */
const greeksOf = (raw: RawGreeks | undefined): Partial<Record<GreekKey, number>> => {
  const out: Partial<Record<GreekKey, number>> = {};
  for (const key of GREEK_KEYS) {
    const value = greek(raw?.[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
};

export class AlpacaOptionsClient {
  private readonly trading: AlpacaTradingTransport;
  private readonly data?: AlpacaTradingTransport;

  constructor(trading: AlpacaTradingTransport, data?: AlpacaTradingTransport) {
    this.trading = trading;
    if (data) this.data = data;
  }

  /**
   * Upcoming expiration dates for an underlying, soonest first. One page of call contracts is
   * enough to enumerate the near expirations the ticket offers; a symbol with more listings
   * than one page simply shows its nearest months, which is what a learner wants anyway.
   */
  async getExpirations(underlying: string, onOrAfter: string, limit = 8): Promise<string[]> {
    const path = `/v2/options/contracts?underlying_symbols=${encodeURIComponent(underlying)}&type=call&status=active&expiration_date_gte=${onOrAfter}&limit=1000`;
    const body = ensureOk<{ option_contracts?: AlpacaOptionContract[] }>(
      await this.trading.get(path),
    );
    const dates = [...new Set((body.option_contracts ?? []).map((c) => c.expiration_date))];
    return dates.sort().slice(0, limit);
  }

  /** The chain for one underlying/expiration/side, strikes ascending, quotes merged fail-soft. */
  async getChain(
    underlying: string,
    expiration: string,
    type: "call" | "put",
  ): Promise<OptionChainRow[]> {
    const path = `/v2/options/contracts?underlying_symbols=${encodeURIComponent(underlying)}&type=${type}&status=active&expiration_date=${expiration}&limit=500`;
    const body = ensureOk<{ option_contracts?: AlpacaOptionContract[] }>(
      await this.trading.get(path),
    );
    const rows: OptionChainRow[] = (body.option_contracts ?? [])
      .filter((c) => c.tradable !== false && num(c.strike_price) !== undefined)
      .map((c) => ({
        occSymbol: c.symbol,
        strike: num(c.strike_price) as number,
        ...(num(c.close_price) !== undefined ? { closePrice: num(c.close_price) as number } : {}),
        ...(c.open_interest != null && Number.isFinite(Number(c.open_interest))
          ? { openInterest: Number(c.open_interest) }
          : {}),
      }))
      .sort((a, b) => a.strike - b.strike);
    return this.mergeQuotes(underlying, expiration, type, rows);
  }

  /** One contract by OCC symbol — the fresh existence + last-close check before an order. */
  async getContract(occSymbol: string): Promise<AlpacaOptionContract | undefined> {
    const response = await this.trading.get(
      `/v2/options/contracts/${encodeURIComponent(occSymbol)}`,
    );
    if (response.status === 404) return undefined;
    return ensureOk<AlpacaOptionContract>(response);
  }

  /** The underlying's last trade price, from the data host. Fail-soft: undefined, never throw. */
  async getUnderlyingPrice(symbol: string): Promise<number | undefined> {
    if (!this.data) return undefined;
    try {
      const response = await this.data.get(
        `/v2/stocks/${encodeURIComponent(symbol)}/trades/latest?feed=iex`,
      );
      if (response.status < 200 || response.status >= 300) return undefined;
      const body = response.body as { trade?: { p?: unknown } } | null;
      return num(body?.trade?.p);
    } catch {
      return undefined;
    }
  }

  /**
   * The four option lifecycle activity types: `OPEXP` (expired worthless),
   * `OPASN` (assigned), `OPEXC` (exercised), `OPTRD` (the paired underlying-share settlement
   * trade). Read-only and never on the execution path, so this fails SOFT like `mergeQuotes` —
   * an empty array on any error, rather than breaking history rendering over a broker hiccup.
   * `after` is the activity `id` cursor (Alpaca's own pagination token for this endpoint).
   */
  async getOptionLifecycleActivities(after?: string): Promise<AlpacaAccountActivity[]> {
    try {
      const query = new URLSearchParams({
        activity_types: "OPEXP,OPASN,OPEXC,OPTRD",
        direction: "desc",
        page_size: "100",
        ...(after ? { page_token: after } : {}),
      });
      const response = await this.trading.get(`/v2/account/activities?${query.toString()}`);
      if (response.status < 200 || response.status >= 300) return [];
      const body = response.body;
      return Array.isArray(body) ? (body as AlpacaAccountActivity[]) : [];
    } catch {
      return [];
    }
  }

  async placeOptionOrder(params: PlaceOptionOrderParams): Promise<AlpacaOrder> {
    const response = await this.trading.post("/v2/orders", {
      symbol: params.occSymbol,
      qty: params.contracts,
      side: params.side,
      type: params.type,
      ...(params.type === "limit" ? { limit_price: params.limitPrice } : {}),
      time_in_force: "day",
      position_intent: params.positionIntent,
    });
    return ensureOk<AlpacaOrder>(response);
  }

  /** Indicative bid/ask/greeks from the data host, merged onto the chain. Fail-soft. */
  private async mergeQuotes(
    underlying: string,
    expiration: string,
    type: "call" | "put",
    rows: OptionChainRow[],
  ): Promise<OptionChainRow[]> {
    if (!this.data || rows.length === 0) return rows;
    try {
      const response = await this.data.get(
        `/v1beta1/options/snapshots/${encodeURIComponent(underlying)}?feed=indicative&type=${type}&expiration_date=${expiration}&limit=500`,
      );
      if (response.status < 200 || response.status >= 300) return rows;
      const body = response.body as {
        snapshots?: Record<
          string,
          { latestQuote?: { bp?: unknown; ap?: unknown }; greeks?: RawGreeks }
        >;
      } | null;
      const snapshots = body?.snapshots ?? {};
      return rows.map((row) => {
        const snap = snapshots[row.occSymbol];
        if (!snap) return row;
        return {
          ...row,
          ...(num(snap.latestQuote?.bp) !== undefined
            ? { bid: num(snap.latestQuote?.bp) as number }
            : {}),
          ...(num(snap.latestQuote?.ap) !== undefined
            ? { ask: num(snap.latestQuote?.ap) as number }
            : {}),
          ...greeksOf(snap.greeks),
        };
      });
    } catch {
      return rows;
    }
  }
}

/** The premium a chain row can honestly quote: the bid/ask mid when both sides exist, else last close. */
export function rowPremium(row: OptionChainRow): number | undefined {
  if (row.bid !== undefined && row.ask !== undefined) return (row.bid + row.ask) / 2;
  return row.closePrice;
}
