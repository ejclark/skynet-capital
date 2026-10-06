#!/usr/bin/env node
/**
 * PREMIUM FIT — does a symbol belong on a premium-selling playbook, and on what settings?
 *
 *   node scripts/research/premium-fit.mjs CRWV
 *   node scripts/research/premium-fit.mjs CRWV --json --refresh
 *
 * The instrument behind #4469's "adding a symbol runs research that both gates the symbol and sets
 * how the playbook trades it". It answers two questions and keeps them separate, because they fail
 * independently:
 *
 *   FIT — is the premium actually rich? Implied volatility for the next 30 days against the
 *   distribution of what this symbol then realizes over 30 days, measured on its own tape. High IV
 *   alone is not an edge; a name is usually priced for the volatility it delivers.
 *
 *   SETTINGS — if it fits, which strike and which expiry? The delta rung where the spread is
 *   payable, the book is deep enough to exit, and the market's assignment odds sit ABOVE what this
 *   symbol's own history has delivered — plus the print windows no leg may straddle.
 *
 * It states a verdict, a confidence and a dated falsifier, and never a bare description — the
 * research contract in CLAUDE.md. Paper-only, educational: nothing here routes an order, and the
 * quotes are Cboe's delayed feed, not the live chain.
 */

import { bars, earningsDates } from "./market-data.mjs";
import {
  atmIv,
  expectedMove,
  expiriesOf,
  fetchChain,
  putAtDelta,
  spreadPct,
} from "./option-chain.mjs";
import {
  addDays,
  daysBetween,
  forwardReturns,
  forwardVols,
  logReturns,
  mean,
  percentileRank,
  printCadence,
  printMoves,
  quantile,
  shareBelow,
  straddlesPrint,
  trailingVol,
  volPersistence,
} from "./premium-fit-math.mjs";

/** Trading days in the 30 calendar days `iv30` quotes, to the nearest whole session. */
const HORIZON_SESSIONS = 21;
/**
 * The fit test's comparator window: one trading year.
 *
 * NOT full history, and the controls are why. Run against every bar it can reach, this test calls
 * implied volatility "cheap" on mega-caps whose files start in the 1990s — their distribution
 * carries 2000, 2008 and 2020, eras no current chain is quoting. On 2026-10-02 the full-history
 * version put NVDA's implied at the 17th percentile and AAPL's at the 30th; regime-matched to a
 * year, AAPL moves to the 67th and the cross-section separates into something intelligible (the
 * mega-caps rich, the high-beta AI names cheap) instead of "everything is cheap".
 *
 * A year is the desk convention IV rank already uses (`src/research/iv-rank.ts`, 52 weeks), which
 * is the second reason to pick it: when that series is available, the two numbers will be speaking
 * about the same window.
 */
const LOOKBACK_SESSIONS = 252;
/** The trailing window the persistence check asks "has it calmed down?" over. */
const CALM_SESSIONS = 10;
/**
 * Calendar days a print blocks AFTER its filing date. Three covers the next session plus a
 * weekend — EDGAR publishes no time of day, so the reaction may be either session.
 */
const PRINT_BUFFER_DAYS = 3;
/** The expiry band a wheel leg lives in: long enough to decay, short enough to re-sell. */
const DTE_BAND = [21, 45];
/** The |delta| rungs the ladder quotes. 0.15–0.30 is the conventional cash-secured-put range. */
const DELTA_RUNGS = [0.15, 0.2, 0.25, 0.3];
/** A rung's spread may eat at most this share of its own premium, or the exit costs the edge. */
const MAX_SPREAD_SHARE = 0.15;
/** Open interest below this and there is no one to buy the leg back from. */
const MIN_OPEN_INTEREST = 100;

const pct = (x, digits = 1) => (x == null ? "n/a" : `${(x * 100).toFixed(digits)}%`);
const usd = (x) => (x == null ? "n/a" : `$${x.toFixed(2)}`);

/**
 * Run the study. Returns the full finding as data so `--json` and the human report render the same
 * numbers — a report that recomputes is a report that can disagree with itself.
 */
