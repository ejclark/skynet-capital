/**
 * Section 3 of the intraday-edges study — every candidate strategy, scored and costed against
 * buy-and-hold. `score()` is the honest-accounting core: it charges every round trip 2x the
 * slippage assumption and reports the break-even slippage (the cost at which the edge is
 * exactly zero) alongside the Sharpe comparison, so a strategy can't look good just because it
 * was profitable in a period where everything was profitable.
 */

import { ret, stats } from "./session-stats.mjs";

/**
 * Score a strategy honestly. `trades` = round trips (each costs 2 × slippage).
 * Reports the break-even slippage — the cost at which the edge is exactly zero.
 */
function score(name, perDay, tradesPerDay, slippageBps, holdFraction) {
  const s = stats(perDay);
  if (!s) return null;
  const costPct = (2 * slippageBps) / 100;
  const net = perDay.map((x, i) => x - (tradesPerDay[i] ?? 0) * costPct);
  const ns = stats(net);
  const totalTrades = tradesPerDay.reduce((a, b) => a + b, 0);
  return {
    name,
    n: s.n,
    grossMean: s.mean,
    netMean: ns.mean,
    netTotal: ns.total,
    win: s.win,
    sharpe: ns.sharpe,
    trades: totalTrades,
    exposure: holdFraction,
    // Break-even: gross total profit spread across every round trip, halved (two sides).
    breakEvenBps: totalTrades > 0 ? (s.total / totalTrades / 2) * 100 : Infinity,
  };
}

function report(rows, bh) {
  const w = (s, n) => String(s).padStart(n);
  console.log(
    `\n  ${"strategy".padEnd(34)}${w("n", 5)}${w("gross%/d", 10)}${w("net%/d", 9)}` +
      `${w("net tot%", 10)}${w("win%", 6)}${w("Sharpe", 8)}${w("trades", 8)}${w("b/e bps", 9)}`,
  );
  console.log(`  ${"-".repeat(89)}`);
  for (const r of rows.filter(Boolean)) {
    const flag = r.sharpe > bh.sharpe ? " *" : "";
    console.log(
      `  ${r.name.padEnd(34)}${w(r.n, 5)}${w(r.grossMean.toFixed(3), 10)}${w(r.netMean.toFixed(3), 9)}` +
        `${w(r.netTotal.toFixed(1), 10)}${w(r.win.toFixed(0), 6)}${w(r.sharpe.toFixed(2), 8)}` +
        `${w(r.trades, 8)}${w(r.breakEvenBps === Infinity ? "-" : r.breakEvenBps.toFixed(1), 9)}${flag}`,
    );
  }
  console.log(`  * = better risk-adjusted than buy-and-hold (Sharpe ${bh.sharpe.toFixed(2)})`);
}

/**
 * The first session to trade outside the opening hour's range, and on which side.
 * Entry is assumed AT the range edge — generous, since a real fill would be worse. The
 * strategy still loses after costs, so the generosity only strengthens the negative result.
 */
function firstBreak(day) {
  const hi = day.bars[0].high;
  const lo = day.bars[0].low;
  for (const b of day.bars.slice(1)) {
    if (b.high > hi) return { side: 1, entry: hi };
    if (b.low < lo) return { side: -1, entry: lo };
  }
  return null;
}

/** Opening-range breakout / fade: the first hour sets the range, take the break, exit at close. */
function openingRangeRows(daily, slip) {
  const breaks = daily.map(firstBreak);
  const trades = breaks.map((b) => (b ? 1 : 0));
  return [1, -1].map((dir) =>
    score(
      dir === 1 ? "opening-range BREAKOUT -> close" : "opening-range FADE -> close",
      breaks.map((b, i) => (b ? dir * b.side * ret(b.entry, daily[i].close) : 0)),
      trades,
      slip,
      trades.filter(Boolean).length / daily.length,
    ),
  );
}

/** Section 3 — every strategy, costed, against buy-and-hold. */
export function reportStrategies(daily, slip) {
  console.log(
    `\n${"=".repeat(93)}\n3. STRATEGIES — each judged vs buy-and-hold, net of ${slip}bps/side`,
  );
  const bhDaily = daily.map((d, i) => (i === 0 ? 0 : ret(daily[i - 1].close, d.close)));
  const bh = stats(bhDaily);
  const rows = [
    score(
      "buy & hold (benchmark)",
      bhDaily,
      bhDaily.map(() => 0),
      slip,
      1,
    ),
    ...openingRangeRows(daily, slip),
  ];

  // First-hour direction as a signal for the rest of the day: momentum vs reversal.
  for (const dir of [1, -1]) {
    const perDay = daily.map(
      (d) => Math.sign(ret(d.open, d.firstClose)) * dir * ret(d.firstClose, d.close),
    );
    rows.push(
      score(
        dir === 1 ? "first-hour MOMENTUM -> close" : "first-hour REVERSAL -> close",
        perDay,
        daily.map(() => 1),
        slip,
        5 / 6.5,
      ),
    );
  }

  // The overnight-drift anomaly: hold only the gap, or only the session.
  rows.push(
    score(
      "hold OVERNIGHT only (close->open)",
      daily.map((d, i) => (i === 0 ? 0 : ret(daily[i - 1].close, d.open))),
      daily.map((_, i) => (i === 0 ? 0 : 1)),
      slip,
      0.3,
    ),
    score(
      "hold SESSION only (open->close)",
      daily.map((d) => ret(d.open, d.close)),
      daily.map(() => 1),
      slip,
      1,
    ),
    // "Let the amateurs trade the first hour" — the folk rule, measured.
    score(
      "skip first hour, 10:30 -> close",
      daily.map((d) => ret(d.firstClose, d.close)),
      daily.map(() => 1),
      slip,
      5 / 6.5,
    ),
    // Does the last 30 minutes predict the overnight gap?
    score(
      "last-30m sign -> hold overnight",
      daily.map((d, i) =>
        i + 1 >= daily.length
          ? 0
          : Math.sign(ret(d.lastOpen, d.close)) * ret(d.close, daily[i + 1].open),
      ),
      daily.map((_, i) => (i + 1 >= daily.length ? 0 : 1)),
      slip,
      0.3,
    ),
  );

  report(rows, bh);
}
