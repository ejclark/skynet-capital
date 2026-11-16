import type { AlpacaTradingTransport } from "../alpaca/trading-transport.js";
import type { JsonResponse } from "../http/fetch-json.js";
import { contractMultiplier, isOccSymbol } from "../trading/option-symbols.js";
import type { AccountFixture } from "./fixture-trading-transport.js";

/**
 * An offline Trading API whose WRITES LAND — the paper account a simulated member can actually
 * change (#change-scenarios). `FixtureTradingTransport` answers every POST/DELETE with a benign
 * no-op so the offline path never rejects an order for the wrong reason; that is right for a
 * screenshot, and it makes the one question a change test asks — "did the member's order land,
 * at the side, size and price they meant?" — unanswerable: the order is never seen again.
 *
 * This transport keeps one account's orders, positions and cash in memory and applies Alpaca's
 * own write contract to them, so everything above it (trade service, desk orders view, blotter)
 * reads back exactly what the member did:
 *
 *  - `POST /v2/orders` — a simple order (stock or OCC contract) or an `mleg` parent. A market
 *    order fills at once at the symbol's mark; a limit fills at the mark when marketable, else it
 *    rests (`new`); a stop / stop-limit rests. A buy that costs more than cash answers 403
 *    "insufficient buying power", Alpaca's own refusal, so a guardrail scenario meets a real wall.
 *  - `PATCH /v2/orders/:id` — replace: the old order becomes `replaced`, the new one `replaces` it.
 *  - `DELETE /v2/orders/:id` · `DELETE /v2/orders` — cancel one · cancel every open order (207).
 *  - `DELETE /v2/positions/:symbol` — close at the mark with a filled market order.
 *
 * WHY NOT THE IN-MEMORY BROKER (`in-memory-broker.ts`): that is a `BrokerPort` — domain intents,
 * long-only, stock-only. The server reads Alpaca REST shapes through this seam, so the honest
 * offline twin of a paper account has to speak those shapes, options and replace included.
 *
 * WHY OPT-IN (`SKYNET_OFFLINE_WRITES=apply`, `runtime/data-source.ts`): the crawl and the journeys
 * replay a frozen book and must read the same bytes on every run; a write that lands mid-suite
 * would change what the next spec sees. A change test boots its own server with writes on.
 *
 * Marks: the price an order fills at — the fixture position's own `market_value / (qty ×
 * multiplier)`, overlaid by `marks` (the replay's last price per symbol). A symbol with no mark
 * never fills a market order (it stays `accepted`, as a real order would before the open) — the
 * transport never invents a price. Ids and stamps are deterministic (a counter and `now()`).
 */
export interface WritableFixtureOptions {
  /** Last known price per symbol (stock ticker or OCC contract), per share. */
  readonly marks?: ReadonlyMap<string, number>;
  /** A quoting market (`synthetic-market-transport.ts`): a buy fills at its ask, a sell at its
   *  bid — the in-memory broker's own rule — and the reads this account does not own (option
   *  contracts) fall through to it. Without one, a fill uses the mark on both sides. */
  readonly market?: MarketSource;
  /** Told of every fill, the moment it lands — the offline twin of Alpaca's `trade_updates`
   *  stream, so the board shows the new position at once instead of on the next 60s sweep. */
  /** Alpaca's `/v2/clock` as of now. Absent, the fixture's clock (default: open). While it says
   *  closed, a market order queues (`accepted`) and a limit rests — they fill at no price until the
   *  open, exactly as a paper account answers an order placed in the evening. */
  readonly clock?: () => { is_open: boolean; next_open?: string; next_close?: string };
  readonly onFill?: (fill: {
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
    price: number;
    at: string;
  }) => void;
  /** The clock stamped on submitted/filled/cancelled — injectable for deterministic tests. */
  readonly now?: () => Date;
  /** Id prefix, so two accounts' orders never share an id in one server. */
  readonly idPrefix?: string;
}

