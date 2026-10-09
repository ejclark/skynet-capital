// Inputs → the records a running server would hold (#4943 slice 2): broker snapshots, the
// activity ledger, the decision store, the subscriptions file, equity history. Nothing here
// formats a number for display — that is the real builders' job, run over these by compose.mjs.
//
// THE ONE THING COMPOSED BY RUNNING A PLAYBOOK: a pass with `wheelSale` asks the registered
// playbook itself (`decide`) what it would have sold at that moment, from a chain written in the
// input. So the order's reason, expectation and invalidator are the playbook's own words at this
// commit — never text copied into a fixture that would go stale the day the wheel's copy changes.
// If the playbook sells nothing from that chain the compose fails loudly rather than inventing an
// order.
//
// Equity is derived, never typed twice: a participant's equity is cash + Σ market value, and the
// last history point ("@now") is overwritten with it, so the chart, the header and the blotter
// can never disagree inside one world. History samples carry the snapshot's cash throughout — a
// simplification the study does not measure (no surface plots cash over time).

import { UPCOMING_PRINTS } from "../../../src/domain/earnings-calendar.ts";
import { findPlaybook } from "../../../src/playbooks/registry.ts";
import {
  buildOccSymbol,
  contractMultiplier,
  parseOccSymbol,
} from "../../../src/trading/option-symbols.ts";
import { loadInput } from "./inputs.mjs";
import { msOf, resolveTokens } from "./instant.mjs";

/** True when a symbol is an option contract. */
const isOption = (symbol) => parseOccSymbol(symbol) !== undefined;

/** Ask the registered playbook what it sells from the input's chain at that pass. */
function wheelIntent(sale, at) {
  const playbook = findPlaybook(sale.playbookId);
  const underlying = playbook?.symbols[0];
  if (!(playbook?.decide && underlying)) throw new Error(`book: ${sale.playbookId} cannot decide`);
  const asOf = new Date(at).toISOString();
  const contracts = {};
  for (const row of sale.chain) {
    for (const expiration of sale.listed) {
      const occSymbol = buildOccSymbol({ underlying, expiration, type: "put", strike: row.strike });
      contracts[occSymbol] = {
        occSymbol,
        underlying,
        type: "put",
        strike: row.strike,
        expiration,
        bid: row.bid,
        ask: row.ask,
        delta: row.delta,
        openInterest: row.openInterest,
        quotedAt: new Date(at - 5000).toISOString(),
        fetchedAt: asOf,
      };
    }
  }
  const context = {
    asOf,
    quotes: {
      [underlying]: { symbol: underlying, bid: sale.spot, ask: sale.spot, last: sale.spot, asOf },
    },
    options: { listed: { [underlying]: sale.listed }, contracts },
  };
  const [intent] = playbook.decide(context, sale.book, UPCOMING_PRINTS, sale.mode);
  if (!intent) throw new Error(`book: ${sale.playbookId} sold nothing from the input chain`);
  // The persona runner stamps the owning playbook on its intents (`with-playbooks.ts`); so do we.
  return { ...intent, playbookId: sale.playbookId, playbookMode: sale.mode };
}

/** One placed order as a decision record's outcome plus the ledger line its fill wrote. */
function placedOrder(order, at, personaId, participantId) {
  const intent = order.intent ?? {
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    type: "market",
    reason: order.reason,
    playbookId: order.playbookId,
    playbookMode: order.mode,
    strategy: order.strategy,
  };
  const price = order.price ?? intent.option?.limitPrice;
  const symbol = intent.option?.legs?.[0]?.occSymbol ?? intent.symbol;
  const result = {
    intent,
    status: "filled",
    filledQuantity: order.quantity ?? intent.quantity,
    filledPrice: price,
    orderId: order.orderId,
  };
  const fill = {
    orderId: order.orderId,
    participantId,
    symbol,
    side: intent.side ?? order.side,
    quantity: result.filledQuantity,
    filledQuantity: result.filledQuantity,
    price,
    status: "filled",
    at: new Date(at).toISOString(),
    source: "stream",
  };
  return { outcome: { intent, action: "placed", result }, fill, personaId };
}

