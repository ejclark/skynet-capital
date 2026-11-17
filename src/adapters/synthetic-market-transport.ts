import type { AlpacaTradingTransport } from "../alpaca/trading-transport.js";
import type { JsonResponse } from "../http/fetch-json.js";
import { priceOption } from "../options/pricing.js";
import { buildOccSymbol, isOccSymbol, parseOccSymbol } from "../trading/option-symbols.js";

/**
 * A deterministic SIMULATED market for the offline change world (#change-scenarios): stock quotes
 * and listed-option chains derived from one price per underlying, so a simulated member can do
 * what a member does on a real day — read a quote, open a chain, price a cash-secured put — and
 * the order they place fills at a price the screen showed them.
 *
 * WHY IT EXISTS: offline mode has no data host. Every quote, chain and contract read fails soft
 * (`alpaca-options-client.ts` → `getUnderlyingPrice` returns undefined with no data transport;
 * `/v2/options/contracts` answers 404), so the trade form offline shows no price and no chain and
 * every option scenario is untestable. This is the minimum honest market: one mark per symbol, a
 * fixed implied vol, Black-Scholes premiums from the house pricer (`options/pricing.ts`), a
 * spread on every quote. It is never wired outside `SKYNET_OFFLINE_WRITES=apply`, never in
 * production, and the offline server is already labelled SIM end to end — nothing here is
 * presented as a real market.
 *
 * Shapes are Alpaca's own (data host: `/v2/stocks/:s/trades/latest`, `/v2/stocks/:s/snapshot`,
 * `/v1beta1/options/snapshots[...]`; trading host: `/v2/options/contracts[...]`), so the client
 * above reads it exactly as it reads Alpaca. Bars are not simulated: a chart asks, gets 404, and
 * says it has no history — the honest answer for a market that has none.
 */
export interface SyntheticMarketOptions {
  /** Last price per underlying (stock ticker), per share. A symbol with none has no market. */
  readonly marks: ReadonlyMap<string, number>;
  /** The market's "today" — expirations are listed from it. */
  readonly now: () => Date;
  /** Annualised implied vol per underlying; anything unlisted uses `defaultVol`. */
  readonly vols?: ReadonlyMap<string, number>;
  readonly defaultVol?: number;
  readonly rate?: number;
}

export interface Quote {
  readonly bid: number;
  readonly ask: number;
}

/** Vols for the names the members talk about — honest-ish magnitudes, not a forecast. */
const KNOWN_VOLS: readonly [string, number][] = [
  ["CRWV", 0.9],
  ["NVDA", 0.5],
  ["TSLA", 0.6],
  ["AAPL", 0.28],
  ["MSFT", 0.26],
  ["SPY", 0.16],
  ["EEM", 0.2],
  ["XLE", 0.25],
  ["XLF", 0.2],
];

export class SyntheticMarket implements AlpacaTradingTransport {
  private readonly marks: ReadonlyMap<string, number>;
  /** The market's clock — the broker's `/v2/clock` reads the same one, so a world pinned with
   *  SKYNET_FIXED_NOW opens and closes on the pinned day (code review). */
  readonly now: () => Date;
  private readonly vols: ReadonlyMap<string, number>;
  private readonly defaultVol: number;
  private readonly rate: number;

  constructor(options: SyntheticMarketOptions) {
    this.marks = options.marks;
    this.now = options.now;
    this.vols = new Map([...KNOWN_VOLS, ...(options.vols ?? [])]);
    this.defaultVol = options.defaultVol ?? 0.4;
    this.rate = options.rate ?? 0.04;
  }

  /** The bid/ask a member would trade at right now — stocks a cent each side, options a spread. */
  quote(symbol: string): Quote | undefined {
    if (!isOccSymbol(symbol)) {
      const mark = this.marks.get(symbol);
      return mark === undefined ? undefined : { bid: cents(mark - 0.01), ask: cents(mark + 0.01) };
    }
    const parts = parseOccSymbol(symbol);
    if (!parts) return undefined;
    const value = this.value(parts.underlying, parts.strike, parts.expiration, parts.type);
    return value === undefined ? undefined : spread(value.price);
  }

