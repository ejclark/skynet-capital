// Inputs → the records a running server would hold (#4943 slice 2): broker snapshots, the
// activity ledger, the decision store, the subscriptions file, equity history. Nothing here
// formats a number for display — that is the real builders' job, run over these by compose.mjs.
//
// THE ONE THING COMPOSED BY RUNNING A PLAYBOOK: a pass with `wheelSale` asks the registered
// playbook itself (`decide`) what it would have sold at that moment, from a chain written in the
// input. So the order's reason, expectation and invalidator are the playbook's own words at this
// commit — never text copied into a fixture that would go stale the day the wheel's copy changes.
// If the playbook sells nothing from that chain the compose fails loudly rather than inventing an
// order. Likewise a pass's playbook verdicts are the playbooks' own (`playbookVerdicts`) at that
// pass's time — never typed — so a stopped bot's stale pass says what it said then.
//
// SEVERAL BOTS, AND WHAT A PASS CAN SAY (#8005, the bot's loop). An input may name `bots` (a list)
// instead of the one `bot`. A world written that way is composed as the runner reads its roster at
// the pin: each pass's verdicts come from `subscriptionRoster` over the bot's subscriptions — so a
// subscription that points at a conviction view runs the playbook that view narrows, and a pair
// held exits-only says nothing, as the bots record it. (The profile worlds' single `bot` keeps the
// plain-registry verdicts they were frozen with.) A pass may also say what the record says in
// production: `halted` (the kill switch, an owner's suspend, or a breaker holding opens — the
// record's own words), `refused` (opens the guards turned away, each with its rule — a breaker's
// `breaker-halt`, an owner's `opens-held`), and `mode: "observe"` (an owner's "watch only": what it
// decided is recorded as observed, and nothing fills). Like the wheel's sale, a pass's `stopExit`
// asks the code itself: the house stop (`exitSafetyIntents`) over the bot's roster, from the
// quote and book the input writes, so the exit's words are the stop's own at this commit.
//
// Equity is derived, never typed twice: a participant's equity is cash + Σ market value, and the
// last history point ("@now") is overwritten with it, so the chart, the header and the blotter
// can never disagree inside one world. Yesterday's close is derived the same way (cash + Σ
// quantity × lastday — `yesterdayEquity`), so the header's day change is its rows' (#5052). History samples carry the snapshot's cash throughout — a
// simplification the study does not measure (no surface plots cash over time).

import { UPCOMING_PRINTS } from "../../../src/domain/earnings-calendar.ts";
import { exitSafetyIntents, playbookVerdicts } from "../../../src/playbooks/playbook.ts";
import { findPlaybook } from "../../../src/playbooks/registry.ts";
import { subscriptionRoster } from "../../../src/subscriptions/subscription-roster.ts";
import {
  buildOccSymbol,
  contractMultiplier,
  parseOccSymbol,
} from "../../../src/trading/option-symbols.ts";
import { loadInput } from "./inputs.mjs";
import { checkInstant, INSTANT, msOf, resolveTokens } from "./instant.mjs";

/** The deadline production gives one account's broker read (`dashboard-data.ts`), for an input whose
 *  account's read timed out at the instant (#8005, the league); a pin that predates it says so. */
const { SNAPSHOT_READ_TIMEOUT_MS } = await import(
  "../../../src/observatory/dashboard-data.ts"
).catch(() => ({}));

import { modelMarks } from "./market.mjs";

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

/** An input order as the intent the persona would have emitted. */
const intentOf = (order) =>
  order.intent ?? {
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    type: "market",
    reason: order.reason,
    ...(order.playbookId ? { playbookId: order.playbookId, playbookMode: order.mode } : {}),
    ...(order.strategy ? { strategy: order.strategy } : {}),
  };

/** Ask the house stop what it sells at that pass, from the input's quote and book (#6954 slice 4). */
function stopIntent(stop, at, bot) {
  const asOf = new Date(at).toISOString();
  const quotes = Object.fromEntries(
    Object.entries(stop.bids).map(([symbol, bid]) => [
      symbol,
      { symbol, bid, ask: bid, last: bid, asOf },
    ]),
  );
  const roster = subscriptionRoster(subscriptionsOf(bot)).enabled;
  const { intents } = exitSafetyIntents(roster, { asOf, quotes }, stop.book);
  const intent = intents.find((i) => i.symbol === stop.symbol);
  if (!intent) throw new Error(`book: the house stop sold no ${stop.symbol} from the input`);
  return intent;
}

