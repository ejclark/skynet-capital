import type { DeskOrderEvent } from "../live/desk-events";
import type { DeskOrderRow } from "../live/orders";
import type { SentLockInClose } from "./lock-in-ceremony";
import { type LockedIn, lockedIn } from "./locked-in";

/**
 * A LOCKED-IN PROFIT THAT FILLS LATE (#7383 slice 2). The two close paths (the row's Close and the
 * guidance ticket's Place) listen for their own order's fill only while they are mounted. A limit
 * close that rests past the moment the member leaves the page fills to nobody, so the celebration
 * #4609 built never came. This is the memory that closes that gap:
 *
 *  - **At send**, a close that carries a lock-in flag is remembered in this browser with its order
 *    id (`rememberLockIn`). The flag is the Consider mark AS IT WAS SENT — the same object the live
 *    path carries — never re-read at the fill (the row may be gone by then).
 *  - **Working orders** reads it beside the order list: a remembered close that settled filled at a
 *    gain gets one plain line under its "Settled today" row — "Locked in $X on …", the words the
 *    row's receipt uses (`lockInOfRow`). That is the gap #3977 slice 3 banked: say it plainly first.
 *  - **On the next Profile → Overview load** (`LateLockIns` in `lock-in-late.tsx`, mounted there), the same
 *    answer goes to the one celebration host (`celebrateLockIn`), which shows each order id once and
 *    never one already seen (`skynet.lockin.seen.<id>`) — so a close the live path already
 *    celebrated is not replayed.
 *
 * WHO MAY SEE IT. Only the member's own sends are remembered (this browser wrote them at Place), and
 * the fill is read through the account's own order list (`/api/trade/orders`, the member's linked
 * broker account), so nothing here can surface an order the viewer could not already see.
 *
 * HONEST. The fill is the broker's record — `filledQuantity` and `avgFillPrice` — run through the
 * same `lockedIn` the live path uses: a loss, an unflagged close, a partial still working, or an
 * order cancelled, rejected or expired recognizes nothing. Memory is pruned by age, so a close that
 * left the 24-hour "recent" list unseen is dropped rather than guessed at.
 */

/** One remembered close: what the live path's `SentLockInClose` carries, and when it was sent. */
export interface RememberedClose extends SentLockInClose {
  readonly sentAt: string;
}

const pendingKey = (deskId: string) => `skynet.lockin.pending.${deskId}`;

/** Past this, a remembered close is dropped: the order list's "recent" window is 24 hours
 *  (`src/server/desk-orders-view.ts` → `RECENT_WINDOW_MS`), and a resting GTC close that is still
 *  working after a week is rare enough to give up on rather than keep forever. */
export const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;
/** A ceiling on how many closes one account keeps, newest kept. */
const MAX_REMEMBERED = 50;

function read(deskId: string): RememberedClose[] {
  try {
    const raw = window.localStorage.getItem(pendingKey(deskId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RememberedClose[]).filter(wellFormed) : [];
  } catch {
    return [];
  }
}

function write(deskId: string, closes: readonly RememberedClose[]): void {
  try {
    if (closes.length === 0) window.localStorage.removeItem(pendingKey(deskId));
    else window.localStorage.setItem(pendingKey(deskId), JSON.stringify(closes));
  } catch {
    // Blocked storage: a late fill goes uncelebrated, the forgiving failure (the live path stands).
  }
}

const wellFormed = (c: RememberedClose): boolean =>
  typeof c?.orderId === "string" &&
  typeof c.symbol === "string" &&
  typeof c.sentAt === "string" &&
  (c.side === "buy" || c.side === "sell") &&
  typeof c.count === "number" &&
  c.lockIn !== undefined;

const fresh = (c: RememberedClose, now: number): boolean => {
  const at = Date.parse(c.sentAt);
  return Number.isFinite(at) && now - at < REMEMBER_MS;
};

/** The closes remembered for one account, oldest pruned. */
export function rememberedCloses(deskId: string, now = Date.now()): RememberedClose[] {
  return deskId === "" ? [] : read(deskId).filter((c) => fresh(c, now));
}

/** Remember a flagged close at send. A close with no flag is not a lock-in and is not kept. */
export function rememberLockIn(deskId: string, sent: SentLockInClose, now = new Date()): void {
  if (deskId === "" || !sent.lockIn) return;
  const kept = rememberedCloses(deskId, now.getTime()).filter((c) => c.orderId !== sent.orderId);
  write(deskId, [...kept, { ...sent, sentAt: now.toISOString() }].slice(-MAX_REMEMBERED));
}

/** Forget closes that can never become a lock-in: ended unfilled, or past the age limit. */
export function prune(deskId: string, ended: ReadonlySet<string>, now: number): void {
  const all = read(deskId);
  const kept = all.filter((c) => fresh(c, now) && !ended.has(c.orderId));
  if (kept.length !== all.length) write(deskId, kept);
}

/** The broker's record of a settled order, in the shape the live stream hands `lockedIn`. */
function asFill(row: DeskOrderRow): DeskOrderEvent | undefined {
  if (row.state !== "filled" || row.avgFillPrice === undefined) return undefined;
  return {
    id: `order-list:${row.id}`,
    eventType: "order.filled",
    orderId: row.id,
    at: row.settledAt ?? row.submittedAt ?? "",
    outcome: "success",
    payload: {
      status: "filled",
      price: row.avgFillPrice,
      ...(row.filledQuantity > 0 ? { filledQuantity: row.filledQuantity } : {}),
    },
  };
}

/** What a remembered close locked in, read off its settled order row; undefined for anything else. */
export function lockInOfRow(
  remembered: readonly RememberedClose[],
  row: DeskOrderRow,
): LockedIn | undefined {
  const sent = remembered.find((c) => c.orderId === row.id);
  return sent ? lockedIn(sent, asFill(row)) : undefined;
}