/** What a fill reads from a market — the quote, plus the reads this account does not own. */
export interface MarketSource {
  quote(symbol: string): { bid: number; ask: number } | undefined;
  get(path: string): Promise<JsonResponse>;
}

interface Order {
  id: string;
  client_order_id: string;
  symbol: string;
  qty: string;
  side: "buy" | "sell";
  type: string;
  time_in_force: string;
  status: string;
  limit_price: string | null;
  stop_price: string | null;
  filled_qty: string;
  filled_avg_price: string | null;
  submitted_at: string;
  filled_at: string | null;
  canceled_at: string | null;
  replaces: string | null;
  replaced_by: string | null;
  order_class: string;
  position_intent?: string;
  asset_class: string;
  legs: Order[] | null;
  ratio_qty?: string;
}

interface Position {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  side: "long" | "short";
  asset_class: string;
  lastday_price?: string;
  [key: string]: unknown;
}

/** Alpaca's open statuses — the ones a cancel or replace may still touch. */
const OPEN = new Set(["new", "accepted", "pending_new", "partially_filled", "held"]);
const ORDER_TYPES = new Set(["market", "limit", "stop", "stop_limit"]);

export class WritableFixtureTradingTransport implements AlpacaTradingTransport {
  private readonly account: Record<string, unknown>;
  private cash: number;
  private readonly positions: Position[];
  private readonly orders: Order[];
  private readonly clock: unknown;
  private readonly marks = new Map<string, number>();
  private readonly now: () => Date;
  private readonly idPrefix: string;
  private readonly market: MarketSource | undefined;
  private readonly onFill: WritableFixtureOptions["onFill"];
  private readonly liveClock: WritableFixtureOptions["clock"];
  private seq = 0;

  constructor(fixture: AccountFixture, options: WritableFixtureOptions = {}) {
    this.account = { ...(fixture.account as Record<string, unknown>) };
    this.cash = num(this.account.cash);
    this.positions = asArray(fixture.positions).map((p) => normalisePosition(p));
    this.orders = asArray(fixture.orders).map((o) => ({ ...(o as Order) }));
    this.clock = fixture.clock ?? { is_open: true };
    this.now = options.now ?? (() => new Date());
    this.idPrefix = options.idPrefix ?? "paper";
    this.market = options.market;
    this.onFill = options.onFill;
    this.liveClock = options.clock;
    for (const p of this.positions) {
      const qty = num(p.qty);
      if (qty !== 0)
        this.marks.set(p.symbol, Math.abs(num(p.market_value) / (qty * mult(p.symbol))));
    }
    for (const [symbol, price] of options.marks ?? []) this.marks.set(symbol, price);
  }

  /** Move a symbol's mark (the replay's tick) — marks every held position to it as well. */
  mark(symbol: string, price: number): void {
    this.marks.set(symbol, price);
    const p = this.positions.find((x) => x.symbol === symbol);
    if (p) p.market_value = money(num(p.qty) * price * mult(symbol));
  }

  get(path: string): Promise<JsonResponse> {
    const [route, query] = split(path);
    if (route === "/v2/account") return ok(this.accountBody());
    if (route === "/v2/positions") {
      this.revalue();
      return ok(this.positions.map((p) => ({ ...p })));
    }
    if (route === "/v2/clock") return ok(this.liveClock ? this.liveClock() : this.clock);
    if (route === "/v2/orders") return ok(this.listOrders(query));
    if (route === "/v2/orders:by_client_order_id") {
      const found = this.orders.find((o) => o.client_order_id === query.get("client_order_id"));
      return found ? ok(found) : notFound();
    }
    const orderId = under(route, "/v2/orders/");
    if (orderId) {
      const found = this.orders.find((o) => o.id === orderId);
      return found ? ok(found) : notFound();
    }
    const symbol = under(route, "/v2/positions/");
    if (symbol) {
      const found = this.positions.find((p) => p.symbol === decodeURIComponent(symbol));
      return found ? ok(found) : notFound();
    }
    return this.market ? this.market.get(path) : notFound();
  }

