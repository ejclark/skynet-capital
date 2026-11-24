/**
 * Cancel everything the run placed (#8256), however the run ended: finished, refused, a thrown
 * error, SIGINT or SIGTERM. Cancels every open order whose id is in the run's ledger or whose
 * client order id carries the run's prefix (legs included), closes any position — the guard proved
 * the account held none at the start, so every position now is this run's — then reads both again.
 * Anything still open is named, and the command exits 1.
 */
import { type Desk, runPrefix } from "./desk.js";

export interface CleanupReport {
  /** Order ids still open after cleanup — named in the results file. */
  readonly stillOpen: readonly string[];
  /** Symbols still held after cleanup. */
  readonly positionsLeft: readonly string[];
}

interface OpenOrder {
  readonly id: string;
  readonly clientOrderId: string;
}

type Json = Record<string, unknown>;

function flatten(orders: unknown): OpenOrder[] {
  if (!Array.isArray(orders)) return [];
  return orders.flatMap((raw) => {
    const o = (raw ?? {}) as Json;
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

async function ours(desk: Desk): Promise<OpenOrder[]> {
  const prefix = runPrefix(desk.runId);
  const response = await quietly(() =>
    desk.trading.get("/v2/orders?status=open&nested=true&limit=500"),
  );
  return flatten(response?.body).filter(
    (o) => desk.ledger.orders.has(o.id) || o.clientOrderId.startsWith(prefix),
  );
}

async function held(desk: Desk): Promise<string[]> {
  const response = await quietly(() => desk.trading.get("/v2/positions"));
  const rows = Array.isArray(response?.body) ? (response.body as Json[]) : [];
  return rows.map((p) => String(p.symbol ?? "")).filter((s) => s.length > 0);
}

/** Cancel, close, then re-read (5 reads, 1s apart) until nothing of this run is open. */
export async function cleanup(desk: Desk): Promise<CleanupReport> {
  for (const order of await ours(desk)) {
    await quietly(() => desk.trading.delete(`/v2/orders/${encodeURIComponent(order.id)}`));
  }
  for (const symbol of await held(desk)) {
    await quietly(() => desk.trading.delete(`/v2/positions/${encodeURIComponent(symbol)}`));
  }
  let stillOpen: string[] = [];
  let positionsLeft: string[] = [];
  for (let read = 0; read < 5; read += 1) {
    stillOpen = (await ours(desk)).map((o) => o.id);
    positionsLeft = await held(desk);
    if (desk.dryRun || (stillOpen.length === 0 && positionsLeft.length === 0)) break;
    await desk.sleep(1000);
  }
  return { stillOpen, positionsLeft };
}
