// The quote, symbol-search, chart-bar and option-chain answers `trade.mjs` stubs for /app/trade.
// Split out of `trade.mjs` (scripts/arch-scan.mjs's code-line cap), moved verbatim — pure data.

// The NBBO rides with the quote (#3407 slice 6): the stock ticket seeds Limit at the mid from it.
export const quote = {
  symbol: "NVDA",
  last: 181.32,
  change: 2.14,
  changePct: 1.19,
  tone: "pos",
  bid: 181.28,
  ask: 181.32,
  mid: 181.3,
};

// The Symbol field's tier-2 live fallback (Phase 0.8b): "GATO" (Gatos Silver) is a genuine
// curated-directory miss — not in src/domain/ticker-directory/* — so typing it proves the debounced
// live Alpaca lookup, not the tier-1 static match every other scene in this file exercises.
export const symbolSearch = { hits: [{ symbol: "GATO", name: "Gatos Silver" }] };

// Twenty daily bars for the chart section (#2017 Phase 1 chart build-out, the mount slice) —
// deterministic, hand-shaped rather than realistic finance: the closes walk up with real
// pullbacks and one sharp down day (bar 19) so the frame proves BOTH candle colours, and the
// volumes spike on the big moves so the histogram band shows real variation. Ends on the quote's
// own last (181.32) so the two fixtures agree. Business days only, counted back from 2026-09-08.
const barCloses = [
  172.4, 174.1, 173.2, 176.8, 178.9, 177.3, 175.6, 179.2, 181.0, 180.1, 183.4, 182.2, 185.7, 184.3,
  181.9, 183.8, 186.5, 185.2, 179.4, 181.32,
];
const barVolumesM = [
  31.2, 28.4, 25.9, 40.1, 44.6, 33.0, 30.8, 47.3, 51.9, 29.5, 55.2, 34.7, 60.8, 38.1, 42.4, 36.9,
  49.5, 33.3, 71.6, 45.0,
];
const barDays = [];
for (let d = new Date("2026-09-08T00:00:00Z"); barDays.length < barCloses.length; ) {
  const dow = d.getUTCDay();
  if (dow !== 0 && dow !== 6) barDays.unshift(d.toISOString());
  d = new Date(d.getTime() - 86_400_000);
}
export const bars = {
  symbol: "NVDA",
  bars: barCloses.map((c, i) => {
    const o = i === 0 ? 171.5 : barCloses[i - 1];
    const hi = Math.max(o, c) + 0.6 + (i % 3) * 0.4;
    const lo = Math.min(o, c) - 0.5 - (i % 2) * 0.5;
    return {
      t: barDays[i],
      o,
      h: Number(hi.toFixed(2)),
      l: Number(lo.toFixed(2)),
      c,
      v: Math.round(barVolumesM[i] * 1e6),
    };
  }),
};

// Sixty bars for the STUDIES scene (#2017 Phase 1 chart build-out, the studies slice) — the base
// twenty above stay exactly as they are (the studies-off shots prove that view unchanged), but a
// 20-window SMA/Bollinger has ONE point on a twenty-bar series, which draws no line at all. Forty
// hand-shaped closes are prepended — a gentle drift with two real swings — and the walk lands
// near the base fixture's first open so the join reads as one continuous tape.
const studyPrefixCloses = Array.from({ length: 40 }, (_, i) =>
  Number((165 + 4 * Math.sin(i / 4) + i * 0.15).toFixed(2)),
);
const studyCloses = [...studyPrefixCloses, ...barCloses];
const studyDays = [];
for (let d = new Date("2026-09-08T00:00:00Z"); studyDays.length < studyCloses.length; ) {
  const dow = d.getUTCDay();
  if (dow !== 0 && dow !== 6) studyDays.unshift(d.toISOString());
  d = new Date(d.getTime() - 86_400_000);
}
export const studyBars = {
  symbol: "NVDA",
  bars: studyCloses.map((c, i) => {
    const o = i === 0 ? 164.2 : studyCloses[i - 1];
    const hi = Math.max(o, c) + 0.6 + (i % 3) * 0.4;
    const lo = Math.min(o, c) - 0.5 - (i % 2) * 0.5;
    return {
      t: studyDays[i],
      o,
      h: Number(hi.toFixed(2)),
      l: Number(lo.toFixed(2)),
      c,
      v: Math.round((28 + 20 * Math.abs(Math.sin(i / 2.5))) * 1e6),
    };
  }),
};

// One expiration's put chain around the quote's spot, the same shape `straddle.mjs` uses — needed
// only by the options-ticket quote shot below (#2017 Phase 0.9 review, item 5): with no stub the
// endpoint falls through to `stubBody`'s `{}` default, which `OptionGate` reads as a present-but-
// empty `ChainData` rather than a `chainNote` degrade, and the straddle view crashes on it.
export const chain = {
  symbol: "NVDA",
  optionType: "put",
  // The header reads its quote off the chain (#3299 slice 1) — same book as `quote` above.
  quote,
  // 13 sequential Friday-ish weeklies-plus-monthlies (#2017 Phase 0 task 4c) — enough to prove the
  // expiration tab strip actually needs a horizontal swipe at 390px, not just render the 2-3 dates
  // that would have fit in the old <select> just as well.
  expirations: [
    "2026-09-09",
    "2026-09-11",
    "2026-09-16",
    "2026-09-18",
    "2026-09-25",
    "2026-10-02",
    "2026-10-09",
    "2026-10-16",
    "2026-10-23",
    "2026-10-30",
    "2026-11-20",
    "2026-12-18",
    "2027-01-15",
  ],
  expiration: "2026-09-09",
  spot: 181.32,
  // Row 4 (the 185 strike) carries NO stats at all — the fixture proves both paths at once: the
  // "—" path for a stat-less row, and the happy path for the other four (#2017 Phase 1 slice 14,
  // reused by the chain-stats scene below rather than inventing a fourth chain fixture).
  rows: [175, 177.5, 180, 182.5, 185].map((strike, i) => {
    const base = {
      strike,
      occSymbol: `NVDA260909P${String(strike * 1000).padStart(8, "0")}`,
      premium: Number((0.4 + i * 1.1).toFixed(2)),
      bid: Number((0.32 + i * 1.1).toFixed(2)),
      ask: Number((0.48 + i * 1.1).toFixed(2)),
    };
    if (i === 4) return base;
    return {
      ...base,
      openInterest: 900 + i * 120,
      volume: 300 + i * 90,
      delta: Number((-0.15 - i * 0.18).toFixed(4)),
      gamma: Number((0.008 + i * 0.002).toFixed(4)),
      theta: Number((-0.05 - i * 0.03).toFixed(4)),
      vega: Number((0.12 + i * 0.04).toFixed(4)),
    };
  }),
};
