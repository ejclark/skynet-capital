// THE CHANGE ORACLE (#change-scenarios) — grades a simulated member's session by what it did to
// the account, never by what the member said it did.
//
// The study oracle (scripts/study/oracle.mjs) grades a REPORTED FACT: the member names a number and
// the oracle checks it was on screen. A change task has no fact to report; its proof is the paper
// account afterwards. So this oracle reads the account twice — before the member's first tap and
// after their last — and grades the DIFF against the scenario's `end` spec:
//
//   end: {
//     orders:    [ { symbol?, underlying?, optionType?, strike?, expiryDays?, side?, quantity?,
//                    orderType?, limitPrice?, stopPrice?, timeInForce?, state? } ],
//                 // each must match exactly one NEW order; a [lo, hi] pair is a range, a list of
//                 // strings is any-of, anything else must be equal
//     cancelled: [ "<order id>" ],               // these ended cancelled (or replaced)
//     replaced:  [ { id, ...order fields } ],    // this id ended replaced; its successor matches
//     positions: { "<symbol>": <qty after> },    // 0 = gone; a [lo, hi] pair is a range
//     refusal:   true,                           // success is the app refusing: nothing may land
//     noOtherWrites: true                        // default true — see UNINTENDED below
//   }
//
// UNINTENDED: every new order no `orders` entry claimed, every working order that ended cancelled
// or replaced without being named, and every position that moved without being named. These are
// the change-study's safety numbers — a member who sells when they meant to buy, or buys 100 when
// they meant 10, "completed a task" and harmed their book — so they are reported whatever the
// verdict, and `noOtherWrites` (the default) makes any of them fail it.
//
// Pure: the driver (drive.mjs) reads the account; this file only compares. Specced in
// tests/scripts/faculty-oracle.spec.ts.

/** Days from `now` to an ISO date's 4pm New York close, rounded to whole days. */
export function daysUntil(date, now) {
  const close = Date.parse(`${date}T21:00:00Z`);
  return Math.round((close - now.getTime()) / 86_400_000);
}

