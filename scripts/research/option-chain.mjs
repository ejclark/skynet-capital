/**
 * Option-chain fetch and reduction for the premium-fit instrument (#4469 slice 1).
 *
 * SOURCE: Cboe's public delayed-quote endpoint. Chosen because it needs no credential and this
 * instrument has to run in a build session that has none — `src/alpaca/alpaca-options-client.ts`
 * is the live path and keeps its job. The quotes are delayed and the greeks are Cboe's own, which
 * is fine for a fit study (is premium rich, are the spreads payable) and would NOT be fine for
 * routing an order. Every doc this instrument produces says which it is.
 *
 * Cached per symbol per UTC day under `node_modules/.cache`: a fit study gets re-run several times
 * while the questions change, and a snapshot is a snapshot — re-pulling it mid-session would
 * silently move the numbers under the prose. `--refresh` on the CLI drops the cache.
 *
 * LOUD FAILURE: an unreadable payload is an error, never an empty chain. A fit verdict computed
 * off a chain that silently came back empty is the exact shape of wrong this study must not emit.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = join(process.cwd(), "node_modules", ".cache", "premium-fit");
const UA = "skynet-capital research (ejclark83@gmail.com)";

/** Cboe's delayed-quote chain for one underlying. */
export const chainUrl = (symbol) =>
  `https://cdn.cboe.com/api/global/delayed_quotes/options/${encodeURIComponent(symbol.toUpperCase())}.json`;

/**
 * Parse an OSI contract symbol (`CRWV261002C00050000`) into its parts.
 *
 * The root is whatever precedes the fixed 15-character tail, so an adjusted-series root (`1CRWV`)
 * parses rather than throwing — those contracts exist after a corporate action and a wheel must be
 * able to *see* one in order to refuse it.
 *
 * @param {string} osi
 * @returns {{root: string, expiry: string, right: "C"|"P", strike: number}}
 */
export function parseOsi(osi) {
  const m = /^(.+?)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/.exec(osi);
  if (!m) throw new Error(`not an OSI contract symbol: ${osi}`);
  const [, root, yy, mm, dd, right, strike] = m;
  return {
    root,
    expiry: `20${yy}-${mm}-${dd}`,
    right: /** @type {"C"|"P"} */ (right),
    strike: Number(strike) / 1000,
  };
}

/** Bid/ask spread as a share of mid, or null when there is no two-sided market to measure. */
export function spreadPct(contract) {
  const mid = (contract.bid + contract.ask) / 2;
  if (!(mid > 0 && contract.bid > 0)) return null;
  return (contract.ask - contract.bid) / mid;
}

/**
 * Fetch and normalize one underlying's chain.
 *
 * @param {string} symbol
 * @param {{refresh?: boolean, fetchImpl?: typeof fetch, today?: string}} [opts]
 * @returns {Promise<{symbol: string, spot: number, iv30: number, asOf: string, contracts: object[]}>}
 */
