/**
 * OCC option-volume math — the pure reducers behind `option-volume.mjs` (#4808 slice 3, candidate 1).
 *
 * The Options Clearing Corporation publishes daily all-exchange volume per underlying, split
 * call/put × account type (C customer · F firm · M market maker). One request with
 * `symbolType=ALL` returns the whole market for a date (about 4,400 underlyings), which is what the
 * ~500-stock back-test reads. Rows look like `50160,NVDA,2NVDA,C,C,CBOE,10/16/2026,` — quantity,
 * underlying, OCC symbol, account type, put/call, exchange, date (and a trailing comma). The window
 * rolls (the archive is #4832), so a parse never assumes a date is still fetchable.
 *
 * The quantities appear to count both sides of a trade; the plan's open check is against the Cboe
 * chain's own sum. The surge rule below is a RATIO to the same underlying's own history, so a
 * constant factor of two cancels out of it.
 *
 * PURE: no I/O, no clock, no network.
 */

/**
 * @param {string} csv an OCC volume-query response
 * @returns {Map<string, {call: number, put: number, total: number}>} by underlying
 */
export function parseVolume(csv) {
  const out = new Map();
  for (const line of csv.split(/\r?\n/).slice(1)) {
    const [quantity, underlying, , , porc] = line.split(",");
    const qty = Number(quantity);
    if (!(underlying && Number.isFinite(qty)) || (porc !== "C" && porc !== "P")) continue;
    const cell = out.get(underlying) ?? { call: 0, put: 0, total: 0 };
    if (porc === "C") cell.call += qty;
    else cell.put += qty;
    cell.total += qty;
    out.set(underlying, cell);
  }
  return out;
}

/**
 * How many times its trailing mean today's volume is. `history` is the prior sessions only
 * (today excluded), oldest first; only the last `lookback` count. Undefined until the lookback
 * is full — a surge needs a baseline, not a guess.
 */
export function surgeRatio(today, history, lookback = 20) {
  if (history.length < lookback) return undefined;
  const window = history.slice(-lookback);
  const mean = window.reduce((a, b) => a + b, 0) / lookback;
  return mean > 0 ? today / mean : undefined;
}
