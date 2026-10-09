// A world's book as the server's own config (#4943 slice 2) — the seams the real route handlers
// read through (`DashboardServerConfig`), each answered from memory instead of a broker, a JSONL
// ledger or SQLite. The route handlers, their gates and the builders behind them are untouched,
// so "who may see a bot's playbooks" (#885) is decided by `ownsDesk` exactly as in production —
// the world only says which member owns which account.
//
// Market data (quotes, chains, greeks, bars — the SPY benchmark included) comes from market.mjs's
// client over the world's `market` input; the broker's account, history and order list from the
// book. Seams left unwired on purpose answer as production does when they are absent ("not
// available"): the COND-SCOUT probe ledger, the order audit log (so a human row's origin reads
// `unknown`), the bot funnel/expectancy, the alert and council stores, and every admin store.
// The 3M and 1Y windows read the same month the world holds — its history is a month long.

import { regularSessionOpen } from "../../../src/domain/market-session.ts";
import { INSTANT } from "./instant.mjs";
import { marketClient } from "./market.mjs";

const AT = new Date(INSTANT);

/** Alpaca's history periods, newest point last; a window is the tail of the month we hold. */
const PERIOD_POINTS = { "1W": 6, "1M": 23, "3M": 23, "1A": 23 };

/** The broker's portfolio-history shape over the last `n` samples of one account's history. */
function portfolioHistory(samples, n) {
  const tail = samples.slice(-n);
  const base = tail[0]?.equity ?? null;
  return {
    timestamp: tail.map((s) => Math.floor(Date.parse(s.at) / 1000)),
    equity: tail.map((s) => s.equity),
    profit_loss: tail.map((s) => (base === null ? null : s.equity - base)),
    profit_loss_pct: tail.map((s) => (base ? (s.equity - base) / base : null)),
    base_value: base,
  };
}

/** The slice of the trading client the net-worth and equity-curve routes call. */
function tradingClient(book, id) {
  const samples = book.history[id] ?? [];
  if (samples.length === 0) return undefined;
  return {
    isMarketOpen: async () => regularSessionOpen(AT),
    // The broker's order list is the ledger's filled orders, newest first — none working.
    listOrders: async () =>
      [...(book.activity[id] ?? [])]
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .map((f) => ({
          id: f.orderId,
          symbol: f.symbol,
          qty: String(f.quantity),
          side: f.side,
          status: "filled",
          type: "limit",
          limit_price: String(f.price),
          time_in_force: "day",
          filled_qty: String(f.filledQuantity),
          filled_avg_price: String(f.price),
          submitted_at: f.at,
          filled_at: f.at,
        })),
    getAccount: async () => ({ last_equity: String(book.lastEquity[id] ?? "") }),
    getPortfolioHistory: async (period) => portfolioHistory(samples, PERIOD_POINTS[period] ?? 23),
    getPortfolioHistoryByRange: async () => portfolioHistory(samples, samples.length),
  };
}

/** The decision store's order-id index over every bot record. */
function orderIndex(book) {
  const byOrder = new Map();
  for (const records of Object.values(book.decisions)) {
    for (const record of records) {
      for (const outcome of record.outcomes) {
        const orderId = outcome.result?.orderId;
        if (orderId) byOrder.set(orderId, { record, intent: outcome.intent });
      }
    }
  }
  return byOrder;
}

/** Newest-first records strictly older than `before`, at most `limit` — the store's keyset page. */
function pageOf(records, page = {}) {
  const older = page.before === undefined ? records : records.filter((r) => r.at < page.before);
  return page.limit === undefined ? older : older.slice(0, page.limit);
}

/** The world's server config. `auth` is configured, so every ownership gate is live. */
export function serverConfig(book) {
  const owners = new Map(book.members.map((m) => [m.email, m.owns]));
  const byOrder = orderIndex(book);
  return {
    hub: {
      getState: () => ({
        generatedAt: book.generatedAt,
        participants: book.participants,
        collisions: [],
      }),
      // The composer reads state once per request; nothing ticks, so nothing is ever published.
      subscribe: () => () => undefined,
    },
    auth: {},
    now: () => new Date(AT),
    resolveOwnerIds: (email) => owners.get(email) ?? [],
    resolveOwnerId: (email) => owners.get(email)?.[0],
    rosterIds: () => new Set(book.participants.map((p) => p.id)),
    readTradeActivity: async (id) => book.activity[id] ?? [],
    readDecisions: async (id, page) => pageOf(book.decisions[id] ?? [], page),
    findByOrderId: (orderId) => byOrder.get(orderId),
    readHistory: async (id) => book.history[id] ?? [],
    subscriptions: { load: () => book.subscriptions, loadIfReadable: () => book.subscriptions },
    tradingClientFor: (id) => tradingClient(book, id),
    optionsClientFor: () => marketClient(book.market),
  };
}

/** The session a viewer's requests carry — what the auth gate hands every route. */
export function sessionFor(email) {
  return { email, provider: "google", exp: 0 };
}
