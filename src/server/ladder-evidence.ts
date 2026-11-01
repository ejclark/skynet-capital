import {
  deriveEarned,
  type EarnedMilestone,
  type LadderFill,
  type LadderTag,
} from "../domain/progression.js";
import type { ActivityStore } from "../observatory/activity-record.js";
import { foldLatestPerOrder, newestFirst } from "../observatory/activity-store.js";
import type { OrderAuditLog } from "./order-audit-log.js";

/**
 * WHAT THE LADDER READS FROM A PARTICIPANT'S TWO LEDGERS, KEPT UP TO DATE BY WHAT WAS APPENDED
 * (#4612 slice 7, #4619).
 *
 * `progression-service.ts` used to list a participant's whole trade ledger AND whole order audit on
 * every view (the Learn page, each desk's lock check) and again on a course acknowledge, only to
 * learn which rungs the fills prove. A rung is earned once and the evidence only ever grows, so the
 * answer is a function of two append-only files. This keeps the fold of them per participant: the
 * first read folds both whole files once; every later read asks each store for the lines appended
 * since (`since` from the held byte offset — an `fstat` when nothing was) and folds only those.
 *
 * What is held is one slim row per ORDER (not per line) plus one tag per order — the same
 * collapse `collapseActivity` does, through the same `foldLatestPerOrder` and `newestFirst`, so the
 * milestones come out of `deriveEarned` exactly as a whole read would give them, including which
 * fill is the evidence when two share a timestamp. A spec folds seeded ledgers in several steps and
 * compares each step with the whole read.
 *
 * Either file replaced (shorter than where the fold stopped) → the fold starts over from byte 0.
 * A store with no `since` (the in-memory ones offline mode and the specs run) is read whole on
 * every call and nothing is held; its ledgers are small by construction. Reads for one participant
 * run one at a time: two views landing together would otherwise fold the same lines twice, and a
 * tag seen out of order would regress a later one.
 *
 * Evidence stays ours, never the broker's (`tests/arch/progression-evidence.spec.ts`): both reads
 * are our own append-only journal and order audit.
 */
export interface LadderEvidence {
  readonly earned: readonly EarnedMilestone[];
  /** Any fill with a positive quantity — what tells an existing member from a brand-new one. */
  readonly hasFill: boolean;
}

export type LadderEvidenceReader = (participantId: string) => Promise<LadderEvidence>;

/** The order-audit columns the ladder reads, from a line carrying more. */
interface AuditLine {
  readonly orderId: string;
  readonly code?: LadderTag["code"];
  readonly intent?: LadderTag["intent"];
}

class LadderFold {
  private readonly orders = new Map<string, LadderFill>();
  private readonly tags = new Map<string, LadderTag>();
  private filled = false;
  private answer: LadderEvidence | undefined;

  addFills(lines: readonly LadderFill[]): void {
    if (lines.length === 0) return;
    const slim = lines.map((l) => ({
      orderId: l.orderId,
      symbol: l.symbol,
      side: l.side,
      filledQuantity: l.filledQuantity,
      at: l.at,
    }));
    foldLatestPerOrder(this.orders, slim);
    this.filled ||= slim.some((l) => l.filledQuantity > 0);
    this.answer = undefined;
  }

  addTags(lines: readonly AuditLine[]): void {
    if (lines.length === 0) return;
    // A later line for an order replaces an earlier one — a cancel after an open ends the tag.
    for (const l of lines) {
      this.tags.set(l.orderId, {
        orderId: l.orderId,
        ...(l.code ? { code: l.code } : {}),
        ...(l.intent ? { intent: l.intent } : {}),
      });
    }
    this.answer = undefined;
  }

  evidence(): LadderEvidence {
    this.answer ??= {
      earned: deriveEarned(newestFirst(this.orders), [...this.tags.values()]),
      hasFill: this.filled,
    };
    return this.answer;
  }
}

/** The evidence of two whole ledgers, folded in one go — what a store with no `since` reads, and
 *  what a spec with fixed ledgers hands the service. */
export function ladderEvidenceFrom(
  fills: readonly LadderFill[],
  tags: readonly AuditLine[],
): LadderEvidence {
  const fold = new LadderFold();
  fold.addFills(fills);
  fold.addTags(tags);
  return fold.evidence();
}

type FillsSince = NonNullable<ActivityStore["since"]>;
type TagsSince = NonNullable<OrderAuditLog["since"]>;

export function ladderEvidenceReader(stores: {
  readonly activity: ActivityStore;
  readonly orderAudit: OrderAuditLog;
}): LadderEvidenceReader {
  const { activity, orderAudit } = stores;
  const since = activity.since?.bind(activity);
  const sinceTags = orderAudit.since?.bind(orderAudit);
  if (!(since && sinceTags)) {
    return async (participantId) =>
      ladderEvidenceFrom(await activity.list(participantId), await orderAudit.list(participantId));
  }
  return heldReader(since, sinceTags);
}

function heldReader(since: FillsSince, sinceTags: TagsSince): LadderEvidenceReader {
  const folds = new Map<string, { fold: LadderFold; fillsAt: number; tagsAt: number }>();
  const queue = new Map<string, Promise<LadderEvidence>>();

  async function rebuild(participantId: string): Promise<LadderEvidence> {
    const [fills, tags] = await Promise.all([since(participantId, 0), sinceTags(participantId, 0)]);
    const fold = new LadderFold();
    fold.addFills(fills.entries);
    fold.addTags(tags.entries);
    folds.set(participantId, { fold, fillsAt: fills.offset, tagsAt: tags.offset });
    return fold.evidence();
  }

  async function refresh(participantId: string): Promise<LadderEvidence> {
    const held = folds.get(participantId);
    if (!held) return rebuild(participantId);
    const [fills, tags] = await Promise.all([
      since(participantId, held.fillsAt),
      sinceTags(participantId, held.tagsAt),
    ]);
    if (fills.reset || tags.reset) return rebuild(participantId);
    held.fold.addFills(fills.entries);
    held.fold.addTags(tags.entries);
    held.fillsAt = fills.offset;
    held.tagsAt = tags.offset;
    return held.fold.evidence();
  }

  return (participantId) => {
    const prior = queue.get(participantId) ?? Promise.resolve(undefined);
    const next = prior.catch(() => undefined).then(() => refresh(participantId));
    queue.set(participantId, next);
    const settle = (): void => {
      if (queue.get(participantId) === next) queue.delete(participantId);
    };
    next.then(settle, settle);
    return next;
  };
}