/** One placed order as a decision record's outcome plus the ledger line its fill wrote. */
function placedOrder(order, at, personaId, participantId) {
  const intent = intentOf(order);
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

/** The bot's subscriptions as the store holds them. */
const subscriptionsOf = (bot) =>
  bot.subscribed.map((v) => ({
    accountId: bot.id,
    playbookId: v.playbookId,
    mode: v.mode,
    enabled: v.enabled ?? true,
    ...(v.convictionId ? { convictionId: v.convictionId } : {}),
    createdAt: bot.subscribedAt,
    updatedAt: bot.subscribedAt,
  }));

/** What each subscribed playbook said at that pass — the runner's own pure call
 *  (`with-playbooks.ts`: the print calendar, no external events), so a stale pass reads stale.
 *  `runner`: the roster as the bots resolve it (`subscriptionRoster` — a view's narrowing, a pair
 *  held exits-only, a paused one left out); else every subscription by its plain registry entry. */
function verdictsAt(bot, at, runner) {
  const asOf = new Date(at).toISOString();
  if (runner) return playbookVerdicts(rosterOf(bot), asOf, UPCOMING_PRINTS, []);
  const enabled = bot.subscribed.map((s) => ({
    playbook: findPlaybook(s.playbookId),
    mode: s.mode,
  }));
  const unknown = bot.subscribed.filter((_, i) => !enabled[i].playbook);
  if (unknown.length > 0) throw new Error(`book: no playbook ${unknown[0].playbookId}`);
  return playbookVerdicts(enabled, asOf, UPCOMING_PRINTS, []);
}

/** The bots' own roster over this bot's subscriptions; exits-only pairs record no verdict. */
function rosterOf(bot) {
  const roster = subscriptionRoster(subscriptionsOf(bot));
  if (roster.rejected.length > 0) throw new Error(`book: no playbook ${roster.rejected[0]}`);
  return roster.enabled.filter((e) => !e.exitsOnly);
}

/** A refused open: the intent the guards turned away and the rule that did (`GuardRefusal`). */
const refusalOf = (order) => ({ intent: intentOf(order), reason: order.rule });

/** An order a watching bot decided: recorded as observed, never sent, never filled. */
const observedOrder = (order) => ({ outcome: { intent: intentOf(order), action: "observed" } });

/** The bot's decision store (newest first) and the fills its placed orders wrote. */
function botRecords(bot, runner = false) {
  const records = [];
  const fills = [];
  let saleFill;
  for (const pass of bot.passes) {
    const at = msOf(pass.at);
    const mode = pass.mode ?? "live";
    const orders = (pass.placed ?? []).map((o) =>
      mode === "observe" ? observedOrder(o) : placedOrder(o, at, bot.id, bot.id),
    );
    if (pass.wheelSale) {
      const intent = wheelIntent(pass.wheelSale, at);
      // The playbook asks for as many contracts as its budget secures; the world records what filled.
      const quantity = pass.wheelSale.filled ?? intent.quantity ?? 1;
      const order = { intent, orderId: pass.wheelSale.orderId, quantity };
      const placed = placedOrder(order, at, bot.id, bot.id);
      saleFill = placed.fill;
      orders.push(placed);
    }
    if (pass.stopExit) {
      const intent = stopIntent(pass.stopExit, at, bot);
      const order = { intent, orderId: pass.stopExit.orderId, price: pass.stopExit.filled };
      orders.push(placedOrder(order, at, bot.id, bot.id));
    }
    const intents = orders.map((o) => o.outcome.intent);
    const refusals = (pass.refused ?? []).map(refusalOf);
    records.push({
      at,
      personaId: bot.id,
      mode,
      rawIntents: [...intents, ...refusals.map((r) => r.intent)],
      guardedIntents: intents,
      outcomes: orders.map((o) => o.outcome),
      ...(pass.halted ? { halted: pass.halted } : {}),
      ...(refusals.length > 0 ? { refusals } : {}),
      ...(pass.verdicts ? { playbookVerdicts: verdictsAt(bot, at, runner) } : {}),
    });
    fills.push(...orders.flatMap((o) => (o.fill ? [o.fill] : [])));
  }
  records.sort((a, b) => b.at - a.at);
  return { records, fills, saleFill };
}

/**
 * What a position's input leaves out, derived rather than typed (#8005): an option's mark and
 * yesterday's close from the house model at the world's quotes (market.mjs → `modelMarks`, the same
 * price the chain shows), and a share position's cost from the buys that opened it — so the
 * position row, the chain and the ledger can never tell one figure two ways.
 */
export function derivedFields(pos, fills, symbols) {
  if (isOption(pos.symbol)) {
    if (pos.mark !== undefined) return pos;
    const marks = modelMarks(symbols, pos.symbol);
    if (!marks) throw new Error(`book: the world quotes no underlying for ${pos.symbol}`);
    return { ...pos, ...marks };
  }
  if (pos.avgPrice !== undefined) return pos;
  const buys = fills.filter((f) => f.symbol === pos.symbol && f.side === "buy");
  const shares = buys.reduce((n, f) => n + f.quantity, 0);
  if (shares !== pos.quantity) {
    throw new Error(
      `book: ${pos.symbol} holds ${pos.quantity} but its buys add to ${shares} — type avgPrice or fix the fills`,
    );
  }
  const cost = buys.reduce((s, f) => s + f.quantity * f.price, 0) / shares;
  return { ...pos, avgPrice: Math.round(cost * 10_000) / 10_000 };
}

/** A broker snapshot from an input participant: marks → market values, equity derived. */
function snapshotOf(p, saleFill) {
  // An account whose broker read did not finish at the instant (#8005, the league: `docs/IA.md` §5.7
  // "fails open"): production's own degraded row (`participant-snapshot.ts` → `degraded`) — zeros,
  // no holdings, and the reason in its own words — so the pages read it as production would.
  if (p.brokerRead === "timed out") {
    if (!SNAPSHOT_READ_TIMEOUT_MS) throw new Error("book: this commit has no broker read deadline");
    return {
      id: p.id,
      displayName: p.displayName,
      kind: p.kind,
      ...(p.personaId ? { personaId: p.personaId } : {}),
      cash: 0,
      equity: 0,
      positions: [],
      activity: [],
      error: String(new Error(`broker read timed out after ${SNAPSHOT_READ_TIMEOUT_MS}ms`)),
    };
  }
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

/**
 * Yesterday's closing equity, derived from the marks the rows read (#5052): cash plus each position
 * at yesterday's close, less what the input declares was booked today on positions already closed
 * (`closedToday` — the one gap a header may show beyond its rows). Never typed: a hand-typed figure
 * put Eric's header at −$71 beside rows adding to −$4 (day-change.mjs).
 */
export function yesterdayEquity(p, snapshot) {
  if (p.lastEquity !== undefined) {
    throw new Error(
      `book: ${p.id} types lastEquity — it is derived from cash and each position's lastday; declare a closed-today amount (closedToday) for any gap`,
    );
  }
  const atClose = snapshot.positions.reduce((s, x) => s + x.quantity * x.lastdayPrice, p.cash);
  return Math.round((atClose - (p.closedToday ?? 0)) * 100) / 100;
}

/** The world's bots: `bots`, or the one `bot` an older input names. */
const botsOf = (input) => input.bots ?? (input.bot ? [input.bot] : []);

/**
 * The input, refused unless this process stands on its instant. Every token resolves against the
 * process's instant (instant.mjs), so a world that names its own is built only in a process pinned
 * to it (compose.mjs runs its child so) — never against the default, which would move every fill
 * and pass weeks off the world's day.
 */
function onThisInstant(name, raw) {
  if (raw.instant !== undefined && checkInstant(raw.instant) !== INSTANT) {
    throw new Error(
      `book: ${name} stands on ${raw.instant}, this process on ${INSTANT} — build it with STUDY_INSTANT=${raw.instant}`,
    );
  }
  return raw;
}

/** Everything a world's server would hold, from one input file. */
export function buildBook(name) {
  const raw = resolveTokens(onThisInstant(name, loadInput(name)));
  const symbols = quotedSymbols(raw);
  // Every figure an input leaves out is derived before anything reads it (derivedFields).
  const input = {
    ...raw,
    participants: raw.participants.map((p) => ({
      ...p,
      positions: p.positions.map((pos) =>
        derivedFields(pos, raw.humanFills?.[p.id] ?? [], symbols),
      ),
    })),
  };
  const runner = Array.isArray(input.bots);
  const bots = botsOf(input).map((b) => ({ input: b, ...botRecords(b, runner) }));
  const botById = new Map(bots.map((b) => [b.input.id, b]));
  const participants = input.participants.map((p) => snapshotOf(p, botById.get(p.id)?.saleFill));
  const activity = {};
  for (const [id, fills] of Object.entries(input.humanFills ?? {})) {
    if (id.startsWith("$")) continue;
    activity[id] = fills.map((f) => ({
      ...f,
      participantId: id,
      filledQuantity: f.quantity,
      status: "filled",
      source: "stream",
    }));
  }
  for (const b of bots) activity[b.input.id] = b.fills;
  const lastEquity = Object.fromEntries(
    input.participants.map((p, i) => [p.id, yesterdayEquity(p, participants[i])]),
  );
  const closedToday = Object.fromEntries(
    input.participants.filter((p) => p.closedToday).map((p) => [p.id, p.closedToday]),
  );
  // Two history points are derived, never typed: "@now" is today's equity, and the last point
  // before today's New York midnight is yesterday's close — so the chart's last step is the
  // header's day change too.
  const today = msOf("@0d 00:00");
  const history = {};
  for (const p of participants) {
    // An account read that failed records no sample now: its history ends at its last good one.
    const all = input.history?.[p.id] ?? [];
    const points = p.error ? all.filter((h) => Date.parse(h.at) < Date.parse(INSTANT)) : all;
    const close = points.findLastIndex((h) => Date.parse(h.at) < today);
    history[p.id] = points.map((h, i, all) => ({
      at: h.at,
      participantId: p.id,
      equity:
        i === all.length - 1 && !p.error ? p.equity : i === close ? lastEquity[p.id] : h.equity,
      cash: p.cash,
      realizedPl: p.realizedPl ?? 0,
    }));
  }
  const subscriptions = Object.fromEntries(bots.map((b) => [b.input.id, subscriptionsOf(b.input)]));
  // The league's 1M metric reads a month return the broker sync writes onto each snapshot
  // (`monthReturnPct`); the world's month of history is that sync's input.
  for (const p of participants) {
    const h = history[p.id];
    if (h?.length > 1 && !p.error)
      p.monthReturnPct = (h[h.length - 1].equity / h[0].equity - 1) * 100;
  }
  return {
    generatedAt: new Date(INSTANT).toISOString(),
    members: input.members,
    participants,
    activity,
    decisions: Object.fromEntries(bots.map((b) => [b.input.id, b.records])),
    // How often each bot checks, when the world declares it (#5223): the week strip's checks
    // between the notable passes above (server-config.mjs).
    cadenceMs: Object.fromEntries(
      bots
        .filter((b) => b.input.cadenceSeconds)
        .map((b) => [b.input.id, b.input.cadenceSeconds * 1000]),
    ),
    // The owner's switchboard as production's controls file holds it (#8005), when the world
    // declares one; absent, the seam stays unwired as in the profile's worlds (server-config.mjs).
    ...(input.controls ? { controls: input.controls } : {}),
    // The per-member stores production always wires, served empty (league-services.mjs).
    ...(input.wired ? { wired: input.wired } : {}),
    // A member's own R&D records (#8005): the stores production keeps them in, and what each member
    // saved before the instant, replayed through the real handlers at compose (member-stores.mjs).
    ...(input.stores ? { stores: input.stores, writes: input.writes ?? [] } : {}),
    subscriptions,
    history,
    lastEquity,
    closedToday,
    market: {
      expirations: input.market?.expirations ?? [],
      symbols,
      ...(input.market?.barDays ? { barDays: input.market.barDays } : {}),
    },
    // What each member watches, keyed by the account their session resolves to (the watchlist
    // route's own key), and each account's working orders — both empty unless the input says.
    watchlists: perAccount(input.watchlists),
    working: perAccount(input.workingOrders),
  };
}

/** An input's account-keyed block without its `$comment`. */
const perAccount = (block = {}) =>
  Object.fromEntries(Object.entries(block).filter(([id]) => !id.startsWith("$")));

/** The world's quoted underlyings: the market input, with spot and previous close taken from a
 *  held share position's mark where one exists (an option's marks derive from these). */
function quotedSymbols(input) {
  const symbols = { ...(input.market?.symbols ?? {}) };
  for (const p of input.participants) {
    for (const pos of p.positions) {
      if (symbols[pos.symbol] && !isOption(pos.symbol)) {
        symbols[pos.symbol] = { spot: pos.mark, prevClose: pos.lastday, ...symbols[pos.symbol] };
      }
    }
  }
  return symbols;
}