  post(path: string, body: unknown): Promise<JsonResponse> {
    const [route] = split(path);
    if (route !== "/v2/orders") return notFound();
    const input = (body ?? {}) as Record<string, unknown>;
    const refusal = this.refuse(input);
    if (refusal) return refusal;
    const order = this.place(input);
    return ok(order);
  }

  patch(path: string, body: unknown): Promise<JsonResponse> {
    const id = under(split(path)[0], "/v2/orders/");
    const old = id ? this.orders.find((o) => o.id === id) : undefined;
    if (!old) return notFound();
    if (!OPEN.has(old.status)) return unprocessable(`order is ${old.status}, not open`);
    const change = (body ?? {}) as Record<string, unknown>;
    if (Object.keys(change).length === 0) return unprocessable("nothing to replace");
    const stamp = this.stamp();
    const next = this.place({
      symbol: old.symbol,
      side: old.side,
      type: old.type,
      qty: change.qty ?? old.qty,
      time_in_force: change.time_in_force ?? old.time_in_force,
      limit_price: change.limit_price ?? old.limit_price ?? undefined,
      stop_price: change.stop_price ?? old.stop_price ?? undefined,
      position_intent: old.position_intent,
    });
    next.replaces = old.id;
    old.status = "replaced";
    old.replaced_by = next.id;
    old.canceled_at = stamp;
    return ok(next);
  }

  delete(path: string): Promise<JsonResponse> {
    const [route] = split(path);
    if (route === "/v2/orders") {
      const open = this.orders.filter((o) => OPEN.has(o.status));
      for (const o of open) this.cancel(o);
      return Promise.resolve({ status: 207, body: open.map((o) => ({ id: o.id, status: 200 })) });
    }
    const orderId = under(route, "/v2/orders/");
    if (orderId) {
      const found = this.orders.find((o) => o.id === orderId);
      if (!found) return notFound();
      if (!OPEN.has(found.status)) return unprocessable(`order is ${found.status}, not open`);
      this.cancel(found);
      return Promise.resolve({ status: 204, body: null });
    }
    const symbol = under(route, "/v2/positions/");
    if (symbol) {
      const held = this.positions.find((p) => p.symbol === decodeURIComponent(symbol));
      if (!held) return notFound();
      const qty = num(held.qty);
      return ok(
        this.place({
          symbol: held.symbol,
          qty: Math.abs(qty),
          side: qty > 0 ? "sell" : "buy",
          type: "market",
        }),
      );
    }
    return notFound();
  }

  // --- internals -----------------------------------------------------------------------------

  /** Mark every held position to the quoting market's mid, so value and P/L read as of now. */
  private revalue(): void {
    if (!this.market) return;
    for (const p of this.positions) {
      const q = this.market.quote(p.symbol);
      if (q) p.market_value = money(num(p.qty) * ((q.bid + q.ask) / 2) * mult(p.symbol));
    }
  }

  private accountBody(): Record<string, unknown> {
    this.revalue();
    const held = this.positions.reduce((sum, p) => sum + num(p.market_value), 0);
    return { ...this.account, cash: money(this.cash), portfolio_value: money(this.cash + held) };
  }