const OCC = /^([A-Z]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/;

/** One order row (the desk's own shape, app/src/live/orders.ts) with its contract parts spelled out. */
export function describeOrder(row, now) {
  const m = OCC.exec(row.symbol ?? "");
  const base = {
    id: row.id,
    symbol: row.symbol,
    side: row.side,
    quantity: row.quantity,
    orderType: row.orderType,
    limitPrice: row.limitPrice,
    stopPrice: row.stopPrice,
    timeInForce: row.timeInForce,
    state: row.state,
    replaces: row.replaces,
    replacedBy: row.replacedBy,
  };
  if (!m) return { ...base, underlying: row.symbol };
  const expiry = `20${m[2]}-${m[3]}-${m[4]}`;
  return {
    ...base,
    underlying: m[1],
    optionType: m[5] === "C" ? "call" : "put",
    strike: Number(m[6]) / 1000,
    expiry,
    expiryDays: daysUntil(expiry, now),
  };
}

function fits(want, got) {
  if (Array.isArray(want) && want.length === 2 && want.every((x) => typeof x === "number")) {
    return typeof got === "number" && got >= want[0] - 1e-9 && got <= want[1] + 1e-9;
  }
  if (Array.isArray(want)) return want.includes(got);
  if (typeof want === "string" && typeof got === "string")
    return want.toLowerCase() === got.toLowerCase();
  return want === got;
}

const ORDER_KEYS = [
  "symbol",
  "underlying",
  "optionType",
  "strike",
  "expiryDays",
  "side",
  "quantity",
  "orderType",
  "limitPrice",
  "stopPrice",
  "timeInForce",
  "state",
];

/** The fields of `want` that `order` does not satisfy (empty = a match). */
export function misses(want, order) {
  return ORDER_KEYS.filter((k) => want[k] !== undefined && !fits(want[k], order[k]));
}

const ENDED = new Set(["cancelled", "replaced"]);

/**
 * @param {{orders: object[], positions: Record<string, number>}} before
 * @param {{orders: object[], positions: Record<string, number>}} after
 * @param {object} end the scenario's end spec
 * @param {Date} now
 */
export function gradeChange(before, after, end, now) {
  const beforeIds = new Set(before.orders.map((o) => o.id));
  const fresh = after.orders.filter((o) => !beforeIds.has(o.id)).map((o) => describeOrder(o, now));
  const byId = new Map(after.orders.map((o) => [o.id, describeOrder(o, now)]));
  const claimed = new Set();
  const problems = [];

  for (const [i, want] of (end.orders ?? []).entries()) {
    const hit = fresh.find((o) => !claimed.has(o.id) && misses(want, o).length === 0);
    if (hit) {
      claimed.add(hit.id);
      continue;
    }
    const near = fresh
      .filter((o) => !claimed.has(o.id))
      .map((o) => ({ o, miss: misses(want, o) }))
      .sort((a, b) => a.miss.length - b.miss.length)[0];
    problems.push(
      near
        ? `order ${i + 1}: the closest new order (${label(near.o)}) is wrong on ${near.miss.join(", ")}`
        : `order ${i + 1}: no new order was placed`,
    );
  }

  const named = new Set([...(end.cancelled ?? []), ...(end.replaced ?? []).map((r) => r.id)]);
  for (const id of end.cancelled ?? []) {
    const row = byId.get(id);
    if (!(row && ENDED.has(row.state)))
      problems.push(`order ${id} was meant to end cancelled; it is ${row?.state ?? "gone"}`);
  }
  for (const want of end.replaced ?? []) {
    const old = byId.get(want.id);
    if (old?.state !== "replaced") {
      problems.push(
        `order ${want.id} was meant to be changed in place; it is ${old?.state ?? "gone"}`,
      );
      continue;
    }
    const next = fresh.find((o) => o.replaces === want.id);
    if (!next) {
      problems.push(`order ${want.id} was replaced but its successor is missing`);
      continue;
    }
    claimed.add(next.id);
    const miss = misses(want, next);
    if (miss.length > 0)
      problems.push(`the changed order (${label(next)}) is wrong on ${miss.join(", ")}`);
  }

  for (const symbol of end.watchlist?.includes ?? []) {
    if (!(after.watchlist ?? []).includes(symbol))
      problems.push(`the watchlist does not hold ${symbol}`);
  }
  for (const symbol of end.watchlist?.excludes ?? []) {
    if ((after.watchlist ?? []).includes(symbol))
      problems.push(`the watchlist still holds ${symbol}`);
  }

  for (const [symbol, want] of Object.entries(end.positions ?? {})) {
    const got = after.positions[symbol] ?? 0;
    if (!fits(want, got))
      problems.push(`position ${symbol} is ${got}, wanted ${JSON.stringify(want)}`);
  }

  // A fresh order the member then changed in place is a superseded link of the same intent, not a
  // second order: it ends `replaced` and a fresh successor names it (round 2, PM-01 — a $15 sell
  // sent for the day, then changed to good-til-cancelled, read as an "unasked" sale).
  const superseded = new Set(
    fresh
      .filter((o) => o.state === "replaced" && fresh.some((n) => n.replaces === o.id))
      .map((o) => o.id),
  );
  const unintended = [];
  for (const o of fresh) {
    if (!(claimed.has(o.id) || superseded.has(o.id))) unintended.push(`unasked order: ${label(o)}`);
  }
  for (const o of before.orders) {
    const now_ = byId.get(o.id);
    if (o.state === "working" && now_ && ENDED.has(now_.state) && !named.has(o.id)) {
      unintended.push(`working order ${label(describeOrder(o, now))} ended ${now_.state}`);
    }
  }
  const touched = new Set([...Object.keys(end.positions ?? {}), ...expectedSymbols(end)]);
  for (const symbol of new Set([
    ...Object.keys(before.positions),
    ...Object.keys(after.positions),
  ])) {
    const a = before.positions[symbol] ?? 0;
    const b = after.positions[symbol] ?? 0;
    if (a !== b && !touched.has(symbol) && !touchedByClaim(symbol, fresh, claimed)) {
      unintended.push(`position ${symbol} moved ${a} → ${b}`);
    }
  }

  if (end.refusal) {
    const landed = fresh.length > 0;
    return {
      success: !landed && unintended.length === 0,
      reason: landed
        ? "the app let an order through that it should have refused"
        : "nothing landed",
      problems: landed ? [`${fresh.length} order(s) landed`] : [],
      unintended,
      newOrders: fresh.map(label),
    };
  }
  const strict = end.noOtherWrites !== false;
  const success = problems.length === 0 && (!strict || unintended.length === 0);
  return {
    success,
    reason: success
      ? "the account ended as the scenario asked"
      : [...problems, ...(strict ? unintended : [])][0],
    problems,
    unintended,
    newOrders: fresh.map(label),
  };
}

function expectedSymbols(end) {
  return (end.orders ?? []).flatMap((o) => [o.symbol, o.underlying].filter(Boolean));
}

function touchedByClaim(symbol, fresh, claimed) {
  return fresh.some((o) => claimed.has(o.id) && (o.symbol === symbol || o.underlying === symbol));
}

/** An order in words — what the readout and the problems list print. */
export function label(o) {
  const what = o.optionType ? `${o.underlying} $${o.strike} ${o.optionType} ${o.expiry}` : o.symbol;
  const price =
    o.limitPrice !== undefined
      ? ` @ ${o.limitPrice}`
      : o.stopPrice !== undefined
        ? ` stop ${o.stopPrice}`
        : "";
  return `${o.side} ${o.quantity} ${what} ${o.orderType}${price} ${o.timeInForce ?? ""} [${o.state}]`
    .replace(/\s+/g, " ")
    .trim();
}
