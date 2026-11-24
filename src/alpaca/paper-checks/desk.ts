/**
 * The paper checks' one seam to the broker (#8256): raw order bodies posted through the transport,
 * never `AlpacaTradingClient` — the client's `PlaceOrderParams` carries no OCO, no
 * `extended_hours` and no stock leg in an `mleg`, and these checks exist to ask about exactly those.
 * `src/trading/` and both clients' order methods stay untouched.
 *
 * Every order goes out with a `paperchk-<run>-<check>-<n>` client order id and lands in the run's
 * ledger, which is what cleanup cancels from. A broker refusal is an answer, recorded with the
 * HTTP status and message as returned; it never throws.
 */
import type { JsonResponse } from "../../http/fetch-json.js";
import type { AlpacaTradingTransport } from "../trading-transport.js";
import { type CheckId, ORDER_PREFIX } from "./catalog.js";
import type { MarketFacts } from "./windows.js";

export type AttemptResult = "accepted" | "refused" | "error" | "dry run";

export interface LegStatus {
  readonly side?: string;
  readonly type?: string;
  readonly status?: string;
}

/** One request a check sent, and the broker's answer as returned. */
export interface Attempt {
  readonly label: string;
  readonly result: AttemptResult;
  readonly httpStatus?: number;
  readonly orderStatus?: string;
  readonly message?: string;
  readonly orderId?: string;
  readonly legs?: readonly LegStatus[];
  readonly fillPrice?: string;
  /** A quote read (check 3): the quote's own time, and its age when it was read. */
  readonly quoteAt?: string;
  readonly ageSeconds?: number;
}

/** Everything this run placed: order ids (legs included) and the symbols it bought. */
export interface Ledger {
  readonly orders: Map<string, CheckId>;
  readonly bought: Set<string>;
  readonly sequence: Map<CheckId, number>;
}

export const newLedger = (): Ledger => ({
  orders: new Map(),
  bought: new Set(),
  sequence: new Map(),
});

export interface Desk {
  readonly trading: AlpacaTradingTransport;
  readonly data: AlpacaTradingTransport;
  readonly now: () => number;
  readonly sleep: (ms: number) => Promise<void>;
  readonly runId: string;
  readonly dryRun: boolean;
  readonly sameDayQty: number;
  readonly campaignSymbols: readonly string[];
  readonly facts: MarketFacts;
  readonly ledger: Ledger;
}

/** The client order id prefix every order of this run carries. */
export const runPrefix = (runId: string): string => `${ORDER_PREFIX}${runId}-`;

type Json = Record<string, unknown>;
const asObject = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

function legsOf(body: Json): LegStatus[] | undefined {
  if (!Array.isArray(body.legs)) return undefined;
  return body.legs.map((leg) => {
    const l = asObject(leg);
    return {
      ...(str(l.side) ? { side: str(l.side) } : {}),
      ...(str(l.type) ? { type: str(l.type) } : {}),
      ...(str(l.status) ? { status: str(l.status) } : {}),
    };
  });
}

/** The broker's answer, as returned: 2xx accepted, 4xx refused, anything else an error. */
export function classify(label: string, response: JsonResponse): Attempt {
  const body = asObject(response.body);
  if (response.status === 0) return { label, result: "dry run" };
  const result: AttemptResult =
    response.status >= 200 && response.status < 300
      ? "accepted"
      : response.status >= 400 && response.status < 500
        ? "refused"
        : "error";
  const message = str(body.message) ?? str(body.error);
  const legs = legsOf(body);
  const fill = str(body.filled_avg_price);
  return {
    label,
    result,
    httpStatus: response.status,
    ...(str(body.status) ? { orderStatus: str(body.status) } : {}),
    ...(message ? { message } : {}),
    ...(result === "accepted" && str(body.id) ? { orderId: str(body.id) } : {}),
    ...(legs ? { legs } : {}),
    ...(fill ? { fillPrice: fill } : {}),
  };
}

function record(desk: Desk, check: CheckId, response: JsonResponse): void {
  const body = asObject(response.body);
  const id = str(body.id);
  if (response.status < 200 || response.status >= 300 || !id) return;
  desk.ledger.orders.set(id, check);
  for (const leg of Array.isArray(body.legs) ? body.legs : []) {
    const legId = str(asObject(leg).id);
    if (legId) desk.ledger.orders.set(legId, check);
  }
}

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** POST one order with this run's client order id; the answer is recorded, never thrown. */
export async function placeOrder(
  desk: Desk,
  check: CheckId,
  label: string,
  body: Json,
): Promise<Attempt> {
  const n = (desk.ledger.sequence.get(check) ?? 0) + 1;
  desk.ledger.sequence.set(check, n);
  const order = { ...body, client_order_id: `${runPrefix(desk.runId)}${check}-${n}` };
  try {
    const response = await desk.trading.post("/v2/orders", order);
    record(desk, check, response);
    return classify(label, response);
  } catch (error) {
    return { label, result: "error", message: errorText(error) };
  }
}

/** Read one order back with its legs nested; a failed read is an error attempt, never a throw. */
export async function readOrder(desk: Desk, label: string, id: string): Promise<Attempt> {
  try {
    return classify(
      label,
      await desk.trading.get(`/v2/orders/${encodeURIComponent(id)}?nested=true`),
    );
  } catch (error) {
    return { label, result: "error", message: errorText(error) };
  }
}

/** The last IEX trade's price, which every unfillable limit is priced from. */
export async function lastTrade(desk: Desk, symbol: string): Promise<number> {
  const response = await desk.data.get(
    `/v2/stocks/${encodeURIComponent(symbol)}/trades/latest?feed=iex`,
  );
  const price = Number(asObject(asObject(response.body).trade).p);
  if (response.status !== 200 || !(price > 0)) {
    throw new Error(`no IEX last trade for ${symbol} (HTTP ${response.status})`);
  }
  return price;
}

const cents = (n: number): number => Math.round(n * 100) / 100;

/** A buy limit that can't fill: 30% of the last trade, rounded DOWN to the cent. */
export const unfillableBuy = (last: number): number => Math.floor(last * 0.3 * 100) / 100;

/** A bracket's legs around an entry, far enough that neither triggers before cleanup. */
export const bracketLegs = (entry: number): Json => ({
  take_profit: { limit_price: cents(entry * 1.5) },
  stop_loss: { stop_price: cents(entry * 0.5) },
});

/** An option contract whose indicative ask is at least $0.50, so a $0.01 bid can't fill. */
export async function pricedCall(
  desk: Desk,
  underlying: string,
  expiry: string,
): Promise<{ symbol: string; ask: number } | undefined> {
  const response = await desk.data.get(
    `/v1beta1/options/snapshots/${encodeURIComponent(underlying)}?feed=indicative&type=call&${expiry}&limit=500`,
  );
  const snapshots = asObject(asObject(response.body).snapshots);
  for (const symbol of Object.keys(snapshots).sort()) {
    const ask = Number(asObject(asObject(snapshots[symbol]).latestQuote).ap);
    if (ask >= 0.5) return { symbol, ask };
  }
  return undefined;
}
