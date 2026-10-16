/**
 * The 50 × $1k book for the dip-to-bounce study (#5489 slice 1): every name's entries run through
 * one shared allocation in time order, with or without the late-recovery rule. Pure — the caller
 * passes walked trades (`dip-bounce-sim.mjs`); this only decides which ones the book could take and
 * what the rule does to them.
 *
 * The rule as the plan writes it, and the reading this sim takes where the plan is open:
 *  - SIGNAL: a name with a tranche at age ≥ 3, or the book with ≥ 30% of its allocation in held
 *    tranches (bought on an earlier day), takes no new buys in that name (for the 30% leg: in any
 *    name already holding a carried tranche).
 *  - GATE: a tranche at age 5 hands off at that day's close (precomputed by the walk); a book with
 *    ≥ 50% held at a close hands off its oldest tranches at that close until it is under 50%.
 *  - WEEKLY: the book down 8% of its allocation over the last 5 sessions takes no new buys until the
 *    next calendar week (the sim's stand-in for "until the owner resets it").
 * `rule`: "full" (all of the above) · "signal" (pauses and the weekly stop, but no hand-off: every
 * tranche keeps its target working) · "off" (buy every entry while a slot is free, hold to target).
 * A hand-off is booked at its close price; what the stock did after is reported separately, since
 * it belongs to the receiving playbook.
 */