  private listOrders(query: URLSearchParams): Order[] {
    const status = query.get("status") ?? "open";
    const limit = Number(query.get("limit") ?? 50);
    const nested = query.get("nested") === "true";
    const rows = this.orders
      .filter((o) => status === "all" || (status === "open") === OPEN.has(o.status))
      .sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));
    const page = rows.slice(0, Number.isFinite(limit) && limit > 0 ? limit : 50);
    return nested ? page : page.map((o) => ({ ...o, legs: null }));
  }

  /** Alpaca's own refusals, in its own words — the walls a guardrail scenario must meet. */
  private refuse(input: Record<string, unknown>): Promise<JsonResponse> | undefined {
    const type = String(input.type ?? "market");
    if (!ORDER_TYPES.has(type)) return unprocessable(`invalid order type ${type}`);
    const qty = num(input.qty);
    if (!(qty > 0)) return unprocessable("qty must be > 0");
    if (input.order_class === "mleg") {
      if (!Array.isArray(input.legs) || input.legs.length < 2)
        return unprocessable("mleg needs 2+ legs");
      return undefined;
    }
    if (input.side !== "buy" && input.side !== "sell")
      return unprocessable("side must be buy or sell");
    if (typeof input.symbol !== "string" || input.symbol === "")
      return unprocessable("symbol is required");
    if ((type === "limit" || type === "stop_limit") && !(num(input.limit_price) > 0)) {
      return unprocessable("limit_price is required for a limit order");
    }
    if ((type === "stop" || type === "stop_limit") && !(num(input.stop_price) > 0)) {
      return unprocessable("stop_price is required for a stop order");
    }
    if (input.side === "buy" && this.opensLong(input.symbol, qty)) {
      const price =
        type === "limit" || type === "stop_limit"
          ? num(input.limit_price)
          : this.quote(input.symbol)?.ask;
      const cost = (price ?? 0) * qty * mult(input.symbol);
      if (cost > this.cash + 1e-6) {
        return Promise.resolve({
          status: 403,
          body: { code: 40310000, message: "insufficient buying power" },
        });
      }
    }
    return undefined;
  }

  /** A buy adds to (or opens) a long — a buy that covers a short spends nothing new to check. */
  private opensLong(symbol: string, qty: number): boolean {
    const held = this.positions.find((p) => p.symbol === symbol);
    return !held || num(held.qty) >= 0 || qty > Math.abs(num(held.qty));
  }

  private place(input: Record<string, unknown>): Order {
    this.seq += 1;
    const stamp = this.stamp();
    const id = `${this.idPrefix}-${this.seq}`;
    const isLeg = input.order_class === "mleg";
    const symbol = isLeg ? "" : String(input.symbol);
    const type = String(input.type ?? "market");
    const order: Order = {
      id,
      client_order_id:
        typeof input.client_order_id === "string" ? input.client_order_id : `${id}-client`,
      symbol,
      qty: String(num(input.qty)),
      side: (input.side as "buy" | "sell") ?? "buy",
      type,
      time_in_force: String(input.time_in_force ?? (type === "market" ? "day" : "gtc")),
      status: "new",
      limit_price: input.limit_price !== undefined ? String(num(input.limit_price)) : null,
      stop_price: input.stop_price !== undefined ? String(num(input.stop_price)) : null,
      filled_qty: "0",
      filled_avg_price: null,
      submitted_at: stamp,
      filled_at: null,
      canceled_at: null,
      replaces: null,
      replaced_by: null,
      order_class: isLeg ? "mleg" : "simple",
      asset_class: isLeg || isOccSymbol(symbol) ? "us_option" : "us_equity",
      legs: null,
      ...(typeof input.position_intent === "string"
        ? { position_intent: input.position_intent }
        : {}),
    };
    if (isLeg) {
      order.legs = (input.legs as Record<string, unknown>[]).map((leg, i) => ({
        ...order,
        id: `${id}-leg${i + 1}`,
        client_order_id: `${id}-leg${i + 1}-client`,
        symbol: String(leg.symbol),
        side: leg.side as "buy" | "sell",
        ratio_qty: String(leg.ratio_qty ?? 1),
        order_class: "mleg",
        legs: null,
        ...(typeof leg.position_intent === "string"
          ? { position_intent: leg.position_intent }
          : {}),
      }));
    }
    this.orders.push(order);
    if (!isLeg) this.tryFill(order);
    return order;
  }

  /** The market a fill meets: the quoting market's bid/ask, else the mark on both sides. */
  private quote(symbol: string): { bid: number; ask: number } | undefined {
    const quoted = this.market?.quote(symbol);
    if (quoted) return quoted;
    const mark = this.marks.get(symbol);
    return mark === undefined ? undefined : { bid: mark, ask: mark };
  }

  /** Fill at the touch when the order is marketable — never at an invented price. */
  private tryFill(order: Order): void {
    const quote = this.quote(order.symbol);
    const open = this.liveClock
      ? this.liveClock().is_open
      : (this.clock as { is_open?: boolean })?.is_open !== false;
    if (quote === undefined || !open) {
      if (order.type === "market") order.status = "accepted";
      return;
    }
    const mark = order.side === "buy" ? quote.ask : quote.bid;
    const limit = order.limit_price === null ? undefined : num(order.limit_price);
    const marketable =
      order.type === "market" ||
      (order.type === "limit" &&
        limit !== undefined &&
        (order.side === "buy" ? limit >= mark : limit <= mark));
    if (!marketable) return;
    const qty = num(order.qty);
    order.status = "filled";
    order.filled_qty = String(qty);
    order.filled_avg_price = String(mark);
    order.filled_at = order.submitted_at;
    this.apply(order.symbol, order.side === "buy" ? qty : -qty, mark);
    this.onFill?.({
      symbol: order.symbol,
      side: order.side,
      quantity: qty,
      price: mark,
      at: order.submitted_at,
    });
  }

  private apply(symbol: string, signedQty: number, price: number): void {
    const m = mult(symbol);
    this.cash -= signedQty * price * m;
    const held = this.positions.find((p) => p.symbol === symbol);
    const before = held ? num(held.qty) : 0;
    const after = before + signedQty;
    if (after === 0) {
      if (held) this.positions.splice(this.positions.indexOf(held), 1);
      return;
    }
    const sameWay = before === 0 || Math.sign(before) === Math.sign(signedQty);
    const flipped = before !== 0 && Math.sign(after) !== Math.sign(before);
    const avg =
      flipped || !held
        ? price
        : sameWay
          ? (Math.abs(before) * num(held.avg_entry_price) + Math.abs(signedQty) * price) /
            Math.abs(after)
          : num(held.avg_entry_price);
    const next: Position = {
      ...(held ?? {}),
      symbol,
      qty: String(after),
      avg_entry_price: String(round(avg, 4)),
      market_value: money(after * price * m),
      side: after > 0 ? "long" : "short",
      asset_class: isOccSymbol(symbol) ? "us_option" : "us_equity",
    };
    if (held) this.positions[this.positions.indexOf(held)] = next;
    else this.positions.push(next);
  }

  private cancel(order: Order): void {
    order.status = "canceled";
    order.canceled_at = this.stamp();
  }

  private stamp(): string {
    return this.now().toISOString();
  }
}

