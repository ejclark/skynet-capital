import { randomUUID } from "node:crypto";
import { join } from "node:path";

import { JsonlKeyedStore } from "../storage/jsonl-store.js";

/**
 * THE LADDER PROGRESS LOG — the durable, per-participant record of a graduated-
 * ladder milestone being completed. Same shape as `JsonlFeedbackLogStore` (`feedback-log.ts`): one
 * append-only JSONL file per key under `dir`, backed by the shared `JsonlKeyedStore` primitives —
 * a write is cheap and crash-safe, and the log is immutable.
 *
 * **This slice is the store only.** It records and reads back completions; nothing in this repo
 * writes to it yet. Slice 3 (auto-completion from account activity — first buy/sell/CSP/CC, an
 * OTM expiry, a first realized profit) is the writer; slice 4 (the ticket gate + ceremony +
 * `/learn` links) is the reader. Keeping the store's own PR ahead of both means each of those
 * lands against a durable primitive that already exists, instead of inventing one under time
 * pressure — the "sequence the process ahead of the work it improves" corollary.
 *
 * **Never the trade ladder's fill-only invariant, restated for a different shape.** The 100/200
 * level `TradeTypeCode` milestones (`src/domain/progression.ts`) stay exactly as they are: derived
 * fresh from the fill + audit ledgers on every read, with no stored "earned" record at all — that
 * is deliberate (a fill is self-verifying evidence; storing a duplicate verdict would only invite
 * the two to drift). This log exists for the milestones ruling 16's fills alone cannot prove: an
 * OTM expiry or a first realized profit needs short-lot matching over the activity history
 * (`curriculum.ts`'s note on #468) to detect at all, so once a detector *has* done that work, the
 * completion needs somewhere durable to land rather than being recomputed — and re-proven bit for
 * bit — on every single read. The row this store keeps IS the evidence for those; it is never a
 * self-marked checkbox, because nothing in this repo writes one until a slice-3 detector says so.
 *
 * **Earned truth, so it belongs on the mounted volume — unlike the community track's claim-state
 * exception** (`community-progression-store.ts`, recorded `EPHEMERAL` in
 * `tests/arch/volume-persistence.spec.ts` because it holds only which celebrations were already
 * claimed, never the earn itself). A row here IS the earn — losing it on a deploy would silently
 * un-graduate a member, which is a false negative, not a repeat banner. `fly.toml` is
 * envelope-protected (`envelope.json`: "hosting config — spend and deploy topology"), so pinning
 * `SKYNET_LADDER_PROGRESS_DIR` there is staged as its own line in this PR rather than deferred —
 * but per CLAUDE.md's protected-file discipline, that line is Eric's one click, never auto-merged.
 */

/** What a ladder milestone was completed IN, and by what — the detector, not a client claim. */
export type LadderProgressEvidence =
  | { readonly kind: "fill"; readonly orderId: string }
  | { readonly kind: "otm-expiry"; readonly orderId: string }
  | { readonly kind: "realized-profit"; readonly orderId: string };

export interface LadderProgressEntry {
  /** This log entry's own identity — distinct from `milestoneId`, since a detector re-running
   *  must be able to tell "already logged" from "a fresh row" without trusting its own idempotency. */
  readonly uuid: string;
  /** The roster participant id — same identity space `progression-store.ts` keys on. */
  readonly participantId: string;
  /** A `curriculum.ts` milestone id (e.g. `"first-buy"`) — never validated here; the log is a
   *  dumb ledger, exactly as `feedback-log.ts` doesn't validate `kind`/`title` against a catalog. */
  readonly milestoneId: string;
  readonly evidence: LadderProgressEvidence;
  /** When the completion happened (the evidence's own timestamp), not when it was logged. */
  readonly at: string;
}

/** Where the ladder progress log is kept. Interface-first (like `FeedbackLogStore`) so callers and
 *  tests stay I/O-free. */
export interface LadderProgressLogStore {
  record(entry: LadderProgressEntry): Promise<void>;
  /** All entries (order not guaranteed); one participant's when given. */
  list(participantId?: string): Promise<readonly LadderProgressEntry[]>;
}

/** File-backed store: one append-only JSONL file per participant under `dir` (on the mounted
 *  volume in prod — set `SKYNET_LADDER_PROGRESS_DIR=/data/ladder-progress` — so a completion
 *  survives redeploys exactly as a fill or a filed issue does). */
export class JsonlLadderProgressLogStore implements LadderProgressLogStore {
  private readonly store: JsonlKeyedStore<LadderProgressEntry>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<LadderProgressEntry>(dir, (participantId) =>
      join(dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  record(entry: LadderProgressEntry): Promise<void> {
    return this.store.append(entry.participantId, entry);
  }

  list(participantId?: string): Promise<readonly LadderProgressEntry[]> {
    return this.store.list(participantId);
  }
}

/** Build the store from the environment (`SKYNET_LADDER_PROGRESS_DIR`, default
 *  `data/ladder-progress`). */
export function createLadderProgressLogStore(env: NodeJS.ProcessEnv): LadderProgressLogStore {
  return new JsonlLadderProgressLogStore(env.SKYNET_LADDER_PROGRESS_DIR ?? "data/ladder-progress");
}

/** One detected completion → one log entry, minting its own identity. */
export function ladderProgressEntry(
  participantId: string,
  milestoneId: string,
  evidence: LadderProgressEvidence,
  at: string,
): LadderProgressEntry {
  return { uuid: randomUUID(), participantId, milestoneId, evidence, at };
}

/**
 * Fold a participant's log into one row per milestone — the EARLIEST logged completion wins,
 * exactly as `deriveEarned` (`domain/progression.ts`) keeps the earliest qualifying fill. A
 * detector that (re-)logs the same milestone twice — a retry, a re-run over overlapping history —
 * never regresses or duplicates the read: this is read-side idempotency, so the store itself never
 * has to enforce write-time uniqueness to stay honest.
 */
export function earliestPerMilestone(
  entries: readonly LadderProgressEntry[],
): ReadonlyMap<string, LadderProgressEntry> {
  const byMilestone = new Map<string, LadderProgressEntry>();
  for (const entry of entries) {
    const held = byMilestone.get(entry.milestoneId);
    if (!held || entry.at < held.at) byMilestone.set(entry.milestoneId, entry);
  }
  return byMilestone;
}