export async function premiumFit(
  symbol,
  { refresh = false, today = new Date().toISOString().slice(0, 10) } = {},
) {
  const [history, prints, chain] = await Promise.all([
    bars(symbol),
    earningsDates(symbol),
    fetchChain(symbol, { refresh, today }),
  ]);
  if (history.length === 0) throw new Error(`no price history for ${symbol} — nothing to measure`);
  const returns = logReturns(history);
  const cadence = printCadence(prints, today);
  // Each print blocks its own date AND the buffered date after it, because the reaction usually
  // lands on the session following an after-close filing (see `printMoves`). Without the buffer
  // an expiry one day past a print reads "clean" and expires into the gap it was meant to dodge.
  const knownPrints = [...prints, cadence.projectedNext].flatMap((p) => [
    p,
    addDays(p, PRINT_BUFFER_DAYS),
  ]);

  const lookback = returns.slice(-LOOKBACK_SESSIONS);
  const realized = {
    span: `${history[0].date} → ${history.at(-1).date}`,
    sessions: history.length,
    trailing: Object.fromEntries(
      [10, 20, 30, 60].filter((w) => returns.length >= w).map((w) => [w, trailingVol(returns, w)]),
    ),
    forward: forwardVols(lookback, HORIZON_SESSIONS),
    forwardFullHistory: forwardVols(returns, HORIZON_SESSIONS),
    lookbackSessions: lookback.length,
  };
  // Regime-matched to the SAME window as the distribution it qualifies. Run on full history, a
  // mega-cap's grade would be set by a 35-year correlation while the distribution beside it in
  // the report covers one year — two windows, one sentence, and no reader could tell.
  const persistence = volPersistence(lookback, CALM_SESSIONS, HORIZON_SESSIONS);
  const fit = judgeFit(chain.iv30, realized.forward, persistence);
  const expiries = rankExpiries(chain, today, knownPrints);
  // The richest implied the wheel can sell without crossing a print — not merely the nearest one
  // in the band. The term structure usually slopes up into an event, so "first in band" would
  // systematically hand the seller the cheapest leg available to it.
  const inBand = expiries.filter((e) => e.clean && e.inBand && e.atmIv != null);
  const target = inBand.length === 0 ? null : inBand.reduce((a, b) => (b.atmIv > a.atmIv ? b : a));
  const ladder = target ? buildLadder(chain, target, history.slice(-LOOKBACK_SESSIONS), today) : [];
  const settings = proposeSettings(fit, target, ladder, cadence);

  return {
    symbol: chain.symbol,
    asOf: chain.asOf,
    today,
    spot: chain.spot,
    iv30: chain.iv30,
    realized,
    persistence,
    fit,
    expiries,
    target,
    ladder,
    prints: { dates: prints, cadence, moves: printMoves(history, prints) },
    settings,
    ivRank: {
      value: null,
      // Named absence, the doctrine src/research/iv-rank.ts already holds: the series that would
      // answer this lives on the production volume (SKYNET_IV_HISTORY_DIR), and an offline run
      // cannot reach it. Inventing a rank off one snapshot is the failure that module exists to
      // prevent, so this instrument declines rather than approximates.
      reason: "no-recorded-history-offline",
    },
  };
}

/**
 * The fit test: where does today's 30-day implied sit against this symbol's own forward-30-day
 * realized distribution, and what does that gap pay?
 */
function judgeFit(iv30, forward, persistence) {
  const rank = percentileRank(forward, iv30);
  const gap = iv30 - mean(forward);
  // A seller is paid the gap and wears the right tail. "Rich" needs both: implied above the
  // typical outcome AND above enough of the distribution that the median month is a win.
  const verdict =
    rank >= 0.6 && gap > 0.05 ? "fits" : rank >= 0.5 && gap > 0 ? "thin" : "stand aside";
  // NEVER `high` from this instrument alone, by construction. The windows overlap, so the
  // effective sample is `n / horizon` independent months — a dozen, on a year of history — and no
  // dozen observations earn a high grade. The grade also drops when the symbol's own volatility
  // persists: a high trailing→forward correlation means today's regime, not the year's
  // distribution, is the right comparator, and this test is not measuring that one.
  const independent = forward.length / HORIZON_SESSIONS;
  const confidence =
    independent < 6 || Math.abs(persistence.correlation) > 0.4
      ? "low"
      : rank >= 0.7 || rank <= 0.3
        ? "medium"
        : "low";
  return {
    verdict,
    confidence,
    rank,
    gap,
    independentWindows: independent,
    meanForward: mean(forward),
    p10: quantile(forward, 0.1),
    p50: quantile(forward, 0.5),
    p90: quantile(forward, 0.9),
    exceeded: 1 - rank,
  };
}