  get(path: string): Promise<JsonResponse> {
    const [route, query] = split(path);
    const stock = /^\/v2\/stocks\/([^/]+)\/(trades\/latest|snapshot)$/.exec(route);
    if (stock) {
      const symbol = decodeURIComponent(stock[1] as string);
      const mark = this.marks.get(symbol);
      if (mark === undefined) return notFound();
      const t = this.now().toISOString();
      if (stock[2] === "trades/latest") return ok({ symbol, trade: { p: mark, t } });
      const q = this.quote(symbol) as Quote;
      return ok({
        symbol,
        latestTrade: { p: mark, t },
        latestQuote: { bp: q.bid, ap: q.ask, t },
        prevDailyBar: { c: cents(mark / 1.004) },
      });
    }
    if (route === "/v2/options/contracts") return ok(this.contracts(query));
    const one = /^\/v2\/options\/contracts\/([^/]+)$/.exec(route);
    if (one) {
      const symbol = decodeURIComponent(one[1] as string);
      const parts = parseOccSymbol(symbol);
      if (!(parts && this.marks.has(parts.underlying))) return notFound();
      return ok(this.contract(parts.underlying, parts.expiration, parts.type, parts.strike));
    }
    const chain = /^\/v1beta1\/options\/snapshots\/([^/]+)$/.exec(route);
    if (chain) {
      const underlying = decodeURIComponent(chain[1] as string);
      const type = query.get("type") === "put" ? "put" : "call";
      const expiration = query.get("expiration_date");
      if (!(expiration && this.marks.has(underlying))) return ok({ snapshots: {} });
      const symbols = this.strikes(underlying).map((strike) =>
        buildOccSymbol({ underlying, expiration, type, strike }),
      );
      return ok({ snapshots: this.snapshots(symbols) });
    }
    if (route === "/v1beta1/options/snapshots") {
      const symbols = (query.get("symbols") ?? "").split(",").filter(Boolean);
      return ok({ snapshots: this.snapshots(symbols) });
    }
    return notFound();
  }

  post(): Promise<JsonResponse> {
    return notFound();
  }

  delete(): Promise<JsonResponse> {
    return notFound();
  }

  // --- internals -----------------------------------------------------------------------------

  private contracts(query: URLSearchParams): {
    option_contracts: unknown[];
    next_page_token: null;
  } {
    const underlying = query.get("underlying_symbols") ?? "";
    if (!this.marks.has(underlying)) return { option_contracts: [], next_page_token: null };
    const types: ("call" | "put")[] =
      query.get("type") === "put"
        ? ["put"]
        : query.get("type") === "call"
          ? ["call"]
          : ["call", "put"];
    const exact = query.get("expiration_date");
    const from = query.get("expiration_date_gte") ?? "";
    const dates = exact ? [exact] : this.expirations().filter((d) => d >= from);
    const rows: unknown[] = [];
    for (const expiration of dates) {
      for (const type of types) {
        for (const strike of this.strikes(underlying)) {
          rows.push(this.contract(underlying, expiration, type, strike));
        }
      }
    }
    return { option_contracts: rows, next_page_token: null };
  }

  private contract(underlying: string, expiration: string, type: "call" | "put", strike: number) {
    const value = this.value(underlying, strike, expiration, type);
    return {
      symbol: buildOccSymbol({ underlying, expiration, type, strike }),
      underlying_symbol: underlying,
      expiration_date: expiration,
      strike_price: String(strike),
      type,
      style: "american",
      tradable: true,
      status: "active",
      open_interest: "1000",
      close_price: value ? String(cents(value.price)) : null,
    };
  }

