/**
 * The pure half of the energy re-check (#6952 slice 1): what a name did between the 08-12 study
 * and today, how far it sits from its high, and which sessions the whole basket fell on together.
 *
 * The failures these exist to prevent: a weekend or holiday "as-of" date reading as no price at
 * all, a drawdown measured from a monthly-close peak (the 08-12 study's own red team found those
 * understated true drawdowns by 10–15 points, so peaks here are daily closes), and a shock day
 * picked by one loud name rather than by the basket moving together.
 */

/** The last bar on or before `date`, or null when the series starts after it. */
export function barOn(bars, date) {
  let hit = null;
  for (const b of bars) {
    if (b.date > date) break;
    hit = b;
  }
  return hit;
}

/** Percent change from the close on or before `from` to the close on or before `to`. */
export function changePct(bars, from, to) {
  const a = barOn(bars, from);
  const b = barOn(bars, to);
  if (!(a && b) || a.date === b.date) return null;
  return (b.close / a.close - 1) * 100;
}

/**
 * The highest daily close in the window and how far the last close in it sits below that high.
 * Both read off daily closes, never monthly ones.
 */
export function peakAndDrawdown(bars, from, to) {
  let peak = null;
  let last = null;
  for (const b of bars) {
    if (b.date < from || b.date > to) continue;
    if (!peak || b.close > peak.close) peak = b;
    last = b;
  }
  if (!(peak && last)) return null;
  return {
    peakDate: peak.date,
    peak: peak.close,
    drawdownPct: (last.close / peak.close - 1) * 100,
  };
}

/** Each session's close-to-close return in percent, keyed by date, inside the window. */
export function dailyReturns(bars, from, to) {
  const out = new Map();
  for (let i = 1; i < bars.length; i++) {
    const d = bars[i].date;
    if (d < from || d > to) continue;
    out.set(d, (bars[i].close / bars[i - 1].close - 1) * 100);
  }
  return out;
}

export function median(xs) {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * The basket's worst shared sessions: days ranked by the MEDIAN member's return, so one name's
 * own bad print cannot make a day a shock. A day counts only when at least `minNames` members
 * traded it. Returns the worst `n`, each with every member's move that day (the crowding census).
 */
export function shockDays(returnsBySymbol, { n = 3, minNames = 3 } = {}) {
  const byDate = new Map();
  for (const [sym, rets] of Object.entries(returnsBySymbol)) {
    for (const [date, r] of rets) {
      if (!byDate.has(date)) byDate.set(date, {});
      byDate.get(date)[sym] = r;
    }
  }
  const days = [];
  for (const [date, moves] of byDate) {
    const vals = Object.values(moves);
    if (vals.length < minNames) continue;
    days.push({ date, median: median(vals), moves });
  }
  days.sort((a, b) => a.median - b.median || (a.date < b.date ? -1 : 1));
  return days.slice(0, n);
}