/** The bot's decision store (newest first) and the fills its placed orders wrote. */
function botRecords(bot) {
  const records = [];
  const fills = [];
  let saleFill;
  for (const pass of bot.passes) {
    const at = msOf(pass.at);
    const orders = (pass.placed ?? []).map((o) => placedOrder(o, at, bot.id, bot.id));
    if (pass.wheelSale) {
      const intent = wheelIntent(pass.wheelSale, at);
      const order = { intent, orderId: pass.wheelSale.orderId, quantity: intent.quantity ?? 1 };
      const placed = placedOrder(order, at, bot.id, bot.id);
      saleFill = placed.fill;
      orders.push(placed);
    }
    const intents = orders.map((o) => o.outcome.intent);
    records.push({
      at,
      personaId: bot.id,
      mode: "live",
      rawIntents: intents,
      guardedIntents: intents,
      outcomes: orders.map((o) => o.outcome),
      ...(pass.verdicts ? { playbookVerdicts: bot.verdicts } : {}),
    });
    fills.push(...orders.map((o) => o.fill));
  }
  records.sort((a, b) => b.at - a.at);
  return { records, fills, saleFill };
}

/** A broker snapshot from an input participant: marks → market values, equity derived. */
function snapshotOf(p, saleFill) {
  const positions = p.positions.map((pos) => {
    const scale = contractMultiplier(pos.symbol);
    const fromSale = pos.fromWheelSale && saleFill?.symbol === pos.symbol;
    if (pos.fromWheelSale && !fromSale) throw new Error(`book: no sale opened ${pos.symbol}`);
    const avg = fromSale ? saleFill.price : pos.avgPrice;
    return {
      symbol: pos.symbol,
      quantity: pos.quantity,
      avgPrice: avg * scale,
      marketValue: Math.round(pos.quantity * pos.mark * scale * 100) / 100,
      lastdayPrice: pos.lastday * scale,
    };
  });
  const equity = p.cash + positions.reduce((s, x) => s + x.marketValue, 0);
  return {
    id: p.id,
    displayName: p.displayName,
    kind: p.kind,
    ...(p.personaId ? { personaId: p.personaId } : {}),
    accountNumber: `PA-STUDY-${p.id.toUpperCase()}`,
    cash: p.cash,
    equity,
    realizedPl: p.realizedPl,
    positions,
    activity: [],
  };
}

/** Everything a world's server would hold, from one input file. */
export function buildBook(name) {
  const input = resolveTokens(loadInput(name));
  const bot = input.bot ? botRecords({ ...input.bot, passes: input.bot.passes }) : undefined;
  const participants = input.participants.map((p) => snapshotOf(p, bot?.saleFill));
  const activity = {};
  for (const [id, fills] of Object.entries(input.humanFills ?? {})) {
    activity[id] = fills.map((f) => ({
      ...f,
      participantId: id,
      filledQuantity: f.quantity,
      status: "filled",
      source: "stream",
    }));
  }
  if (bot) activity[input.bot.id] = bot.fills;
  const history = {};
  for (const p of participants) {
    history[p.id] = (input.history?.[p.id] ?? []).map((h, i, all) => ({
      at: h.at,
      participantId: p.id,
      equity: i === all.length - 1 ? p.equity : h.equity,
      cash: p.cash,
      realizedPl: p.realizedPl ?? 0,
    }));
  }
  const subscriptions = input.bot
    ? {
        [input.bot.id]: input.bot.verdicts.map((v) => ({
          accountId: input.bot.id,
          playbookId: v.playbookId,
          mode: v.mode,
          enabled: true,
          createdAt: input.bot.subscribedAt,
          updatedAt: input.bot.subscribedAt,
        })),
      }
    : {};
  // The league's 1M metric reads a month return the broker sync writes onto each snapshot
  // (`monthReturnPct`); the world's month of history is that sync's input.
  for (const p of participants) {
    const h = history[p.id];
    if (h?.length > 1) p.monthReturnPct = (h[h.length - 1].equity / h[0].equity - 1) * 100;
  }
  const symbols = { ...(input.market?.symbols ?? {}) };
  for (const p of input.participants) {
    for (const pos of p.positions) {
      if (symbols[pos.symbol] && !isOption(pos.symbol)) {
        symbols[pos.symbol] = { spot: pos.mark, prevClose: pos.lastday, ...symbols[pos.symbol] };
      }
    }
  }
  const lastEquity = Object.fromEntries(input.participants.map((p) => [p.id, p.lastEquity]));
  return {
    generatedAt: new Date().toISOString(),
    members: input.members,
    participants,
    activity,
    decisions: bot ? { [input.bot.id]: bot.records } : {},
    subscriptions,
    history,
    lastEquity,
    market: { expirations: input.market?.expirations ?? [], symbols },
  };
}
