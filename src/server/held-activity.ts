import type { ActivityStore, TradeActivityRecord } from "../observatory/activity-record.js";
import { foldLatestPerOrder } from "../observatory/activity-store.js";
import {
  NO_ORIGIN_EVIDENCE,
  type OrderOriginIndex,
  orderOriginIndex,
} from "../observatory/order-origin.js";
import type { OrderAuditLog, OrderAuditRecord } from "./order-audit-log.js";
import { serialPerKey } from "./per-key-queue.js";

/**
 * A PARTICIPANT'S TRADE LEDGER AND ORDER AUDIT, KEPT UP TO DATE BY WHAT WAS APPENDED
 * (#4612 slice 7, #4619).
 *
 * Activity, Thesis, the Playbooks stats and the ladder detector each listed a participant's whole
 * trade ledger on every request, then began by folding it to the latest line per order. Activity
 * also listed the whole order audit to learn which order ids our own ticket placed. Both files are
 * append-only, so the answer is a function of what was appended: the first read folds the whole
 * file once; every later read asks the store for the lines since the held byte offset (an `fstat`
 * when nothing was) and folds only those.
 *
 * What the ledger fold holds is the same one-line-per-order state `collapseActivity` builds, through
 * the same `foldLatestPerOrder`, handed back in the fold's own insertion order. Every consumer opens
 * with `collapseActivity` (or `deskLedger`, which does), and collapsing an already-collapsed list in
 * that order rebuilds the same map — so a request sees exactly what a whole read would have given
 * it, ties included. A spec folds seeded ledgers in steps and compares each with the whole read.
 *
 * The audit fold holds only what `orderOriginIndex` derives: the set of order ids and the earliest
 * line. A bot's desk never reads the audit at all — `orderOriginIndex` gives it no evidence whatever
 * the log holds.
 *
 * Either file replaced (shorter than where the fold stopped) → the fold starts over from byte 0. A
 * store with no `since` (the in-memory ones offline mode and the specs run) is read whole on every
 * call and nothing is held; its ledgers are small by construction. One reader per store, so the
 * dashboard's routes and the ladder detector share one fold of each ledger.
 */
export type HeldActivityReader = (participantId: string) => Promise<readonly TradeActivityRecord[]>;

interface LedgerFold {
  readonly byOrder: Map<string, TradeActivityRecord>;
  offset: number;
  answer: readonly TradeActivityRecord[] | undefined;
}

const ledgers = new WeakMap<ActivityStore, HeldActivityReader>();

export function heldActivity(store: ActivityStore): HeldActivityReader {
  const memo = ledgers.get(store);
  if (memo) return memo;
  const reader = ledgerReader(store);
  ledgers.set(store, reader);
  return reader;
}

function ledgerReader(store: ActivityStore): HeldActivityReader {
  const since = store.since?.bind(store);
  if (!since) return async (participantId) => store.list(participantId);
  const folds = new Map<string, LedgerFold>();

  const refresh = async (participantId: string): Promise<readonly TradeActivityRecord[]> => {
    const prior = folds.get(participantId);
    let tail = await since(participantId, prior?.offset ?? 0);
    let fold = prior;
    if (!fold || tail.reset) {
      if (tail.reset) tail = await since(participantId, 0);
      fold = { byOrder: new Map(), offset: 0, answer: undefined };
      folds.set(participantId, fold);
    }
    if (tail.entries.length > 0) {
      foldLatestPerOrder(fold.byOrder, tail.entries);
      fold.answer = undefined;
    }
    fold.offset = tail.offset;
    fold.answer ??= [...fold.byOrder.values()];
    return fold.answer;
  };

  return serialPerKey(refresh);
}

/** One account's order-origin evidence (`order-origin.ts`), by participant id and kind. */
export type HeldOriginReader = (
  participantId: string,
  kind: "human" | "bot",
) => Promise<OrderOriginIndex>;

interface AuditFold {
  readonly orderIds: Set<string>;
  coverageFrom: string | undefined;
  offset: number;
  answer: OrderOriginIndex | undefined;
}

const audits = new WeakMap<OrderAuditLog, HeldOriginReader>();

export function heldOrderOrigins(log: OrderAuditLog): HeldOriginReader {
  const memo = audits.get(log);
  if (memo) return memo;
  const reader = originReader(log);
  audits.set(log, reader);
  return reader;
}

function originReader(log: OrderAuditLog): HeldOriginReader {
  const since = log.since?.bind(log);
  if (!since) {
    return async (participantId, kind) =>
      kind === "bot" ? NO_ORIGIN_EVIDENCE : orderOriginIndex(await log.list(participantId), kind);
  }
  const folds = new Map<string, AuditFold>();

  const refresh = async (participantId: string): Promise<OrderOriginIndex> => {
    const prior = folds.get(participantId);
    let tail = await since(participantId, prior?.offset ?? 0);
    let fold = prior;
    if (!fold || tail.reset) {
      if (tail.reset) tail = await since(participantId, 0);
      fold = { orderIds: new Set(), coverageFrom: undefined, offset: 0, answer: undefined };
      folds.set(participantId, fold);
    }
    if (tail.entries.length > 0) {
      addLines(fold, tail.entries);
      fold.answer = undefined;
    }
    fold.offset = tail.offset;
    // A copy, so a later advance never mutates the set a request is still reading.
    fold.answer ??=
      fold.orderIds.size === 0
        ? NO_ORIGIN_EVIDENCE
        : { deskOrderIds: new Set(fold.orderIds), coverageFrom: fold.coverageFrom };
    return fold.answer;
  };

  const held = serialPerKey(refresh);
  return (participantId, kind) =>
    kind === "bot" ? Promise.resolve(NO_ORIGIN_EVIDENCE) : held(participantId);
}

function addLines(fold: AuditFold, lines: readonly OrderAuditRecord[]): void {
  for (const line of lines) {
    fold.orderIds.add(line.orderId);
    if (fold.coverageFrom === undefined || line.at < fold.coverageFrom) {
      fold.coverageFrom = line.at;
    }
  }
}
