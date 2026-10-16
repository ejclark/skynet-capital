// A world's market-data client (#4943 slice 2) — the slice of `AlpacaOptionsClient` the trade
// routes read (guidance, option positions, chains, quotes, bars), answered from the world's
// `market` input instead of a feed. Every option price and greek is the HOUSE MODEL's own
// (`priceOption`) at the input's implied vol, so a chain, a held contract's snapshot and the
// guidance built over them agree with each other and with the pinned instant. Quotes are stamped a
// few seconds before INSTANT so every freshness check the routes run reads "fresh".
//
// Bars are a deterministic walk ending on the input's previous close: enough history for a
// realized-vol and a beta, no claim to be a real tape.

import { priceOption } from "../../../src/options/pricing.ts";
import { daysToExpiryFrom } from "../../../src/options/single-leg-odds.ts";
import { buildOccSymbol, parseOccSymbol } from "../../../src/trading/option-symbols.ts";
import { dayFrom, INSTANT } from "./instant.mjs";

const NOW = new Date(INSTANT);
const STAMP = new Date(NOW.getTime() - 4000).toISOString();
/** Strike ladder width around spot, as a fraction of spot, and the steps on each side. */
const LADDER = { width: 0.05, steps: 6 };

const strikeStep = (spot) => (spot >= 200 ? 5 : spot >= 50 ? 2.5 : 1);

/** One contract, priced by the house model; undefined for an underlying the world doesn't hold. */
function quoteOf(m, underlying, expiration, type, strike) {
  const s = m[underlying];
  if (!s) return undefined;
  const days = daysToExpiryFrom(expiration, NOW) ?? 1;
  const v = priceOption({ spot: s.spot, strike, daysToExpiry: days, volatility: s.iv, type });
  if (!v) return undefined;
  // A 4% spread near the money: tight enough for the guidance route's parity cross-check (5%).
  const half = Math.max(0.01, v.price * 0.02);
  return {
    occSymbol: buildOccSymbol({ underlying, expiration, type, strike }),
    strike,
    bid: Math.max(0.01, Math.round((v.price - half) * 100) / 100),
    ask: Math.round((v.price + half) * 100) / 100,
    closePrice: Math.round(v.price * 100) / 100,
    openInterest: 1800,
    volume: 240,
    quotedAt: STAMP,
    delta: v.delta,
    gamma: v.gamma,
    theta: v.theta,
    vega: v.vega,
    impliedVol: s.iv,
  };
}

/** Daily bars ending on the previous session's close, newest last. */
function barsFor(s) {
  const out = [];
  let close = s.prevClose;
  for (let i = 1; i <= 45; i++) {
    const day = dayFrom(-i);
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const swing = Math.sin(i * 1.7) * s.iv * 0.025;
    out.push({
      t: `${day}T04:00:00Z`,
      o: close,
      h: close * 1.01,
      l: close * 0.99,
      c: close,
      v: 1e6,
    });
    close /= 1 + swing;
  }
  return out.reverse();
}

/** Every strike of one type at one expiry, a ladder around spot. */
function chainRows(m, u, expiration, type) {
  const s = m[u];
  if (!s) return [];
  const step = strikeStep(s.spot);
  const centre = Math.round(s.spot / step) * step;
  const rows = [];
  for (let k = -LADDER.steps; k <= LADDER.steps; k++) {
    const row = quoteOf(m, u, expiration, type, centre + k * step);
    if (row) rows.push(row);
  }
  return rows;
}

/** One snapshot per held contract, keyed by OCC symbol — the broker's own shape. */
function snapshots(m, occs) {
  const out = new Map();
  for (const occ of occs) {
    const p = parseOccSymbol(occ);
    const q = p && quoteOf(m, p.underlying, p.expiration, p.type, p.strike);
    if (!q) continue;
    out.set(occ, {
      bid: q.bid,
      ask: q.ask,
      greeks: { delta: q.delta, gamma: q.gamma, theta: q.theta, vega: q.vega },
      impliedVol: q.impliedVol,
      quotedAt: q.quotedAt,
    });
  }
  return out;
}

/** The options client a world hands every route that asks for one. */
export function marketClient(market) {
  const m = market.symbols;
  return {
    getUnderlyingPrice: async (sym) => m[sym]?.spot,
    getUnderlyingQuote: async (sym) =>
      m[sym] && { last: m[sym].spot, prevClose: m[sym].prevClose, lastAt: STAMP },
    getExpirations: async (_u, onOrAfter, limit) =>
      market.expirations.filter((e) => e >= onOrAfter).slice(0, limit ?? 50),
    getChain: async (u, expiration, type) => chainRows(m, u, expiration, type),
    getContractSnapshots: async (occs) => snapshots(m, occs),
    getBars: async (sym) => (m[sym] ? barsFor(m[sym]) : undefined),
    // No contract in a world has expired, been assigned or exercised: a read that succeeded empty.
    readOptionLifecycleActivities: async () => ({ ok: true, rows: [] }),
  };
}
