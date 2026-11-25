/**
 * Cancel everything the run placed (#8256), however the run ended: finished, refused, a thrown
 * error, SIGINT or SIGTERM. Cancels every open order whose id is in the run's ledger or whose
 * client order id carries the tool's `paperchk-` prefix (legs included), closes any position — the guard proved
 * the account held none at the start, so every position now is this run's — then reads both again.
 * Anything still open is named, and the command exits 1.
 *
 * A list read that fails (a throw, a non-200, a body that isn't a list) is never an empty list
 * (#8371): the cancel pass falls back to the ledger's own ids and symbols, and a confirm read that
 * still fails after five tries names the ledger's ids as not confirmed closed, and exits 1.
 */
import { ORDER_PREFIX } from "./catalog.js";
import { asObject, type Desk } from "./desk.js";

export interface CleanupReport {
  /** Order ids still open after cleanup — or, with `ordersUnread`, every id the run placed,
   *  since none can be confirmed closed. Named in the results file. */
  readonly stillOpen: readonly string[];
  /** Symbols still held after cleanup — with `positionsUnread`, every symbol the run bought. */
  readonly positionsLeft: readonly string[];
  /** Why the last open-orders read failed (`HTTP 429`, `no answer`); absent when it answered. */
  readonly ordersUnread?: string;
  /** Why the last positions read failed; absent when it answered. */
  readonly positionsUnread?: string;
}

const OPEN_ORDERS = "/v2/orders?status=open&nested=true&limit=500";

interface OpenOrder {
  readonly id: string;
  readonly clientOrderId: string;
}

function flatten(orders: unknown): OpenOrder[] {
  if (!Array.isArray(orders)) return [];
  return orders.flatMap((raw) => {
    const o = asObject(raw);
    const self =
      typeof o.id === "string"
        ? [{ id: o.id, clientOrderId: String(o.client_order_id ?? "") }]
        : [];
    return [...self, ...flatten(o.legs)];
  });
}

async function quietly<T>(work: () => Promise<T>): Promise<T | undefined> {
  try {
    return await work();
  } catch {
    return undefined;
  }
}

/** A list as the broker returned it, or why the read failed. The error text is never kept: it
 *  can carry a URL or a header, and the reason lands in a public record. */
async function list(desk: Desk, path: string): Promise<unknown[] | string> {
  try {
    const response = await desk.trading.get(path);
    if (response.status === 200 && Array.isArray(response.body)) return response.body;
    return `HTTP ${response.status}`;
  } catch {
    return "no answer";
  }
}

/** This run's orders, and any `paperchk-` order an earlier run left behind (a SIGKILL, an exit 1):
 *  the guard admitted those, and every one of them is this tool's own on a dedicated account.
 *  With the list unread, the ledger's own ids — legs included — are all it can name. */
function ours(desk: Desk, orders: unknown[] | string): string[] {
  if (typeof orders === "string") return [...desk.ledger.orders.keys()];
  return flatten(orders)
    .filter((o) => desk.ledger.orders.has(o.id) || o.clientOrderId.startsWith(ORDER_PREFIX))
    .map((o) => o.id);
}

/** Every symbol held, or — with the list unread — every symbol this run bought. */
function held(desk: Desk, positions: unknown[] | string): string[] {
  if (typeof positions === "string") return [...desk.ledger.bought];
  return positions.map((p) => String(asObject(p).symbol ?? "")).filter((s) => s.length > 0);
}

async function confirm(desk: Desk): Promise<CleanupReport> {
  const orders = await list(desk, OPEN_ORDERS);
  const positions = await list(desk, "/v2/positions");
  return {
    stillOpen: ours(desk, orders),
    positionsLeft: held(desk, positions),
    ...(typeof orders === "string" ? { ordersUnread: orders } : {}),
    ...(typeof positions === "string" ? { positionsUnread: positions } : {}),
  };
}

const clean = (r: CleanupReport): boolean =>
  r.stillOpen.length === 0 &&
  r.positionsLeft.length === 0 &&
  r.ordersUnread === undefined &&
  r.positionsUnread === undefined;

/** Cancel, close, then re-read (5 reads, 1s apart) until nothing of this run is open. */
export async function cleanup(desk: Desk): Promise<CleanupReport> {
  for (const id of ours(desk, await list(desk, OPEN_ORDERS))) {
    await quietly(() => desk.trading.delete(`/v2/orders/${encodeURIComponent(id)}`));
  }
  for (const symbol of held(desk, await list(desk, "/v2/positions"))) {
    await quietly(() => desk.trading.delete(`/v2/positions/${encodeURIComponent(symbol)}`));
  }
  let report = await confirm(desk);
  for (let read = 1; read < 5 && !desk.dryRun && !clean(report); read += 1) {
    await desk.sleep(1000);
    report = await confirm(desk);
  }
  return report;
}
