/**
 * The beta scout — Eric's beta-phase directive (2026-08-13): "we will reset money... deploying
 * playbooks to observe mechanics acting in live environments gives me confidence." The evidence-
 * gated playbooks (S1-NVDA, G1-GOOG) only fire inside a real, confirmed window — by design, and
 * that stays true. But this phase's actual goal is exercising the machinery, not waiting for a
 * high-conviction signal to arrive naturally. So: if NOTHING organic fires by the scout's daily
 * check, rank whatever signal already exists (sentiment, momentum — nothing new is researched
 * per pick) and force a small, minimum-size, honestly-labeled trade on the best few candidates.
 *
 * THE LINE THIS MUST NEVER BLUR: a scout pick is not a conviction signal. It NEVER shares a
 * playbookId with an evidence-gated play (`BETA_SCOUT_ID`, reserved, checked against the real
 * roster in registry.spec.ts), it is sized far below even the softest playbook mode, and its
 * `reason` states plainly that no organic trade fired and exactly what thin signal ranked it —
 * so the metrics layer (docs/plans/metrics-layer.md) can and must bucket scout performance
 * separately from a playbook's evidence-backed track record. Conflating the two would make every
 * future "does S1-NVDA actually work" question unanswerable.
 */
import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";

export const BETA_SCOUT_ID = "BETA-SCOUT";

/** Equity fraction per pick — deliberately below every playbook's `conservative` size (0.01+).
 *  This is a mechanics probe, not a position; "small monetary experiment" means small. */
const BETA_SCOUT_SIZE_PCT = 0.005;

/**
 * `SKYNET_BETA_FORCING` as set by the autonomy-ops `set-beta-forcing` button: a pick count,
 * optionally followed by `+stage`. `"2"` = up to 2 forced picks/day, in-hours only (unchanged).
 * `"2+stage"` = the same, AND when the market is closed the scout may stage its picks for the
 * next session (Eric, 2026-09-04: "configuration that nudges sauron to put in an after hours
 * trade that is staged to be executed when the market opens") — day market orders Alpaca queues
 * for its own `next_open`, which is how the exchange calendar (holidays included) stays Alpaca's
 * problem and never ours. Anything unparseable = dark, never a guess.
 */
export function parseBetaForcing(raw: string | undefined): {
  readonly maxPicks: number;
  readonly stageAfterClose: boolean;
} {
  const match = /^\s*(\d+)\s*(\+\s*stage)?\s*$/i.exec(raw ?? "");
  if (!match) return { maxPicks: 0, stageAfterClose: false };
  const maxPicks = Number(match[1]);
  return { maxPicks, stageAfterClose: maxPicks > 0 && match[2] !== undefined };
}

export interface BetaScoutConfig {
  /** How many picks to force when nothing organic fired (Eric: "2-3"). */
  readonly maxPicks?: number;
  readonly sizePct?: number;
}

/** |sentiment| + |momentum| — the cheapest signal already computed elsewhere, nothing new
 *  fetched per candidate. The scout's whole premise is "rank what we already have," not
 *  "research harder because nothing organic fired." */
function signalStrength(context: MarketContext, symbol: string): number {
  const sentiment = context.newsSentiment?.[symbol] ?? 0;
  const momentum = context.momentum?.[symbol] ?? 0;
  return Math.abs(sentiment) + Math.abs(momentum);
}

/** Direction follows the SIGN of whichever signal is present — long-only, so a net-negative
 *  read is skipped rather than shorted (no instrument for that yet). */
function directionOf(context: MarketContext, symbol: string): "buy" | "skip" {
  const sentiment = context.newsSentiment?.[symbol] ?? 0;
  const momentum = context.momentum?.[symbol] ?? 0;
  return sentiment + momentum > 0 ? "buy" : "skip";
}

/**
 * Force up to `maxPicks` small buys when nothing organic fired today. Returns [] whenever
 * ANYTHING organic already happened (the whole point is filling a silent day, not padding an
 * active one), or when no candidate has any signal at all (an honest empty scan beats a
 * fabricated one — see `directionOf`'s skip case).
 *
 * `managedSymbols` — playbook-owned symbols are excluded; the scout never second-guesses an
 * evidence-gated play's own silence on its own symbol.
 */
export function betaScoutIntents(
  context: MarketContext,
  portfolio: Portfolio,
  universe: readonly string[],
  managedSymbols: ReadonlySet<string>,
  firedOrganicallyToday: boolean,
  config: BetaScoutConfig = {},
): OrderIntent[] {
  if (firedOrganicallyToday) {
    return [];
  }
  const maxPicks = config.maxPicks ?? 3;
  const sizePct = config.sizePct ?? BETA_SCOUT_SIZE_PCT;

  const ranked = universe
    .filter((symbol) => !managedSymbols.has(symbol))
    .filter((symbol) => heldQuantity(portfolio, symbol) === 0) // never pyramid a scout pick
    .map((symbol) => ({ symbol, quote: context.quotes[symbol] }))
    .filter((c): c is { symbol: string; quote: NonNullable<typeof c.quote> } =>
      Boolean(c.quote && c.quote.ask > 0),
    )
    .map((c) => ({ ...c, strength: signalStrength(context, c.symbol) }))
    .filter((c) => directionOf(context, c.symbol) === "buy")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, maxPicks);

  const intents: OrderIntent[] = [];
  for (const { symbol, quote, strength } of ranked) {
    const equity = portfolio.cash; // scout only ever enters from flat on its own symbols
    const quantity = Math.floor((sizePct * equity) / quote.ask);
    if (quantity < 1) {
      continue; // too little cash to buy even one share — say nothing rather than a 0-share order
    }
    const sentiment = (context.newsSentiment?.[symbol] ?? 0).toFixed(2);
    const momentum = (context.momentum?.[symbol] ?? 0).toFixed(3);
    intents.push({
      symbol,
      side: "buy",
      quantity,
      type: "market",
      playbookId: BETA_SCOUT_ID,
      playbookMode: "conservative",
      reason:
        `BETA-PHASE FORCED PICK — no organic trade fired today, so this was chosen from ` +
        `whatever signal already existed, not a conviction call: sentiment=${sentiment} ` +
        `momentum=${momentum} (combined strength ${strength.toFixed(3)}, ranked among ` +
        `${maxPicks} forced picks). Do not read this as playbook-evidence performance.`,
    });
  }
  return intents;
}

/**
 * Flatten every scout-owned position the caller is still tracking as open. A `Position` carries
 * no record of which playbook opened it, so the caller (run-autonomous.ts) is the source of
 * truth for "which symbols are open because the scout, not a conviction signal, put them
 * there" — a small tracked Set, mirroring how `AutonomousTrader` already tracks per-symbol
 * cooldowns. Called once per new trading day, BEFORE any new picks are considered, so a scout
 * position is never held longer than one day: it is a mechanics probe, not a position to manage.
 */
export function betaScoutExitIntents(
  portfolio: Portfolio,
  scoutOwnedSymbols: ReadonlySet<string>,
): OrderIntent[] {
  const intents: OrderIntent[] = [];
  for (const symbol of scoutOwnedSymbols) {
    const held = heldQuantity(portfolio, symbol);
    if (held > 0) {
      intents.push({
        symbol,
        side: "sell",
        quantity: held,
        type: "market",
        playbookId: BETA_SCOUT_ID,
        playbookMode: "conservative",
        reason: "BETA-PHASE FORCED PICK exit — one trading day held, per the scout's own rule.",
      });
    }
  }
  return intents;
}
