// A fake Alpaca for the paper checks' specs (#8256): one in-memory paper account, its open orders
// and positions, a broker clock and calendar, and the data endpoints the checks read. Every call is
// recorded, so a spec can say "no POST was sent" or "this body went out".

import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import { newYorkInstant } from "../../src/domain/market-session.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

export interface Call {
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  readonly path: string;
  readonly body?: Record<string, unknown>;
}

type Order = Record<string, unknown> & { id: string; legs?: Order[] };

export const KEY = "PKTESTKEY0000000001";
export const SECRET = "test-secret-do-not-print";
export const ACCOUNT_ID = "acct-uuid-7f3e";
export const ACCOUNT_NUMBER = "PA3XYZ0001";

/** A sync handler as a transport's promise: a throw becomes a rejection, as a dropped socket would. */
function settle(handle: () => JsonResponse): Promise<JsonResponse> {
  try {
    return Promise.resolve(handle());
  } catch (error) {
    return Promise.reject(error);
  }
}

/** ET wall time → epoch ms. */
export const et = (date: string, hh: number, mm = 0): number => newYorkInstant(date, hh * 60 + mm);

export class FakeAlpaca {
  readonly calls: Call[] = [];
  readonly open = new Map<string, Order>();
  readonly filled = new Map<string, Order>();
  positions: string[] = [];
  accountNumber = ACCOUNT_NUMBER;
  isOpen = false;
  extendedFlag: ReadonlySet<string> = new Set();
  /** Return a response to refuse a POSTed order instead of accepting it. */
  refuse: (body: Record<string, unknown>) => JsonResponse | undefined = () => undefined;
  /** Throw on the nth DELETE (1-based) — a check that dies mid-flight. */
  throwOnDelete = 0;
  /** False: a market order rests unfilled (a halted name, a slow fractional fill). */
  fillMarket = true;
  /** Order ids the broker won't cancel — a stuck order. */
  readonly stuck = new Set<string>();
  private seq = 0;
  private deletes = 0;

  constructor(private readonly clock: { now: number }) {}

  private orderFor(body: Record<string, unknown>): Order {
    this.seq += 1;
    const id = `ord-${this.seq}`;
    const market = body.type === "market" && this.fillMarket;
    const legs =
      body.order_class === "bracket" || body.order_class === "oco"
        ? [
            { id: `${id}-tp`, side: "sell", type: "limit", status: "held" },
            { id: `${id}-sl`, side: "sell", type: "stop", status: "held" },
          ]
        : undefined;
    return {
      id,
      client_order_id: body.client_order_id,
      status: market ? "filled" : "accepted",
      ...(market ? { filled_avg_price: "600.10" } : {}),
      ...(legs ? { legs } : {}),
    };
  }

  readonly trading: AlpacaTradingTransport = {
    get: (path) =>
      settle(() => {
        this.calls.push({ method: "GET", path });
        if (path === "/v2/account") {
          return { status: 200, body: { id: ACCOUNT_ID, account_number: this.accountNumber } };
        }
        if (path === "/v2/positions")
          return { status: 200, body: this.positions.map((symbol) => ({ symbol })) };
        if (path.startsWith("/v2/orders?")) return { status: 200, body: [...this.open.values()] };
        if (path.startsWith("/v2/orders/")) {
          const id = decodeURIComponent(path.slice("/v2/orders/".length).split("?")[0] ?? "");
          const order = this.open.get(id);
          return { status: 200, body: order ?? this.filled.get(id) ?? { id, status: "canceled" } };
        }
        if (path === "/v2/clock") return { status: 200, body: { is_open: this.isOpen } };
        if (path.startsWith("/v2/calendar?")) return { status: 200, body: this.calendar(path) };
        if (path.startsWith("/v2/assets/")) {
          const symbol = path.slice("/v2/assets/".length);
          return {
            status: 200,
            body: { symbol, has_options_extended_hours: this.extendedFlag.has(symbol) },
          };
        }
        return { status: 404, body: { message: `fake: no route ${path}` } };
      }),
    post: (path, body) =>
      settle(() => {
        const order = body as Record<string, unknown>;
        this.calls.push({ method: "POST", path, body: order });
        const refusal = this.refuse(order);
        if (refusal) return refusal;
        const placed = this.orderFor(order);
        if (order.type === "market" && this.fillMarket) {
          if (order.side === "buy") this.positions.push(String(order.symbol));
          else this.positions = this.positions.filter((s) => s !== order.symbol);
          this.filled.set(placed.id, placed);
        } else {
          this.open.set(placed.id, placed);
        }
        return { status: 200, body: placed };
      }),
    delete: (path) =>
      settle(() => {
        this.calls.push({ method: "DELETE", path });
        this.deletes += 1;
        if (this.deletes === this.throwOnDelete) throw new Error("fake: connection reset");
        const id = decodeURIComponent(path.split("/").pop() ?? "");
        if (path.startsWith("/v2/positions/"))
          this.positions = this.positions.filter((s) => s !== id);
        else if (!this.stuck.has(id)) this.open.delete(id);
        return { status: 204, body: null };
      }),
  };

  readonly data: AlpacaTradingTransport = {
    get: (path) =>
      settle(() => {
        this.calls.push({ method: "GET", path });
        const t = new Date(this.clock.now - 12_000).toISOString();
        if (path.includes("/trades/latest")) {
          if (path.includes("feed=boats"))
            return {
              status: 403,
              body: { message: "subscription does not permit querying boats" },
            };
          return { status: 200, body: { trade: { p: 600, t } } };
        }
        if (path.includes("/quotes/latest")) {
          if (path.includes("feed=boats"))
            return {
              status: 403,
              body: { message: "subscription does not permit querying boats" },
            };
          return { status: 200, body: { quote: { ap: 600.05, bp: 600, t } } };
        }
        if (path.startsWith("/v1beta1/options/snapshots/")) {
          const underlying = path.split("/")[4]?.split("?")[0] ?? "";
          return {
            status: 200,
            body: {
              snapshots: {
                [`${underlying}261124C00600000`]: { latestQuote: { ap: 1.25, bp: 1.2 } },
              },
            },
          };
        }
        return { status: 404, body: { message: `fake: no route ${path}` } };
      }),
    post: () => Promise.resolve({ status: 405, body: null }),
    delete: () => Promise.resolve({ status: 405, body: null }),
  };

  /** Weekday sessions 09:30-16:00 across the asked range (no holidays: the specs pick their days). */
  private calendar(path: string): unknown[] {
    const query = new URLSearchParams(path.split("?")[1]);
    const rows: unknown[] = [];
    for (
      let at = Date.parse(`${query.get("start")}T12:00:00Z`);
      at <= Date.parse(`${query.get("end")}T12:00:00Z`);
      at += 86_400_000
    ) {
      const day = new Date(at);
      if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
      rows.push({ date: day.toISOString().slice(0, 10), open: "09:30", close: "16:00" });
    }
    return rows;
  }

  writes(): Call[] {
    return this.calls.filter((c) => c.method !== "GET");
  }

  posted(): Record<string, unknown>[] {
    return this.calls.filter((c) => c.method === "POST").map((c) => c.body ?? {});
  }
}
