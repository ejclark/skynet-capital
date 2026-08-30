/**
 * The TACO signal — the event detector the "TACO Trades" playbook needs before it can
 * exist. Every playbook in `src/playbooks/registry.ts` is DATE-keyed: `desiredState` answers
 * from an earnings calendar. TACO is EVENT-keyed — it reacts to a Trump-linked pump story, which
 * the calendar cannot express. This module supplies the missing half: given the newswire this
 * app already polls, when did a qualifying event fire, and is it still fresh enough to act on?
 *
 * WHY THIS SHIPS ALONE, WIRED TO NOTHING. The issue's own third acceptance criterion gates the
 * playbook behind its signal source ("this issue is not 'ship a symbol always long'"), and the
 * playbook definition itself lives on an envelope-protected path. So this is the detector, pure
 * and unregistered: no persona consumes it, no order intent is produced, nothing trades on it.
 *
 * WHAT IT ACTUALLY DETECTS — stated narrowly, because the play's name is a claim and the code
 * must not make one. A signal means: a newswire article tagged with a watchlisted ticker, whose
 * text names Trump, scored positive by the house sentiment lexicon. That is an observation. The
 * thesis that such stories revert ("pump and dump... no substance behind the fluff talk") is
 * Eric's hypothesis and carries NO research citation yet — every playbook in the registry has an
 * `evidence:` line into `docs/research/`, and TACO has nothing to put there. Until it does, the
 * timing constants below are unvalidated defaults, not measured edges.
 *
 * COVERAGE, HONESTLY (the issue's first open question). Eric named two event types: (1) Trump's
 * own social posts, (2) news/media coverage of them. Alpaca's `/v1beta1/news` is a NEWSWIRE —
 * headline, summary, symbols. It carries (2) and does not carry (1). Direct social ingestion
 * would be a new outbound integration and is deliberately out of scope here.
 */
import type { NewsArticle } from "./alpaca-news-client.js";
import { scoreSentiment } from "./sentiment-scorer.js";

/**
 * Who counts as "Trump-adjacent" is a maintained list, never inferred from an article's text.
 * Inferring it would have the app assert a business relationship it cannot verify — the honesty
 * stop outranks the convenience. DJT is Trump Media & Technology Group, whose majority ownership
 * is a matter of public SEC record; it is the only name that clears that bar unaided, so it is
 * the only default. Widen it deliberately via `SKYNET_TACO_WATCHLIST`, not by guessing here.
 */
export const TACO_DEFAULT_WATCHLIST: readonly string[] = ["DJT"];

/**
 * Timing, per Eric's 0DTE note: "immediate action to enter position, and quick to exit before
 * the collapse. Waiting too long to enter risks entering at the peak." These are UNVALIDATED
 * defaults chosen to encode that shape (decisive on both ends), not measured from any tape. A
 * backtest against recorded events is what would earn them an `evidence:` line.
 */
export const TACO_TIMING = {
  /** Past this age, the move is assumed already made — entering late is buying the peak. */
  entryMinutes: 15,
  /** Total life of the position from the event; after it, the play converges to flat. */
  holdMinutes: 90,
} as const;

/**
 * Below this, the story is not a pump — a negative Trump story is a different event entirely.
 * 0.5 on the lexicon's [-1, 1] scale is a 3:1 positive-to-negative word balance: a headline that
 * merely leans positive does not qualify.
 */
const PUMP_SENTIMENT_FLOOR = 0.5;

/** Matches "Trump"/"Trump's" as a word; deliberately not "trumped" or "trumpet". */
const TRUMP_MENTION = /\btrump(?:'s)?\b/i;

/** A detected event: what fired, for which symbol, when, and how strongly. */
export interface TacoSignal {
  readonly symbol: string;
  /** The article's own timestamp — the clock the entry window runs against, not our poll time. */
  readonly detectedAt: string;
  /** The sentiment score that qualified it, in (0, 1]. Carried so sizing can weight it later. */
  readonly strength: number;
  /** Kept for attribution — a trade explained by "a signal fired" explains nothing. */
  readonly headline: string;
}

/** Where a signal sits in its lifecycle at a given moment. */
export type TacoWindow = "enter" | "hold" | "expired";

/**
 * Detect every qualifying event in one article — one per watchlisted symbol it is tagged with.
 * Pure: same article, same watchlist, same result. An article with no usable timestamp yields
 * nothing, because a signal that cannot be aged cannot honour the entry window.
 */
export function detectTacoSignals(
  article: NewsArticle,
  watchlist: readonly string[] = TACO_DEFAULT_WATCHLIST,
): TacoSignal[] {
  const at = Date.parse(article.createdAt);
  if (!Number.isFinite(at)) {
    return [];
  }
  const text = `${article.headline} ${article.summary}`;
  if (!TRUMP_MENTION.test(text)) {
    return [];
  }
  const strength = scoreSentiment(text);
  if (strength < PUMP_SENTIMENT_FLOOR) {
    return [];
  }
  const watched = new Set(watchlist);
  // De-duplicated: a wire article that lists a ticker twice must not yield two events.
  return [...new Set(article.symbols)]
    .filter((symbol) => watched.has(symbol))
    .map((symbol) => ({
      symbol,
      detectedAt: article.createdAt,
      strength,
      headline: article.headline,
    }));
}

/**
 * Age a signal at a moment in time. `enter` only inside the entry window — the "don't buy the
 * peak" rule is enforced here rather than left to a caller's discretion — then `hold` until the
 * time-boxed life is over, then `expired`. A signal timestamped in the future is treated as
 * `expired` rather than granting an entry window that never closes.
 *
 * Typed against the minimal `{ detectedAt }` shape (not the full `TacoSignal`) so the TACO
 * playbook (`src/playbooks/taco-djt.ts`) can window the generic `PlaybookEvent`s it receives
 * from the engine without needing this module's richer type — a real `TacoSignal` still
 * satisfies it, so every existing caller is unaffected.
 */
export function tacoWindow(signal: { readonly detectedAt: string }, asOfIso: string): TacoWindow {
  const age = ageMinutes(signal.detectedAt, asOfIso);
  if (age === undefined || age < 0) {
    return "expired";
  }
  if (age <= TACO_TIMING.entryMinutes) {
    return "enter";
  }
  return age <= TACO_TIMING.holdMinutes ? "hold" : "expired";
}

function ageMinutes(fromIso: string, toIso: string): number | undefined {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  return Number.isFinite(from) && Number.isFinite(to) ? (to - from) / 60_000 : undefined;
}

/**
 * Parse `SKYNET_TACO_WATCHLIST` ("DJT,XYZ"); unset or empty falls back to the default list.
 * Symbols are upper-cased so a lowercase env entry cannot silently match nothing.
 */
export function tacoWatchlist(
  env: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  const parsed = (env.SKYNET_TACO_WATCHLIST ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : TACO_DEFAULT_WATCHLIST;
}