  private snapshots(symbols: readonly string[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const t = this.now().toISOString();
    for (const symbol of symbols) {
      const parts = parseOccSymbol(symbol);
      if (!parts) continue;
      const value = this.value(parts.underlying, parts.strike, parts.expiration, parts.type);
      if (!value) continue;
      const q = spread(value.price);
      out[symbol] = {
        latestQuote: { bp: q.bid, ap: q.ask, t },
        greeks: {
          delta: round4(value.delta),
          gamma: round4(value.gamma),
          theta: round4(value.theta),
          vega: round4(value.vega),
          rho: round4(value.rho),
        },
        impliedVolatility: this.vol(parts.underlying),
        dailyBar: { v: 100 },
      };
    }
    return out;
  }

  private value(underlying: string, strike: number, expiration: string, type: "call" | "put") {
    const spot = this.marks.get(underlying);
    if (spot === undefined) return undefined;
    const days = (Date.parse(`${expiration}T20:00:00Z`) - this.now().getTime()) / 86_400_000;
    if (!(days > 0)) return undefined;
    return priceOption({
      spot,
      strike,
      daysToExpiry: days,
      volatility: this.vol(underlying),
      rate: this.rate,
      type,
    });
  }

  private vol(underlying: string): number {
    return this.vols.get(underlying) ?? this.defaultVol;
  }

  /** Strikes from 70% to 130% of spot on the step a listed chain of that price uses. */
  private strikes(underlying: string): number[] {
    const spot = this.marks.get(underlying) ?? 0;
    const step = spot < 25 ? 1 : spot < 100 ? 2.5 : spot < 250 ? 5 : 10;
    const lo = Math.ceil((spot * 0.7) / step) * step;
    const hi = Math.floor((spot * 1.3) / step) * step;
    const out: number[] = [];
    for (let k = lo; k <= hi + 1e-9; k += step) out.push(Math.round(k * 1000) / 1000);
    return out;
  }

  /** The next six weekly Fridays, the next six monthly third-Fridays, and January next year. */
  private expirations(): string[] {
    const today = this.now();
    const dates = new Set<string>();
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    let fridays = 0;
    while (fridays < 6) {
      d.setUTCDate(d.getUTCDate() + 1);
      if (d.getUTCDay() === 5) {
        dates.add(tradingDay(d));
        fridays += 1;
      }
    }
    for (let m = 0; m < 7; m += 1) {
      const third = thirdFriday(today.getUTCFullYear(), today.getUTCMonth() + m);
      if (third > iso(today)) dates.add(third);
    }
    dates.add(thirdFriday(today.getUTCFullYear() + 1, 0));
    return [...dates].sort();
  }
}

function thirdFriday(year: number, month: number): string {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (5 - first.getUTCDay() + 7) % 7;
  return tradingDay(
    new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1 + offset + 14)),
  );
}

/** The fixed-date exchange holidays a Friday can land on; the listing moves to the Thursday, as
 *  the OCC lists a Christmas-week weekly. (Good Friday is not simulated.) */
const HOLIDAYS = new Set(["01-01", "06-19", "07-04", "12-25"]);

function tradingDay(friday: Date): string {
  const day = iso(friday);
  if (!HOLIDAYS.has(day.slice(5))) return day;
  return iso(new Date(friday.getTime() - 86_400_000));
}

const iso = (d: Date): string => d.toISOString().slice(0, 10);
const cents = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const round4 = (n: number): number => Math.round(n * 10_000) / 10_000;

/** A quoted market around a theoretical value: 4% wide, never under a nickel, bid floored at 0. */
function spread(mid: number): Quote {
  const width = Math.max(0.05, mid * 0.04);
  return { bid: cents(Math.max(0, mid - width / 2)), ask: cents(Math.max(0.01, mid + width / 2)) };
}

function split(path: string): [string, URLSearchParams] {
  const at = path.indexOf("?");
  return at < 0
    ? [path, new URLSearchParams()]
    : [path.slice(0, at), new URLSearchParams(path.slice(at + 1))];
}

const ok = (body: unknown): Promise<JsonResponse> => Promise.resolve({ status: 200, body });
const notFound = (): Promise<JsonResponse> =>
  Promise.resolve({ status: 404, body: { message: "not found" } });
