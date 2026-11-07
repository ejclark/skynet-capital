// "Decisions reaching Eric" — the weekly numbers of #6953 section 5, each beside last week's value.
//
// Eric, 2026-11-06: "i don't like how i have to chase down this information. I would prefer piping
// these decisions back to me in a way that provides context, or better yet chip away at the need
// for human in the loop." Slices 2 and 3 changed how an ask reaches him; this file is how we know
// whether they worked. The first measure is the one to watch (the open asks that need him); the
// rest explain why it moved or did not.
//
// PURE, like the rest of the newsletter's numbers: build.mjs hands in what gather.mjs and
// decision-reads.mjs collected, and the same inputs give the same object. The honesty rule is the
// meter's: what could not be read is null, never 0 — a 0 here is the best number on the page.
//
// LAST WEEK'S VALUE comes from the series on `data/newsletter` (series.mjs), which stores every
// week's `metrics` — so this object, once stored, is next week's comparison. A week with no entry
// reads `lastWeek: null`, said as "no reading", never as zero.

const DAY = 864e5;
const HOUR = 36e5;
/** ALIGNMENT rule 3: three matches in a row, and no miss in the class's last five decided rows. */
const STREAK_TO_GRADUATE = 3;
const RECENT = 5;
/** repair.mjs's REOPEN_DAYS: a capsule closed this recently owns its signature. */
const REFILE_DAYS = 14;
/** askRank's class for an ask between watching bots and bots that place paper orders. */
const BOT_RANK = 2;

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const round1 = (x) => (x === null ? null : Math.round(x * 10) / 10);
const ratio = (num, den) => (den > 0 ? Number((num / den).toFixed(2)) : null);
const within = (ms, w) => ms >= w.sinceMs && ms < w.untilMs;
const isList = Array.isArray;

/** Section 5's rows, in its order; `target` is the 2026-12-04 target, in its words. */
export const MEASURES = [
  ["openAsks", "Open asks that need him", "5 or fewer, all genuinely his"],
  ["unseen", "Asks no list can see", "0"],
  ["artifactMissing", "Asks whose artifact is missing or cannot merge as it stands", "0"],
  ["answeredShare", "Share of closed needs-eric labels he answered", "0.8 or more"],
  ["hoursToAnswer", "Median hours from ask to his answer", "under 24"],
  ["hoursAssignToAnswer", "Median hours from assignment to his answer", "under 48 (falsifier)"],
  ["refiled", "The same question filed under a new number", "0"],
  ["predictedShare", "Share of open asks with a prediction recorded", "1"],
  ["ledgerMatchRate", "Ledger match rate", "rising"],
  ["ledgerBestStreak", "Ledger best streak", "3 (a class graduates)"],
  ["ledgerReady", "Ledger classes ready to graduate", "bot safety rules proposed"],
  [
    "oldestBotAskDays",
    "Days the oldest ask between watching and trading bots has waited",
    "7 or less",
  ],
].map(([id, label, target]) => ({ id, label, target }));

/** A ledger score cell, reduced to match · miss · other (unclear, pending, unscored). */
const scoreOf = (cell) => {
  const s = String(cell ?? "")
    .replace(/<!--.*?-->/g, "")
    .trim()
    .toLowerCase();
  if (/^match\b/.test(s)) return "match";
  if (/^miss\b/.test(s)) return "miss";
  return "other";
};

/**
 * The ledger's table in docs/process/ALIGNMENT.md, rows dated before `untilDay` only, so a past
 * week reads as it stood. Match rate over decided rows (match + miss); the best streak is the
 * longest run of matches inside one class in table order, `unclear` and `pending` skipped (rule 2:
 * an unclear ask is not a miss); a class is ready to graduate under rule 3. Pure.
 */
