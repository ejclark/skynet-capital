import type { OrderAuditRecord } from "../server/order-audit-log.js";

/**
 * WHO PLACED THIS ORDER — the classification `ActivitySource` deliberately does not answer.
 *
 * `source` (`activity-record.ts`) says how the ledger LEARNED about a row: `stream` live off the
 * trade-updates socket, `backfill`/`broker` recovered afterwards. That is provenance of knowledge,
 * not of authorship — an order the app's own ticket submitted still lands as `broker` when the
 * socket missed it and the reconcile picked it up. So `source === "broker"` is a plausible but
 * wrong-sometimes proxy for "placed directly in Alpaca".
 *
 * The exact signal is the per-order audit log (`server/order-audit-log.ts`), written SYNCHRONOUSLY
 * by the desk seam (`desk-gate.ts`'s `submitAndAudit`) the moment the broker accepts, keyed on the
 * broker's own order id. An id in that log went through our submit path, full stop.
 *
 * Absence, though, is not proof — three gaps, and each one resolves to `unknown` rather than a
 * marker that is sometimes wrong (the issue's own third acceptance criterion):
 *
 *  1. **Bot accounts.** A persona's autonomous orders reach Alpaca through
 *     `AlpacaBrokerAdapter.submit`, which writes no audit line. Absence means nothing there, so a
 *     bot desk is never classified.
 *  2. **Before coverage.** The log has a start date per account. An order older than the earliest
 *     line we hold predates the evidence and cannot be told apart from an app-submitted one.
 *  3. **No coverage at all.** An account with no audit lines gives no anchor — an unmounted volume
 *     and a member who has never used the ticket look identical from here.
 *
 * Once a member places one order through the app, coverage opens and every later Alpaca-direct
 * order on that account is marked exactly. Everything outside that window renders as it does today.
 */

/** Who placed an order, as far as the evidence honestly reaches. */
export type OrderOrigin =
  /** Submitted through this app's own ticket — an audit line carries its order id. */
  | "desk"
  /** Placed straight in Alpaca: inside the audited window, yet never seen by our submit path. */
  | "alpaca-direct"
  /** Not determinable — a bot desk, or an order outside the audit log's coverage. */
  | "unknown";

/** The evidence one account's orders are classified against. Build it once per desk read. */
export interface OrderOriginIndex {
  /** Order ids our own submit path recorded. */
  readonly deskOrderIds: ReadonlySet<string>;
  /** ISO timestamp of the earliest audit line held; undefined = no coverage, classify nothing. */
  readonly coverageFrom: string | undefined;
}

/** No evidence at all — every order classifies `unknown`. The shape a desk with no audit log gets. */
export const NO_ORIGIN_EVIDENCE: OrderOriginIndex = {
  deskOrderIds: new Set<string>(),
  coverageFrom: undefined,
};

/**
 * Index one account's audit lines. A bot's desk gets `NO_ORIGIN_EVIDENCE` regardless of what the
 * log holds: the engine bypasses the audited path, so absence there can never mean Alpaca-direct.
 */
export function orderOriginIndex(
  audit: readonly OrderAuditRecord[] | undefined,
  participantKind: "human" | "bot",
): OrderOriginIndex {
  if (participantKind === "bot" || !audit || audit.length === 0) return NO_ORIGIN_EVIDENCE;
  const deskOrderIds = new Set<string>();
  let coverageFrom: string | undefined;
  for (const line of audit) {
    deskOrderIds.add(line.orderId);
    if (coverageFrom === undefined || line.at < coverageFrom) coverageFrom = line.at;
  }
  return { deskOrderIds, coverageFrom };
}

/**
 * Classify one order. An audited id is `desk` no matter when it landed — the audit line is written
 * a beat after the order's own `submitted_at`, so the id match must outrank the coverage window or
 * an account's very first desk order would misread as pre-coverage. A row with no order id can't
 * be joined at all (broker-window rows predating id capture), so it stays `unknown`.
 */
export function orderOrigin(
  order: { readonly orderId?: string; readonly at: string },
  index: OrderOriginIndex,
): OrderOrigin {
  if (order.orderId !== undefined && index.deskOrderIds.has(order.orderId)) return "desk";
  if (order.orderId === undefined) return "unknown";
  if (index.coverageFrom === undefined || order.at < index.coverageFrom) return "unknown";
  return "alpaca-direct";
}