/** Every expiry with its DTE, ATM IV, expected move, and whether a print sits inside it. */
function rankExpiries(chain, today, knownPrints) {
  return expiriesOf(chain.contracts).map((expiry) => {
    const dte = daysBetween(today, expiry);
    const { iv, strike } = atmIv(chain.contracts, expiry, chain.spot);
    const em = expectedMove(chain.contracts, expiry, chain.spot);
    return {
      expiry,
      dte,
      atmStrike: strike,
      atmIv: iv,
      expectedMove: em?.move ?? null,
      clean: !straddlesPrint(today, expiry, knownPrints),
      inBand: dte >= DTE_BAND[0] && dte <= DTE_BAND[1],
    };
  });
}

/**
 * The delta ladder at the target expiry: what each rung pays, what it costs to get out of, and
 * how the market's assignment odds compare with this symbol's own history.
 */
function buildLadder(chain, target, lookbackBars, today) {
  const sessions = Math.max(2, Math.round(daysBetween(today, target.expiry) * (252 / 365)));
  // Regime-matched to the same window as the fit test. On a recent IPO, full history would let the
  // listing quarter's repricing set the assignment odds for a leg expiring next month.
  const moves = forwardReturns(lookbackBars, sessions);
  return DELTA_RUNGS.map((rung) => {
    const put = putAtDelta(chain.contracts, target.expiry, rung);
    if (!put) return { rung, put: null };
    // ONE spread figure, gated on and printed. It was briefly three identical expressions, which
    // is a drift waiting to happen: `passes` would gate on one while the report showed another.
    // The spread is paid on the way OUT, so it is charged against the premium, not the strike.
    const spreadVsPremium = spreadPct(put);
    const priced = Math.abs(put.delta);
    const historical = shareBelow(moves, put.strike / chain.spot - 1);
    const yieldAtBid = (put.bid / put.strike) * (365 / target.dte);
    return {
      rung,
      put,
      spreadVsPremium,
      pricedAssignment: priced,
      historicalAssignment: historical,
      edge: priced - historical,
      yieldAtBid,
      passes:
        spreadVsPremium != null &&
        spreadVsPremium <= MAX_SPREAD_SHARE &&
        put.openInterest >= MIN_OPEN_INTEREST &&
        priced > historical,
    };
  });
}

/** The settings a playbook would store for this symbol — or a stated reason there are none. */
function proposeSettings(fit, target, ladder, cadence) {
  // #4469 EARS 2: a stand-aside entry shows its reason and accepts no subscription. Settings for a
  // symbol the fit test rejected would be exactly the thing a subscriber then runs — so there are
  // none. A passing ladder underneath a failing fit test is a disagreement to report, not to
  // resolve in the symbol's favour: the ladder reads one expiry, the fit test reads the year.
  if (fit.verdict === "stand aside")
    return {
      ok: false,
      reason: `the fit test says stand aside (implied at the ${(fit.rank * 100).toFixed(0)}th percentile of realized)`,
    };
  if (!target) return { ok: false, reason: "no print-clean expiry inside the 21–45 day band" };
  const passing = ladder.filter((r) => r.passes);
  if (passing.length === 0)
    return { ok: false, reason: "no delta rung clears spread, depth and edge" };
  const pick = passing.reduce((best, r) => (r.yieldAtBid > best.yieldAtBid ? r : best));
  return {
    ok: true,
    targetDelta: pick.rung,
    dteBand: DTE_BAND,
    maxSpreadShare: MAX_SPREAD_SHARE,
    minOpenInterest: MIN_OPEN_INTEREST,
    // A RANGE, not the filing date. `printMoves` exists because EDGAR gives no time of day and
    // the reaction usually lands the session AFTER the filing — an avoid-window that stops at
    // the filing date would let a leg expire straight into the move it was written to dodge.
    avoidWindow: {
      from: cadence.projectedNext,
      through: addDays(cadence.projectedNext, PRINT_BUFFER_DAYS),
    },
    projectionOverdue: cadence.overdue,
    exampleStrike: pick.put.strike,
    exampleExpiry: target.expiry,
    exampleYield: pick.yieldAtBid,
  };
}