function normalisePosition(raw: unknown): Position {
  const p = { ...(raw as Position) };
  const qty = num(p.qty);
  return {
    ...p,
    side: (p.side as "long" | "short") ?? (qty < 0 ? "short" : "long"),
    asset_class: p.asset_class ?? (isOccSymbol(p.symbol) ? "us_option" : "us_equity"),
  };
}

const mult = (symbol: string): number => contractMultiplier(symbol);

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

const round = (n: number, places: number): number => Math.round(n * 10 ** places) / 10 ** places;
const money = (n: number): string => round(n, 2).toFixed(2);

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function split(path: string): [string, URLSearchParams] {
  const at = path.indexOf("?");
  return at < 0
    ? [path, new URLSearchParams()]
    : [path.slice(0, at), new URLSearchParams(path.slice(at + 1))];
}

/** The id after `prefix` when `route` is exactly one segment under it. */
function under(route: string, prefix: string): string | undefined {
  if (!route.startsWith(prefix)) return undefined;
  const rest = route.slice(prefix.length);
  return rest !== "" && !rest.includes("/") ? rest : undefined;
}

const ok = (body: unknown): Promise<JsonResponse> => Promise.resolve({ status: 200, body });
const notFound = (): Promise<JsonResponse> =>
  Promise.resolve({ status: 404, body: { message: "not found" } });
const unprocessable = (message: string): Promise<JsonResponse> =>
  Promise.resolve({ status: 422, body: { code: 42210000, message } });