const isoWeek = (date) => {
  const d = new Date(`${date}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
};

/** Index each name's bars by `date minutes` and its entries by bar index. */
function indexNames(names) {
  return names.map((n) => {
    const at = new Map(n.flat.map((b, i) => [`${b.date} ${b.minutes}`, i]));
    const byBar = new Map(n.entries.map((e, x) => [e.i, x]));
    return { ...n, at, byBar };
  });
}

const DEFAULTS = {
  rule: "full",
  slots: 50,
  tranche: 1000,
  costBps: 5,
  signalDay: 3,
  signalShare: 0.3,
  gateShare: 0.5,
  weeklyStop: 0.08,
};

/** Run the book. `names`: [{ sym, flat, entries, ruled, open }] — ruled/open are walks per entry. */
export function runBook(names, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const idx = indexNames(names);
  const dates = [...new Set(names.flatMap((n) => n.flat.map((b) => b.date)))].sort();
  const allocation = o.slots * o.tranche;
  const costPct = (2 * o.costBps) / 100;
  const st = { open: [], closed: [], handoffs: [], tied: [], plByDay: [], trips: [], refused: {} };
  let haltWeek = null;

  const book = (t, price, how, date) => {
    const pct = (price / t.entry - 1) * 100 - costPct;
    const row = { ...t, exitPrice: price, how, pct, pl: (o.tranche * pct) / 100, exitDate: date };
    st.closed.push(row);
    if (how !== "target") st.handoffs.push(row);
  };

  dates.forEach((date, day) => {
    const week = isoWeek(date);
    for (let minutes = 570; minutes < 960; minutes += 5) {
      for (const n of idx) {
        const i = n.at.get(`${date} ${minutes}`);
        if (i == null) continue;
        n.mark = n.flat[i].close;
        exitDue(st, n, i, date, book);
        admit(st, n, i, { date, day, week, haltWeek, o });
      }
    }
    gateAtClose(st, idx, day, date, o, allocation, book);
    st.tied.push({ date, share: (st.open.length * o.tranche) / allocation });
    const marks = new Map(idx.map((n) => [n.sym, n.mark]));
    const unreal = st.open.reduce(
      (a, t) => a + o.tranche * (marks.get(t.sym) / t.entry - 1) - (o.tranche * costPct) / 200,
      0,
    );
    const pl = st.closed.reduce((a, t) => a + t.pl, 0) + unreal;
    st.plByDay.push(pl);
    const back = st.plByDay[day - 5];
    if (
      o.rule !== "off" &&
      back != null &&
      pl - back <= -o.weeklyStop * allocation &&
      haltWeek !== week
    ) {
      haltWeek = week;
      st.trips.push({ date, weekPl: pl - back });
    }
  });
  const lastMarks = new Map(idx.map((n) => [n.sym, n.mark]));
  return summarize(st, o, allocation, lastMarks);
}

function exitDue(st, n, i, date, book) {
  // A censored walk ran out of sample: it stays open and is marked at the last close instead.
  const due = (x) => x.sym === n.sym && x.walk.exitAt === i && x.walk.how !== "censored";
  for (const t of st.open.filter(due)) {
    st.open.splice(st.open.indexOf(t), 1);
    book(t, t.walk.exit, t.walk.how, date);
  }
}

function admit(st, n, i, { date, day, week, haltWeek, o }) {
  const x = n.byBar.get(i);
  if (x == null) return;
  const refuse = (why) => {
    st.refused[why] = (st.refused[why] ?? 0) + 1;
  };
  if (st.open.length >= o.slots) return refuse("slots full");
  if (o.rule !== "off" && haltWeek === week) return refuse("weekly stop");
  if (o.rule !== "off") {
    const mine = st.open.filter((t) => t.sym === n.sym);
    if (mine.some((t) => day - t.day >= o.signalDay)) return refuse("day-3 signal");
    const carried = st.open.filter((t) => t.day < day).length;
    const heldShare = (carried * o.tranche) / (o.slots * o.tranche);
    if (heldShare >= o.signalShare && mine.some((t) => t.day < day)) return refuse("30% signal");
  }
  const walk = o.rule === "full" ? n.ruled[x] : n.open[x];
  st.open.push({ sym: n.sym, day, entryDate: date, entry: n.entries[x].price, walk, x });
}

function gateAtClose(st, idx, day, date, o, allocation, book) {
  if (o.rule !== "full") return;
  const oldestFirst = [...st.open].sort((a, b) => a.day - b.day);
  while (st.open.length * o.tranche >= o.gateShare * allocation && oldestFirst.length) {
    const t = oldestFirst.shift();
    st.open.splice(st.open.indexOf(t), 1);
    const n = idx.find((m) => m.sym === t.sym);
    book({ ...t, gated: day - t.day }, n.mark, "gate-50", date);
  }
}

function summarize(st, o, allocation, lastMarks) {
  const sum = (xs) => xs.reduce((a, t) => a + t.pl, 0);
  const shares = st.tied.map((t) => t.share);
  // The account's view: a handed-off tranche is still the member's, now held by the receiver. Marked
  // at the window's last close (the receiver's own rules — a wheel's calls, a floor stop — not modeled).
  const costPct = (2 * o.costBps) / 100;
  const after = st.handoffs.reduce(
    (a, t) => a + (o.tranche * ((lastMarks.get(t.sym) / t.entry - 1) * 100 - costPct)) / 100,
    0,
  );
  const totalPl = st.plByDay.at(-1) ?? 0;
  return {
    trades: st.closed.length + st.open.length,
    targets: st.closed.filter((t) => t.how === "target").length,
    realizedTargets: sum(st.closed.filter((t) => t.how === "target")),
    handedOff: st.handoffs.length,
    handoffPl: sum(st.handoffs),
    stillOpen: st.open.length,
    totalPl,
    totalPct: (100 * totalPl) / allocation,
    handoffAfterPl: after,
    accountPct: (100 * (totalPl - sum(st.handoffs) + after)) / allocation,
    meanTied: shares.reduce((a, b) => a + b, 0) / (shares.length || 1),
    maxTied: Math.max(0, ...shares),
    daysOver30: shares.filter((s) => s >= o.signalShare).length,
    daysOver50: shares.filter((s) => s >= o.gateShare).length,
    sessions: shares.length,
    trips: st.trips,
    refused: st.refused,
    handoffs: st.handoffs,
    open: st.open,
  };
}