function report(f) {
  const lines = [];
  const p = (s = "") => lines.push(s);
  p(`${f.symbol} — premium fit  ·  spot ${usd(f.spot)}  ·  chain as of ${f.asOf} (Cboe, delayed)`);
  p(`history ${f.realized.span} (${f.realized.sessions} sessions)`);
  p();
  p("REALIZED VOLATILITY");
  for (const [w, v] of Object.entries(f.realized.trailing)) p(`  trailing ${w}d   ${pct(v)}`);
  p(
    `  forward ${HORIZON_SESSIONS}-session distribution, last ${f.realized.lookbackSessions} sessions:`,
  );
  p(
    `    p10 ${pct(f.fit.p10)} · median ${pct(f.fit.p50)} · mean ${pct(f.fit.meanForward)} · p90 ${pct(f.fit.p90)}  (n=${f.realized.forward.length} overlapping ≈ ${f.fit.independentWindows.toFixed(0)} independent)`,
  );
  p();
  p("THE FIT TEST — implied against what follows");
  p(`  iv30 (implied, next 30d)      ${pct(f.iv30)}`);
  p(`  sits above                    ${pct(f.fit.rank)} of this symbol's forward 30d outcomes`);
  p(`  paid over the mean outcome    ${pct(f.fit.gap)} of vol`);
  p(
    `  verdict                       ${f.fit.verdict.toUpperCase()} (confidence ${f.fit.confidence})`,
  );
  p(`  iv rank / percentile          absent — ${f.ivRank.reason}`);
  p(
    `  does the calm forecast?       corr(trailing ${CALM_SESSIONS}d, forward ${HORIZON_SESSIONS}d) = ${f.persistence.correlation.toFixed(3)} over ${f.persistence.pairs} pairs`,
  );
  p();
  p("TERM STRUCTURE");
  for (const e of f.expiries.filter((e) => e.dte > 0 && e.dte <= 75))
    p(
      `  ${e.expiry}  ${String(e.dte).padStart(3)}d  atm iv ${pct(e.atmIv).padStart(6)}  em ±${pct(e.expectedMove)}  ${e.clean ? "" : "PRINT INSIDE"}${e.inBand ? "  ←band" : ""}`,
    );
  p();
  if (f.target) {
    p(`PUT LADDER @ ${f.target.expiry} (${f.target.dte}d)`);
    p(
      "  Δ     strike   bid     spread/prem  OI      priced P(assign)  history  edge    ann.yield  ",
    );
    for (const r of f.ladder) {
      if (!r.put) {
        p(`  ${r.rung.toFixed(2)}  — no put with a live bid at this rung`);
        continue;
      }
      p(
        `  ${r.rung.toFixed(2)}  ${usd(r.put.strike).padStart(7)}  ${usd(r.put.bid).padStart(6)}  ` +
          `${pct(r.spreadVsPremium).padStart(11)}  ${String(r.put.openInterest).padStart(6)}  ` +
          `${pct(r.pricedAssignment).padStart(16)}  ${pct(r.historicalAssignment).padStart(7)}  ` +
          `${pct(r.edge).padStart(6)}  ${pct(r.yieldAtBid).padStart(9)}  ${r.passes ? "PASS" : "fail"}`,
      );
    }
  } else {
    p("PUT LADDER — none: no print-clean expiry inside the band");
  }
  p();
  p("PRINTS");
  p(`  ${f.prints.dates.join("  ")}`);
  p(
    `  median gap ${f.prints.cadence.medianGap}d · next projected ${f.prints.cadence.projectedNext}`,
  );
  p("  reaction moves (filing session / the one after — EDGAR gives no time of day):");
  for (const m of f.prints.moves)
    p(
      `    ${m.print}  ${pct(m.move).padStart(7)} / ${pct(m.nextMove).padStart(7)}   worst ${pct(m.worst)}`,
    );
  p();
  p("PROPOSED SETTINGS");
  p(
    f.settings.ok
      ? `  target Δ ${f.settings.targetDelta} · ${f.settings.dteBand[0]}–${f.settings.dteBand[1]} DTE · max spread/premium ${pct(f.settings.maxSpreadShare, 0)} · min OI ${f.settings.minOpenInterest} · no leg across ${f.settings.avoidWindow.from}–${f.settings.avoidWindow.through}`
      : `  none — ${f.settings.reason}`,
  );
  return lines.join("\n");
}

const isMain = process.argv[1]?.endsWith("premium-fit.mjs");
if (isMain) {
  const args = process.argv.slice(2);
  const symbol = args.find((a) => !a.startsWith("--"));
  if (!symbol) {
    console.error("usage: node scripts/research/premium-fit.mjs <SYMBOL> [--json] [--refresh]");
    process.exit(2);
  }
  const started = Date.now();
  const finding = await premiumFit(symbol, { refresh: args.includes("--refresh") });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(args.includes("--json") ? JSON.stringify(finding, null, 2) : report(finding));
  if (!args.includes("--json"))
    console.log(`\nrun: ${elapsed}s, 3 network reads (Yahoo, EDGAR, Cboe)`);
}
