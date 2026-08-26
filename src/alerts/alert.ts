/**
 * THE ALERT — one typed signal, from any producer, to whoever asked for it.
 *
 * Bloomberg's ALRT is a single alerting primitive every signal module plugs into: news sentiment,
 * price triggers and the earnings calendar all publish the same shape, and each consumer says
 * which slice it wants. This repo had the opposite — `decision-record.ts` records bot decisions
 * for its own panel, `milestone-banner.ts` fires its own one-shot celebration, and neither is
 * reachable by a different producer. This module is the shared vocabulary those producers publish
 * in, so a new signal source needs no new plumbing and no new display.
 *
 * Pure by construction: types plus total functions over them. No clock, no I/O, no randomness —
 * producers stamp `at` themselves, which is what makes every consumer deterministic in specs.
 *
 * Honesty note: an alert is a *signal*, never a claim about a fill or a P/L number. `symbol`
 * carries a real ticker when the alert is about one and is simply absent when it is not — a
 * consumer must render that absence as ABSENT, never as a blank or zeroed instrument.
 */

/**
 * How loudly an alert asks to be seen. Three rungs, deliberately: a scale with more rungs is a
 * scale producers disagree about, and a consumer's filter gets vague.
 *
 * - `critical` — act now or lose the chance (a stop breached, a halt, assignment risk).
 * - `warning`  — worth a look this session (an unusual-flow print, a downgrade).
 * - `info`     — ambient context (an earnings date confirmed, a bot opened a position).
 */
export type AlertPriority = "critical" | "warning" | "info";

/** Loudest first. Lower rank = louder, so ordinal comparisons read the way the words do. */
const PRIORITY_RANK: Record<AlertPriority, number> = { critical: 0, warning: 1, info: 2 };

/** Where a priority sits on the ladder: 0 is the loudest. Total — every priority has a rank. */
export function priorityRank(priority: AlertPriority): number {
  return PRIORITY_RANK[priority];
}

/** One published signal. Producers own `id`/`at`; everything else is what a consumer reads. */
export interface Alert {
  /** Producer-unique identity for this emission. Two re-emissions of the same condition get
   *  different ids — sameness for dismissal purposes is `dedupeKey`, not this. */
  readonly id: string;
  /** Epoch ms the producer observed the condition. Injected, never read from a clock in here. */
  readonly at: number;
  /** Who published it — a stable producer id such as `news-sentiment`, `price`, `calendar`. */
  readonly source: string;
  readonly priority: AlertPriority;
  /** One line, already human-readable. Consumers may truncate; they must not have to parse it. */
  readonly title: string;
  /** The real ticker this is about, when it is about one. Absent = not symbol-scoped. */
  readonly symbol?: string;
  /** Optional detail. A consumer that shows only titles must still be correct without it. */
  readonly body?: string;
  /** The producer's own structured payload, opaque to the substrate. */
  readonly data?: Readonly<Record<string, unknown>>;
  /** What "the same alert again" means for THIS producer — e.g. `nvda-stop-breached`. Defaults
   *  to `title`, which is right whenever the title is stable across re-emissions. */
  readonly dedupeKey?: string;
}

/**
 * A consumer's standing interest. Every clause that is present must match; an absent clause
 * constrains nothing — so `{}` is "everything", and that is the only way to get the firehose.
 */
export interface AlertFilter {
  /** Keep alerts at least this loud (`warning` keeps warning and critical). */
  readonly minPriority?: AlertPriority;
  /** Keep alerts from these producers only. */
  readonly sources?: readonly string[];
  /** Keep alerts about these tickers only. Symbol-less alerts never match this clause. */
  readonly symbols?: readonly string[];
}

/** Does this alert belong to that standing interest? An absent filter matches everything. */
export function matchesFilter(alert: Alert, filter?: AlertFilter): boolean {
  if (!filter) return true;
  if (filter.minPriority && priorityRank(alert.priority) > priorityRank(filter.minPriority)) {
    return false;
  }
  if (filter.sources && !filter.sources.includes(alert.source)) return false;
  if (filter.symbols && !(alert.symbol && filter.symbols.includes(alert.symbol))) return false;
  return true;
}

/**
 * The dismissal identity — what "the same alert, again" means across reloads.
 *
 * Deliberately NOT `id`: a producer that re-derives its signals on every poll mints a fresh id
 * each time, and keying dismissal on it would re-show what the member just waved away. It is
 * `source · priority · symbol · dedupeKey` instead, and **priority is inside the key on purpose**:
 * a condition that escalates from `info` to `critical` is genuinely new news and has earned the
 * right to be seen again, even though the member dismissed the quiet version of it.
 *
 * JSON-encoded rather than delimiter-joined, so no title containing the delimiter can forge the
 * fingerprint of a different alert.
 */
export function alertFingerprint(alert: Alert): string {
  return JSON.stringify([
    alert.source,
    alert.priority,
    alert.symbol ?? null,
    alert.dedupeKey ?? alert.title,
  ]);
}

/**
 * Loudest first, then newest first, then by id so the order is total and stable — a consumer
 * re-rendering the same set must never see rows swap places for no reason.
 */
export function sortAlerts(alerts: readonly Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      b.at - a.at ||
      a.id.localeCompare(b.id),
  );
}