export async function fetchChain(symbol, opts = {}) {
  const {
    refresh = false,
    fetchImpl = fetch,
    today = new Date().toISOString().slice(0, 10),
  } = opts;
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, `${symbol.toUpperCase()}-${today}.json`);
  let raw;
  if (!refresh && existsSync(path)) {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } else {
    const res = await fetchImpl(chainUrl(symbol), { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${chainUrl(symbol)} -> ${res.status} ${res.statusText}`);
    raw = await res.json();
    // Validate BEFORE writing: a 200 carrying a maintenance page or a truncated body would
    // otherwise poison the day's cache, and every re-run until `--refresh` would throw from disk
    // without ever reaching the network to find out the endpoint had recovered.
    normalizeChain(raw);
    writeFileSync(path, JSON.stringify(raw));
  }
  return normalizeChain(raw);
}

/**
 * Shape Cboe's payload into the chain the reducers below read.
 *
 * @param {object} raw
 * @returns {{symbol: string, spot: number, iv30: number, asOf: string, contracts: object[]}}
 */
export function normalizeChain(raw) {
  const data = raw?.data;
  if (!(data && Array.isArray(data.options)))
    throw new Error(
      "chain payload has no `data.options` array — refusing to report an empty chain",
    );
  if (data.options.length === 0) throw new Error("chain came back with zero contracts");
  const spot = data.current_price ?? data.close;
  if (!(spot > 0)) throw new Error(`chain payload has no usable spot price (got ${spot})`);
  // The headline implied vol is the fit test's entire numerator, and it is the one input whose
  // absence stays INVISIBLE downstream: a NaN makes `percentileRank` count zero values below it,
  // which renders as a graded "stand aside" verdict with a clean-looking JSON payload. Refuse.
  if (!(data.iv30 > 0))
    throw new Error(`chain payload has no usable iv30 (got ${data.iv30}) — the fit test's input`);
  const contracts = data.options.map((o) => {
    const { expiry, right, strike, root } = parseOsi(o.option);
    return {
      osi: o.option,
      root,
      expiry,
      right,
      strike,
      bid: o.bid,
      ask: o.ask,
      mid: (o.bid + o.ask) / 2,
      iv: o.iv,
      delta: o.delta,
      openInterest: o.open_interest,
      volume: o.volume,
    };
  });
  return {
    symbol: data.symbol,
    spot,
    // Cboe publishes iv30 in vol POINTS (69.879); everything downstream is decimal.
    iv30: data.iv30 / 100,
    asOf: raw.timestamp ?? data.last_trade_time,
    contracts,
  };
}

/** Distinct expiries present in a chain, ascending. */
export const expiriesOf = (contracts) => [...new Set(contracts.map((c) => c.expiry))].sort();

/**
 * At-the-money implied volatility for one expiry: the mean of the call and put IV at the strike
 * nearest spot.
 *
 * Both legs, not just the call — put/call IV at the same strike diverge on a hard-to-borrow or
 * heavily-hedged name, and the midpoint is the convention a desk quotes. A leg whose IV is zero
 * (Cboe's marker for a contract it could not solve, typically deep ITM) is dropped rather than
 * averaged in; if both are, this expiry has no honest ATM read and returns null.
 *
 * @returns {{expiry: string, strike: number, iv: number|null}}
 */
export function atmIv(contracts, expiry, spot) {
  const here = contracts.filter((c) => c.expiry === expiry);
  if (here.length === 0) throw new Error(`no contracts at expiry ${expiry}`);
  const strike = here
    .map((c) => c.strike)
    .reduce((best, k) => (Math.abs(k - spot) < Math.abs(best - spot) ? k : best));
  const legs = here.filter((c) => c.strike === strike && c.iv > 0).map((c) => c.iv);
  return {
    expiry,
    strike,
    iv: legs.length === 0 ? null : legs.reduce((a, b) => a + b, 0) / legs.length,
  };
}

/**
 * The ATM straddle's cost as a share of spot — the market's own expected move to this expiry.
 *
 * Priced off mids. A straddle with no two-sided market on either leg returns null: an expected
 * move quoted from a one-sided book is a number with nothing behind it.
 */
export function expectedMove(contracts, expiry, spot) {
  const { strike } = atmIv(contracts, expiry, spot);
  const call = contracts.find((c) => c.expiry === expiry && c.strike === strike && c.right === "C");
  const put = contracts.find((c) => c.expiry === expiry && c.strike === strike && c.right === "P");
  if (!(call && put && call.bid > 0 && put.bid > 0)) return null;
  return { strike, move: (call.mid + put.mid) / spot };
}

/**
 * The put at an expiry whose |delta| sits closest to `target` — how a wheel actually picks a
 * strike.
 *
 * Only contracts with a live bid are eligible: a put you cannot sell is not a candidate, and
 * including it would let the ladder quote a premium nobody would pay.
 *
 * @returns {object|null}
 */
export function putAtDelta(contracts, expiry, target) {
  const candidates = contracts.filter(
    (c) => c.expiry === expiry && c.right === "P" && c.bid > 0 && c.delta < 0,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) =>
    Math.abs(Math.abs(c.delta) - target) < Math.abs(Math.abs(best.delta) - target) ? c : best,
  );
}
