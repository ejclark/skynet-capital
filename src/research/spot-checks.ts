import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import { createIvHistoryStore } from "./iv-sampler.js";

/**
 * THE SPOT CROSS-CHECK COUNT (#3729). Position guidance checks the stock's last trade against the
 * price its options imply, and a disagreement over 1% is only a WARNING (confidence capped medium):
 * how often the two legitimately disagree was never measured, and a refusal hardened on a guess
 * would blank every call in a fast market. This keeps one line per fresh market read so the tape,
 * not a hunch, decides whether the warning should ever become a refusal.
 *
 * Stored BESIDE the IV history (`<SKYNET_IV_HISTORY_DIR>/spot-checks/`), on purpose: both are
 * option-market observations on the same volume, and a new directory would need its own pinned
 * `fly.toml` line (a protected path) before the first read was counted. It is off whenever the IV
 * clock's store is off, for the same reason: never a count kept on a disk the next deploy erases.
 *
 * No member id is recorded — a line is a symbol, prices and times, never who asked.
 */
export interface SpotCheck {
  readonly at: string;
  readonly symbol: string;
  /** The regular session was open at the read. */
  readonly open: boolean;
  readonly last: number;
  /** How old the last trade was at the read, when the feed gave its time. */
  readonly lastAgeMs?: number;
  readonly parity?: number;
  readonly mid?: number;
  /** What spot was checked against: option prices, IEX's own midpoint, or nothing. */
  readonly basis: "parity" | "mid" | "none";
  /** |last ÷ other − 1| — absent when there was nothing to check against. */
  readonly gap?: number;
  /** Past the tolerance — the read showed the member a warning. */
  readonly flagged: boolean;
}

export interface SpotCheckPort {
  save(check: SpotCheck): Promise<void>;
  list(symbol?: string): Promise<SpotCheck[]>;
}

/** One append-only JSONL file per underlying under `dir` — the IV history's layout. */
export function jsonlSpotChecks(dir: string): SpotCheckPort {
  const store = new JsonlKeyedStore<SpotCheck>(dir, (symbol) =>
    join(dir, `${symbol.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
  );
  return { save: (c) => store.append(c.symbol, c), list: (symbol) => store.list(symbol) };
}

type Env = Readonly<Record<string, string | undefined>>;

/** The count's store, gated exactly as the IV clock's is — or undefined, and the count is off. */
export function createSpotChecks(env: Env): SpotCheckPort | undefined {
  const dir = env.SKYNET_IV_HISTORY_DIR;
  return dir && "store" in createIvHistoryStore(env)
    ? jsonlSpotChecks(join(dir, "spot-checks"))
    : undefined;
}

export interface SpotCheckTally {
  /** Reads that had a second source to check against. */
  readonly checked: number;
  /** Of those, reads that disagreed past the tolerance. */
  readonly flagged: number;
}

export interface SpotCheckSummary {
  readonly reads: number;
  readonly since?: string;
  /** Reads with nothing to check spot against. */
  readonly unchecked: number;
  readonly open: SpotCheckTally;
  readonly closed: SpotCheckTally;
  /** Median and 90th-percentile gap over checked reads, as fractions (0.004 = 0.4%). */
  readonly gapMedian?: number;
  readonly gapP90?: number;
  /** What the count says so far, in a sentence. */
  readonly note: string;
}

/** Below this many checked in-session reads, a share is noise — the note says so instead. */
export const SPOT_CHECK_MIN_READS = 50;

const tally = (checks: readonly SpotCheck[]): SpotCheckTally => {
  const checked = checks.filter((c) => c.basis !== "none");
  return { checked: checked.length, flagged: checked.filter((c) => c.flagged).length };
};

const quantile = (sorted: readonly number[], q: number): number | undefined =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : undefined;

/** The count, reduced. PURE. */
export function summarizeSpotChecks(checks: readonly SpotCheck[]): SpotCheckSummary {
  const open = tally(checks.filter((c) => c.open));
  const closed = tally(checks.filter((c) => !c.open));
  const gaps = checks.flatMap((c) => (c.gap !== undefined ? [c.gap] : [])).sort((a, b) => a - b);
  const since = checks
    .map((c) => c.at)
    .sort()
    .at(0);
  const gapMedian = quantile(gaps, 0.5);
  const gapP90 = quantile(gaps, 0.9);
  const share = open.checked ? Math.round((open.flagged / open.checked) * 100) : 0;
  const note =
    open.checked < SPOT_CHECK_MIN_READS
      ? `${open.checked} checked in-session reads so far — fewer than ${SPOT_CHECK_MIN_READS}, too few to judge; a disagreement stays a warning.`
      : `${share}% of ${open.checked} checked in-session reads disagreed by more than 1%.`;
  return {
    reads: checks.length,
    ...(since ? { since } : {}),
    unchecked: checks.length - open.checked - closed.checked,
    open,
    closed,
    ...(gapMedian !== undefined ? { gapMedian } : {}),
    ...(gapP90 !== undefined ? { gapP90 } : {}),
    note,
  };
}
