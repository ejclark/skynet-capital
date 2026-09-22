// The recent-orders strip's own fixture (#2017 Phase 1 slice 13, task 3a) — split out of
// `trade.mjs` (scripts/arch-scan.mjs's code-line cap) rather than folded inline: one filled sell
// and one partial buy against the SAME OCC contract the recent-orders shot in `trade.mjs` commits
// (the 180 strike of that script's 2026-09-09 put chain fixture, `strike: 180` → `occSymbol:
// "NVDA260909P00180000"`), newest first — `RecentOrdersStrip`'s exact-symbol match only shows
// events for the contract actually in front of the viewer, not every NVDA option.
const order = (orderId, side, quantity, filled, price, status, at) => ({
  orderId,
  symbol: "NVDA260909P00180000",
  display: "NVDA $180 put 9/9",
  side,
  quantity,
  filled,
  price,
  status,
  at,
  backfilled: false,
  origin: "desk",
});

export const recentOrdersActivity = {
  available: true,
  activity: [
    order("ord-9002", "sell", 2, 2, "5.10", "filled", "2026-09-08T14:41:00Z"),
    order("ord-9001", "buy", 3, 1, "4.95", "partial", "2026-09-08T13:10:00Z"),
  ],
};
