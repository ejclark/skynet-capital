import { JsonFileStore } from "../storage/json-file-store.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * WHAT HAPPENED TO A MEMBER'S AUTHORED PLAYS, AS A RECORD (#5457 slice 5, #809 slice 6) — the
 * append-only ledger behind the Activity feed's playbook rows. Four things are worth a row:
 *
 *   started   a play entered its shadow test (no orders are placed)
 *   passed    the test met the promotion bar (`promotionVerdict`)
 *   promoted  the author's bot began trading it
 *   paused    its author switched it off (exits keep running)
 *
 * A ledger rather than a read of the live plays, because the feed is history: a play later edited,
 * re-tested or discarded must not rewrite what was announced, and a status can only say where a play
 * is now. Each entry carries its own idempotency `key`, so a second tap, a retried request or a
 * feed read that sees the same pass again cannot post it twice — `record` answers `false` instead.
 *
 * Plain JSON beside the authored plays file: names, tickers and counts, no credentials.
 */
export type PlayMilestoneKind = "started" | "passed" | "promoted" | "paused";

const KINDS: readonly PlayMilestoneKind[] = ["started", "passed", "promoted", "paused"];

export interface PlayMilestone {
  /** The idempotency key: one entry per key, ever. */
  readonly key: string;
  readonly kind: PlayMilestoneKind;
  /** ISO-8601 — when it happened. */
  readonly at: string;
  /** The bot that runs the play — the participant the feed row names. */
  readonly accountId: string;
  /** What the author called the play, as typed. */
  readonly playName: string;
  readonly symbol: string;
  /** Shadow sessions watched when it passed or was promoted. */
  readonly sessions?: number;
}

type LedgerState = readonly PlayMilestone[];

/** Oldest entries fall off past this — the feed only ever shows a page of recent ones. */
const MAX_ENTRIES = 1_000;

const isText = (v: unknown, max = 200): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;

function parseEntry(raw: unknown): PlayMilestone | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const kind = KINDS.find((k) => k === r.kind);
  if (
    !(
      kind &&
      isText(r.key) &&
      isText(r.at, 40) &&
      isText(r.accountId) &&
      isText(r.playName) &&
      isText(r.symbol, 20)
    )
  ) {
    return undefined;
  }
  const sessions = typeof r.sessions === "number" && r.sessions >= 0 ? r.sessions : undefined;
  return {
    key: r.key,
    kind,
    at: r.at,
    accountId: r.accountId,
    playName: r.playName,
    symbol: r.symbol,
    ...(sessions !== undefined ? { sessions } : {}),
  };
}

function parseState(raw: unknown): LedgerState | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.flatMap((entry) => parseEntry(entry) ?? []);
}

export class PlayMilestoneLedger {
  private readonly file: JsonFileStore<LedgerState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseState,
      empty: [],
      label: "play-milestones",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  list(): LedgerState {
    return this.file.load();
  }

  /** Append one entry. `false` — nothing written — when its key is already on the ledger. */
  record(entry: PlayMilestone): boolean {
    const held = this.file.load();
    if (held.some((e) => e.key === entry.key)) return false;
    this.file.write([...held, entry].slice(-MAX_ENTRIES));
    return true;
  }
}

/** The file beside the authored plays file (`authored-play-store.ts`) — a sibling, so no new env
 *  var and no envelope-protected edit. */
export function playMilestonesFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "play-milestones.json",
  );
}

export function createPlayMilestoneLedger(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): PlayMilestoneLedger {
  return new PlayMilestoneLedger(playMilestonesFilePath(env), onReadError);
}