/** The Ledger table's rows dated before `untilDay`, as `{date, cls, score}`; `null` with no table. */
function ledgerRows(md, untilDay) {
  const at = md.search(/^##\s+Ledger\b/m);
  if (at === -1) return null;
  const rows = [];
  for (const line of md.slice(at).split("\n").slice(1)) {
    if (/^##\s/.test(line)) break;
    const cells = line.split(/(?<!\\)\|/).map((c) => c.trim());
    if (cells.length < 8 || !/^\d{4}-\d\d-\d\d$/.test(cells[1])) continue;
    if (!untilDay || cells[1] < untilDay)
      rows.push({ date: cells[1], cls: cells[2], score: scoreOf(cells[6]) });
  }
  return rows;
}

export function ledgerStats(md, untilDay) {
  if (typeof md !== "string") return null;
  const rows = ledgerRows(md, untilDay);
  if (!rows) return null;
  const decided = rows.filter((r) => r.score !== "other");
  const byClass = new Map();
  for (const r of decided) byClass.set(r.cls, [...(byClass.get(r.cls) ?? []), r.score]);
  let best = 0;
  const ready = [];
  for (const [cls, scores] of byClass) {
    let run = 0;
    for (const s of scores) {
      run = s === "match" ? run + 1 : 0;
      best = Math.max(best, run);
    }
    if (run >= STREAK_TO_GRADUATE && !scores.slice(-RECENT).includes("miss")) ready.push(cls);
  }
  const matches = decided.filter((r) => r.score === "match").length;
  return {
    rows: rows.length,
    decided: decided.length,
    matches,
    matchRate: ratio(matches, decided.length),
    bestStreak: best,
    ready: ready.sort(),
  };
}

/**
 * The `needs-eric` labels that came off inside the week: how many he answered, and how long his
 * answer took — from the label, and from the assignment card when one went out. Each episode is
 * `{number, labeledAt, unlabeledAt, answeredAt, assignedAt}` (decision-reads.mjs). Pure.
 */
export function labelEpisodes(episodes, w) {
  if (!isList(episodes)) return null;
  const closed = episodes.filter((e) => within(Date.parse(e.unlabeledAt), w));
  const answered = closed.filter((e) => e.answeredAt);
  const hours = (from, to) => (Date.parse(to) - Date.parse(from)) / HOUR;
  const fromAsk = answered.filter((e) => e.labeledAt).map((e) => hours(e.labeledAt, e.answeredAt));
  const fromCard = answered
    .filter((e) => e.assignedAt && e.assignedAt <= e.answeredAt)
    .map((e) => hours(e.assignedAt, e.answeredAt));
  return {
    closed: closed.length,
    answered: answered.length,
    share: ratio(answered.length, closed.length),
    hoursToAnswer: round1(median(fromAsk)),
    hoursAssignToAnswer: round1(median(fromCard)),
    answeredItems: answered.map((e) => e.number).sort((a, b) => a - b),
  };
}

/**
 * CI capsules filed in the week whose title — repair.mjs's signature — another capsule still owned
 * when it was filed: open then, or closed within `REFILE_DAYS` before (repair.mjs's own rule, by
 * close date). The same question under a new number. Since slice 2 a returning fault reopens its
 * capsule, so this should read 0. Pure.
 */
export function refiled(capsules, w) {
  if (!isList(capsules)) return null;
  const owned = (o, at) => {
    const created = Date.parse(o.createdAt);
    if (!(created < at)) return false;
    const closed = o.closedAt ? Date.parse(o.closedAt) : null;
    return closed === null || closed >= at || at - closed <= REFILE_DAYS * DAY;
  };
  const items = [];
  for (const c of capsules) {
    const at = Date.parse(c.createdAt);
    if (!within(at, w)) continue;
    const prior = capsules
      .filter((o) => o.number !== c.number && o.title === c.title && owned(o, at))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    if (prior) items.push({ number: c.number, sameAs: prior.number });
  }
  return { count: items.length, items: items.sort((a, b) => a.number - b.number) };
}

/** The oldest open `needs-eric` ask ranked between watching and trading bots, by label age. Pure. */
export function oldestBotAsk(rows, asOfMs) {
  // Rows read before ranks were kept cannot say; an empty list is the best case, read as 0.
  if (!isList(rows) || (rows.length && !rows.some((r) => "rank" in r))) return null;
  const aged = rows
    .filter((r) => r.rank === BOT_RANK && r.labeledAt)
    .map((r) => ({ number: r.number, days: round1((asOfMs - Date.parse(r.labeledAt)) / DAY) }))
    .sort((a, b) => b.days - a.days);
  return { days: aged[0]?.days ?? 0, number: aged[0]?.number ?? null, count: aged.length };
}

/** Last week's value per measure id, from the series; `null` when there is no reading. Pure. */
export function lastWeekValues(series, priorWeek) {
  if (!isList(series)) return null;
  const entry = series.find((e) => e?.week === priorWeek);
  const measures = entry?.metrics?.decisions?.measures;
  if (!isList(measures)) return {};
  return Object.fromEntries(measures.map((m) => [m.id, m.value ?? null]));
}

/** Value and detail per measure from the snapshot read now; nulls when it could not be read. */
function fromSnapshot(snap) {
  if (!snap) return { value: {}, detail: {} };
  const asked = `${snap.predicted.length} of ${snap.asks.length}`;
  return {
    value: {
      openAsks: snap.needsYou.length,
      unseen: snap.unseen ? snap.unseen.length : null,
      artifactMissing: snap.artifactGaps.length,
      predictedShare: ratio(snap.predicted.length, snap.asks.length),
    },
    detail: {
      openAsks: snap.needsYou.map((n) => n.number),
      unseen: snap.unseen,
      artifactMissing: snap.artifactGaps,
      predictedShare: asked,
    },
  };
}

/** Value and detail per measure from the week's history: labels, capsules, ledger, bot asks. */
function fromHistory({ eps, re, led, bot }) {
  const value = {};
  const detail = {};
  if (eps) {
    Object.assign(value, {
      answeredShare: eps.share,
      hoursToAnswer: eps.hoursToAnswer,
      hoursAssignToAnswer: eps.hoursAssignToAnswer,
    });
    Object.assign(detail, {
      answeredShare: `${eps.answered} of ${eps.closed}`,
      hoursToAnswer: eps.answeredItems,
    });
  }
  if (re) {
    value.refiled = re.count;
    detail.refiled = re.items;
  }
  if (led) {
    Object.assign(value, {
      ledgerMatchRate: led.matchRate,
      ledgerBestStreak: led.bestStreak,
      ledgerReady: led.ready.length,
    });
    Object.assign(detail, {
      ledgerMatchRate: `${led.matches} of ${led.decided} decided rows`,
      ledgerReady: led.ready,
    });
  }
  if (bot) {
    value.oldestBotAskDays = bot.days;
    detail.oldestBotAskDays = bot.number ? `#${bot.number}, ${bot.count} open` : "none open";
  }
  return { value, detail };
}

/** Which inputs arrived as a failed read's words, and what they said. */
function unreadOf({ snapshot, episodes, capsules, ledger, series }, led) {
  const words = (x) => (typeof x === "string" ? x : null);
  const ledgerWhy = words(ledger) ?? (ledger && !led ? "no Ledger table" : null);
  return Object.fromEntries(
    [
      ["snapshot", words(snapshot)],
      ["unseen", snapshot && typeof snapshot === "object" ? (snapshot.unseenUnread ?? null) : null],
      ["episodes", words(episodes)],
      ["capsules", words(capsules)],
      ["ledger", ledgerWhy],
      ["series", words(series)],
    ].filter(([, v]) => v),
  );
}

/**
 * The section-5 report: every measure in MEASURES' order, its value beside last week's. `ledger` is
 * `{ text }`, ALIGNMENT.md as read; `snapshot` is the read made now (plan().needsYou, the unseen
 * scan, the artifact gaps, the predictions), or the words saying why it cannot stand for the week.
 */
export function decisionsReport(inputs, ctx) {
  const { snapshot, episodes, capsules, ledger, needsEric, series } = inputs;
  const { w, asOfMs, priorWeek } = ctx;
  // A partial week stops at its asOf day, as plan Log lines do; a whole week at its end.
  const cut = w.partial
    ? new Date(Date.parse(w.until.slice(0, 10)) + DAY).toISOString().slice(0, 10)
    : w.end;
  const led = ledger && typeof ledger === "object" ? ledgerStats(ledger.text, cut) : null;
  const snap = fromSnapshot(snapshot && typeof snapshot === "object" ? snapshot : null);
  const hist = fromHistory({
    eps: labelEpisodes(episodes, w),
    re: refiled(capsules, w),
    led,
    bot: oldestBotAsk(needsEric, asOfMs),
  });
  const value = { ...snap.value, ...hist.value };
  const detail = { ...snap.detail, ...hist.detail };
  const last = lastWeekValues(series, priorWeek);
  return {
    measures: MEASURES.map((m) => ({
      ...m,
      value: value[m.id] ?? null,
      lastWeek: last ? (last[m.id] ?? null) : null,
      ...(detail[m.id] == null ? {} : { detail: detail[m.id] }),
    })),
    unread: unreadOf(inputs, led),
  };
}
