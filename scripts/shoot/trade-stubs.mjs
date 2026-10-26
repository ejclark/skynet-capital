// The `/api/**` route stubs for the trade harness (#1461) — the table `openShell` serves the REAL
// built shell from. Extracted from `trade.mjs`, which keeps the frame sequence and the mutable
// scene state: the scenes reassign `currentPlays`, `currentChain`, … between frames, so every
// scene-dependent stub here reads through a getter in `cur` (`cur.plays()`, …) and answers with
// whatever the frame sequence has set *at request time* — exactly what the inline closures did.
// Constant answers (the fixtures no scene ever swaps) are imported directly.
import { currentOptionReview, optionPositions } from "./trade-account-fixture.mjs";
import { symbolSearch } from "./trade-chart-fixture.mjs";
import { outlookAnswer } from "./trade-outlook-fixture.mjs";
import { recentOrdersActivity } from "./trade-recent-orders-fixture.mjs";

/**
 * @param {Record<'plays'|'settings'|'desk'|'quote'|'chain'|'bars'|'orders'|'lifecycle'|'alerts'
 *   |'delivery'|'watchlist'|'draftScript'|'draftFallback', () => unknown>} cur  getters over the
 *   frame sequence's current scene state
 */
export const tradeStubs = (cur) => ({
  "/api/trade/plays": () => cur.plays(),
  "/api/settings": () => cur.settings(),
  // The calendar head reads the research shelf (#3807); an unstubbed `{}` crashed the page with
  // "not iterable" before any frame was shot (found 2026-09-30, #3977). An empty shelf is honest.
  "/api/research": { events: [], closures: [], calls: [], symbols: [], studies: [], ledgers: [] },
  "/api/desk/*": () => cur.desk(),
  // Exact key beats the `/api/desk/*` prefix above (`lib.mjs`'s `stubBody`) — every fixture in
  // this script logs in as the same "human-eric" account (`settings.accounts[0].id`).
  "/api/desk/human-eric/activity": recentOrdersActivity,
  "/api/trade/quote": () => cur.quote(),
  "/api/trade/chain": () => cur.chain(),
  // Matched by pathname alone (`lib.mjs`'s `stubBody`), so one key covers any `?symbol=&days=`.
  "/api/trade/bars": () => cur.bars(),
  // Matched by pathname alone too, so one key covers any `?q=`.
  "/api/symbols/search": () => symbolSearch,
  // Working orders (#3407 P1 slice 2) — pathname-matched, so one key covers `?participantId=`.
  "/api/trade/orders": () => cur.orders(),
  // The reviewed option order (#3407 P2 slice 2): greeks, IV, chance of profit beside expected
  // value — every number the server's own rules would print, as one stub.
  "/api/trade/option/review": () => currentOptionReview,
  // Position Statement vocabulary on the positions card (#3407 P2 slice 3).
  "/api/trade/option-positions": () => optionPositions,
  // What happened without an order (#3407 slice 4) — pathname-matched like its siblings.
  "/api/trade/option-lifecycle": () => cur.lifecycle(),
  "/api/trade/alerts": () => cur.alerts(),
  "/api/trade/alerts/dismiss": { ok: true },
  // Delivery's read and write share one path; the stub answers both with the current state
  // (pathname-matched, so `?participantId=` is covered).
  "/api/trade/alerts/delivery": () => cur.delivery(),
  "/api/trade/cancel": { ok: true, orderId: "wo-1" },
  "/api/trade/replace": {
    ok: true,
    orderId: "wo-9",
    replaces: "wo-1",
    status: "pending_replace",
  },
  // The multi-leg builder's lifecycle (#3407 P3 slice 1) — one scripted answer per action, in
  // the order the scene clicks them; the last answer repeats so a stray re-read stays put.
  "/api/trade/draft": () => cur.draftScript().shift() ?? cur.draftFallback(),
  // The Outlook pane's ranked structures (#3407 slice 4) — pathname-matched, so one key covers
  // any `?direction=&magnitude=&horizon=`.
  "/api/trade/structures": () => outlookAnswer,
  // The watchlist (#4332) — pathname-matched, so one key covers the GET and the POST toggle.
  "/api/trade/watchlist": () => cur.watchlist(),
});
