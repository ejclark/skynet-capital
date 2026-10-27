#!/usr/bin/env node
/**
 * TACO backtest, the original trade — what SPY and QQQ do after Trump threatens a tariff and after he
 * backs down, and how much of that move a reader who sees the post late can still reach (#4820,
 * slice 1b).
 *
 *   node scripts/research/taco-index.mjs candidates   # tariff-flavoured posts → batches to label
 *   node scripts/research/taco-index.mjs merge        # batches' labels → docs/research/taco-index-labels.json
 *                                                     # (then `npx biome format --write` that file)
 *   node scripts/research/taco-index.mjs              # the study, from the committed labels
 *   node scripts/research/taco-index.mjs --events     # one row per event, for auditing
 *
 * THE QUESTION. "TACO" (Trump Always Chickens Out, Robert Armstrong, FT, 2025-05-02) is a different
 * trade from slice 1's company posts: a threat against a country sells the index off, he backs down,
 * it rebounds over DAYS. Slice 1 refused company posts because the move was gone by the next hourly
 * bar. A days-long move might still be there for a minutes-late reader — this run measures it.
 *
 * METHOD, IN ONE PASS.
 *   1. Corpus: `taco-common.mjs` — CNN's Truth Social archive, original posts, 2023-11 onward.
 *   2. Prefilter: posts that mention a tariff, duty, trade war, reciprocal rate or trade deal.
 *   3. Labels: a cheap-model pass decided, from the text alone and never from prices, whether the post
 *      is a THREAT (new or higher penalty on a named target), a CLIMB-DOWN (delay, cut, exemption,
 *      extension, a deal that lowers a rate) or OTHER (boasting, defending, restating). Committed as
 *      `docs/research/taco-index-labels.json` so the study re-runs without a model.
 *   4. Events: one per kind per cluster window (24 h; also 7 days as a robustness view).
 *   5. Prices: Yahoo 60-minute bars (pre/post-market included) for SPY and QQQ. Entry at the open of
 *      the first bar after the post, or the first regular-hours bar. Exits: that bar's close, the
 *      session close, and 1, 3 and 5 sessions later. Returns are signed: a threat expects a selloff
 *      (ride = short), a climb-down expects a rally (ride = long). The fade is the sign flipped.
 *   6. Drift: the same exits from every bar in the sample's span; each cell's t is on the return net
 *      of that average drift, so a rising market does not pass for a signal.
 *
 * Offline research tooling: no broker credential, touches no trading path, places nothing.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  barAt,
  bonferroni,
  bp,
  CACHE,
  etClock,
  hourly,
  pct,
  posts,
  sessionClose,
  summary,
} from "./taco-common.mjs";

const LABELS = join(process.cwd(), "docs", "research", "taco-index-labels.json");
const BATCHES = join(CACHE, "index-batches");
const STUDY_FROM = "2023-11-07";
const SYMBOLS = ["SPY", "QQQ"];
const KINDS = ["threat", "climbdown"];
/** What each kind expects the index to do: +1 up, −1 down. The fade is the opposite sign. */
const DIRECTION = { threat: -1, climbdown: 1 };
/** Below this many events a cell is printed but never called. */
const MIN_N = 15;
/** Round-trip cost of an index ETF, bp: the bar the plan's falsifier sets. */
const COST_BP = 10;
/** A label below this confidence is not an event. */
const MIN_CONFIDENCE = 0.6;
const DAY_MS = 86_400_000;
const CLUSTER_MS = { "24 h": DAY_MS, "7 days": 7 * DAY_MS };
/** The 2025-04-09 90-day pause: one post, the largest single-day index gain in the sample. */
const BIG_PAUSE = "2025-04-09";
/** The pairing of a climb-down with the threat it answers: same target, at most this far back. */
const PAIR_WINDOW_MS = 45 * DAY_MS;

const TARIFF_WORDS =
  /tariff|\bduties\b|trade war|reciprocal|trade (deal|agreement|truce)|\btruce\b|\bembargo/i;
/**
 * A climb-down often never says "tariff" ("a total reset negotiated", "Don't worry about China"), so a
 * post that pairs a stepping-back word with a trade partner is a candidate too.
 */
const STEP_BACK_WORDS =
  /\b(paus(e|ed|ing)|postpon\w*|delay(ed|ing)?|extension|extend(ed|ing)?|reset|framework|trade (talks|negotiation\w*)|deal|worry)\b/i;
const PARTNER_WORDS =
  /\b(China|Chinese|Xi|Canada|Canadian|Mexico|Mexican|EU|European Union|Europe|India|Modi|Japan|Korea|Brazil|Switzerland|Vietnam|Taiwan|BRICS|Britain|UK)\b/;

const isCandidate = (text) =>
  TARIFF_WORDS.test(text) || (STEP_BACK_WORDS.test(text) && PARTNER_WORDS.test(text));

function excerpt(text) {
  const at = text.search(TARIFF_WORDS);
  return `${text.slice(0, 500)} … ${text.slice(Math.max(500, at - 400), at + 600)}`;
}

/** Posts not yet in the labels file, in batches of 50 numbered after any that already exist: resumable. */
async function candidates() {
  const all = await posts(STUDY_FROM);
  const done = new Set(
    existsSync(LABELS) ? JSON.parse(readFileSync(LABELS, "utf8")).map((l) => l.id) : [],
  );
  const hits = all.filter((p) => isCandidate(p.text) && !done.has(p.id));
  mkdirSync(BATCHES, { recursive: true });
  const first = readdirSync(BATCHES).filter((n) => /^batch-\d+\.json$/.test(n)).length;
  const size = 50;
  for (let b = 0; b * size < hits.length; b++) {
    const batch = hits.slice(b * size, (b + 1) * size).map((p) => ({
      id: p.id,
      at: p.at,
      text: p.text.length <= 1500 ? p.text : excerpt(p.text),
    }));
    writeFileSync(
      join(BATCHES, `batch-${String(first + b).padStart(2, "0")}.json`),
      JSON.stringify(batch, null, 1),
    );
  }
  console.log(`${all.length} original posts → ${hits.length} unlabelled candidates → ${BATCHES}`);
}

/**
 * Folds `batch-NN.labels.json` (one array per batch, written by the labeller) into the committed file.
 * A label already in the file wins, so a hand correction (`by: "hand"`) survives a re-merge.
 */
function merge() {
  const out = existsSync(LABELS) ? JSON.parse(readFileSync(LABELS, "utf8")) : [];
  const have = new Set(out.map((l) => l.id));
  for (const f of readdirSync(BATCHES)
    .filter((n) => n.endsWith(".labels.json"))
    .sort()) {
    for (const l of JSON.parse(readFileSync(join(BATCHES, f), "utf8"))) {
      if (!have.has(l.id)) out.push(l);
    }
  }
  out.sort((a, b) => (a.at < b.at ? -1 : 1));
  writeFileSync(LABELS, `${JSON.stringify(out, null, 1)}\n`);
  const count = (k) => out.filter((l) => l.kind === k).length;
  console.log(
    `${out.length} labels → ${LABELS} (threat ${count("threat")} · climbdown ${count("climbdown")} · other ${count("other")})`,
  );
}

// ── events ─────────────────────────────────────────────────────────────────────────────────────

/** Threat and climb-down events, the first of each kind per `clusterMs`; a restated post is one story. */
function events(clusterMs) {
  const labels = JSON.parse(readFileSync(LABELS, "utf8"));
  const kept = labels
    .filter((l) => KINDS.includes(l.kind) && l.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => (a.at < b.at ? -1 : 1));
  const last = new Map();
  const out = [];
  for (const l of kept) {
    const ms = Date.parse(l.at);
    const prev = last.get(l.kind);
    if (prev !== undefined && ms - prev < clusterMs) continue;
    last.set(l.kind, ms);
    out.push({ ...l, ms, direction: DIRECTION[l.kind] });
  }
  return { labelled: labels.length, events: out };
}

// ── prices ─────────────────────────────────────────────────────────────────────────────────────

const ENTRIES = { next: "next bar (0–60 min late)", regular: "regular hours only" };
const EXITS = ["1 bar", "close", "+1 session", "+3 sessions", "+5 sessions"];

/** Bar index of each exit for a trade entered at the open of bar `e`; -1 past the data. */
function exitBars(bars, e) {
  const at = (n) => sessionClose(bars, e, n);
  return {
    "1 bar": e,
    close: at(0),
    "+1 session": at(1),
    "+3 sessions": at(3),
    "+5 sessions": at(5),
  };
}

/** Raw return from the entry bar's open to each exit's close. */
function rawReturns(bars, e) {
  const out = {};
  for (const [name, x] of Object.entries(exitBars(bars, e))) {
    if (x >= e) out[name] = bars[x].close / bars[e].open - 1;
  }
  return out;
}

function entryBar(bars, ms, entry) {
  const at = barAt(bars, ms);
  if (at < 0) return -1;
  let e = at + 1;
  if (entry === "regular") while (e < bars.length && !bars[e].regular) e++;
  return e < bars.length ? e : -1;
}

/** The index's average return and win rate from every bar's open to each exit, within the events' span. */
function drift(bars, fromMs, toMs) {
  const sums = Object.fromEntries(EXITS.map((x) => [x, { sum: 0, wins: 0, n: 0 }]));
  for (let e = 0; e < bars.length; e++) {
    if (bars[e].t < fromMs || bars[e].t > toMs) continue;
    for (const [name, r] of Object.entries(rawReturns(bars, e))) {
      sums[name].sum += r;
      sums[name].wins += r > 0 ? 1 : 0;
      sums[name].n++;
    }
  }
  const per = (f) => Object.fromEntries(EXITS.map((x) => [x, sums[x].n ? f(sums[x]) : 0]));
  return { mean: per((c) => c.sum / c.n), win: per((c) => c.wins / c.n) };
}

/** What the index did from just before the post to the entry bar's open: the move we could not catch. */
function jumpOf(bars, ms, e) {
  const at = barAt(bars, ms);
  const inside = ms < bars[at].t + 3_600_000 && etClock(ms).date === bars[at].date;
  return bars[e].open / bars[at][inside ? "open" : "close"] - 1;
}

/** One event under one entry rule on one index: the jump we missed, each exit signed, and net of drift. */
function pricedRow(ev, symbol, bars, avgDrift, entry) {
  const e = entryBar(bars, ev.ms, entry);
  if (e < 0 || ev.ms < bars[0].t) return undefined;
  const raw = rawReturns(bars, e);
  const row = { ...ev, symbol, entry, jump: ev.direction * jumpOf(bars, ev.ms, e) };
  for (const x of Object.keys(raw)) {
    row[x] = ev.direction * raw[x];
    // The same return net of the average drift, signed: the part the post is responsible for.
    row[`${x} net`] = ev.direction * (raw[x] - avgDrift[x]);
  }
  return row;
}

async function priceAll(evs) {
  const rows = [];
  const bySymbol = {};
  const span = [evs[0].ms - 30 * DAY_MS, evs[evs.length - 1].ms];
  for (const symbol of SYMBOLS) {
    const bars = await hourly(symbol);
    bySymbol[symbol] = { bars, drift: drift(bars, ...span) };
    for (const ev of evs) {
      for (const entry of Object.keys(ENTRIES)) {
        const row = pricedRow(ev, symbol, bars, bySymbol[symbol].drift.mean, entry);
        if (row) rows.push(row);
      }
    }
  }
  return { rows, bySymbol };
}

// ── printing ───────────────────────────────────────────────────────────────────────────────────

const GROUPS = [
  { name: "threat", has: (r) => r.kind === "threat" },
  { name: "climb-down", has: (r) => r.kind === "climbdown" },
  // The one post that carries most of the climb-down means: SPY +10% that day (#4820 slice 1b).
  {
    name: "climb-down, less the 2025-04-09 pause",
    has: (r) => r.kind === "climbdown" && !r.at.startsWith(BIG_PAUSE),
  },
];

/** A cell: mean · median · win% · t (n); mean is what a paper account earned, t is net of drift. */
function cell(sel, x) {
  const xs = sel.map((r) => r[x]).filter((v) => v !== undefined);
  const net = sel.map((r) => r[`${x} net`]).filter((v) => v !== undefined);
  const s = summary(xs);
  if (!s.n) return { text: "—", n: 0 };
  const t = summary(net).t;
  const flag = s.n < MIN_N ? " ·thin" : "";
  return {
    text: `${bp(s.mean)} · ${bp(s.median)} · ${pct(s.win)} · ${t.toFixed(1)} (${s.n})${flag}`,
    n: s.n,
    mean: s.mean * 10_000,
    t,
  };
}

/** One table per symbol per entry rule; returns every non-empty cell, for the call and the correction. */
function printRide(rows, label) {
  const cells = [];
  for (const symbol of SYMBOLS) {
    for (const entry of Object.keys(ENTRIES)) {
      console.log(`\n## ${label} · ${symbol} · entry: ${ENTRIES[entry]} — riding the post, bp\n`);
      console.log(
        "Each cell: mean · median · win% · t net of drift (n). Fading is the mean with its sign flipped.\n",
      );
      console.log(`| kind | ${EXITS.join(" | ")} |`);
      console.log(`|---|${EXITS.map(() => "---").join("|")}|`);
      for (const g of GROUPS) {
        const sel = rows.filter((r) => r.symbol === symbol && r.entry === entry && g.has(r));
        const out = EXITS.map((x) => {
          const c = cell(sel, x);
          if (c.n) cells.push({ ...c, symbol, entry, kind: g.name, exit: x });
          return c.text;
        });
        console.log(`| ${g.name} | ${out.join(" | ")} |`);
      }
    }
  }
  return cells;
}

function printSample({ labelled, evs24, evs7, bySymbol }) {
  const count = (evs, k) => evs.filter((e) => e.kind === k).length;
  console.log("## Sample\n");
  console.log(`- ${labelled} tariff-flavoured posts labelled.`);
  console.log(
    `- Events, first of each kind per 24 h: threat ${count(evs24, "threat")} · climb-down ${count(evs24, "climbdown")}; per 7 days: threat ${count(evs7, "threat")} · climb-down ${count(evs7, "climbdown")}.`,
  );
  console.log(`- Span: ${evs24[0].at.slice(0, 10)} → ${evs24[evs24.length - 1].at.slice(0, 10)}.`);
  for (const symbol of SYMBOLS) {
    const d = bySymbol[symbol].drift;
    console.log(
      `- ${symbol} from any bar's open in that span, mean bp (and how often it was up): ${EXITS.map((x) => `${x} ${bp(d.mean[x])} (${pct(d.win[x])})`).join(" · ")}.`,
    );
  }
  console.log("");
}

function printJump(rows) {
  console.log("## The move we cannot catch (before the post → entry bar's open), signed, bp\n");
  console.log("| kind | symbol | n | median | went the post's way |");
  console.log("|---|---|---|---|---|");
  for (const g of GROUPS) {
    for (const symbol of SYMBOLS) {
      const s = summary(
        rows
          .filter((r) => r.symbol === symbol && r.entry === "next" && g.has(r))
          .map((r) => r.jump),
      );
      if (s.n) console.log(`| ${g.name} | ${symbol} | ${s.n} | ${bp(s.median)} | ${pct(s.win)} |`);
    }
  }
}

/** The same country, bloc or sector, by the label's own name for it. */
function sameTarget(a, b) {
  const [x, y] = [a, b].map((v) => String(v ?? "").toLowerCase());
  return x === y;
}

/**
 * The original TACO sequence: each climb-down paired with the latest unanswered threat on the same
 * target. What the index did between the two, and how long the threat stood.
 */
function printPairs(evs, bySymbol) {
  const pairs = [];
  const open = [];
  for (const ev of evs) {
    if (ev.kind === "threat") open.push(ev);
    else {
      const i = open.findLastIndex(
        (t) => ev.ms - t.ms <= PAIR_WINDOW_MS && sameTarget(t.target, ev.target),
      );
      if (i >= 0) pairs.push({ threat: open.splice(i, 1)[0], down: ev });
    }
  }
  console.log("\n## Threat → climb-down pairs (same target, within 45 days)\n");
  if (!pairs.length) {
    console.log("None.");
    return;
  }
  const gap = pairs.map((p) => (p.down.ms - p.threat.ms) / DAY_MS).sort((a, b) => a - b);
  console.log(
    `${pairs.length} pairs; the threat stood a median ${gap[gap.length >> 1].toFixed(1)} days (min ${gap[0].toFixed(1)}, max ${gap[gap.length - 1].toFixed(1)}).\n`,
  );
  console.log("| symbol | n | threat entry → climb-down post, mean bp | median | index fell in |");
  console.log("|---|---|---|---|---|");
  for (const symbol of SYMBOLS) {
    const { bars } = bySymbol[symbol];
    const moves = pairs
      .map((p) => {
        const a = entryBar(bars, p.threat.ms, "next");
        const b = barAt(bars, p.down.ms);
        return a < 0 || b <= a ? undefined : bars[b].open / bars[a].open - 1;
      })
      .filter((m) => m !== undefined);
    const s = summary(moves);
    if (s.n) {
      const fell = moves.filter((m) => m < 0).length;
      console.log(`| ${symbol} | ${s.n} | ${bp(s.mean)} | ${bp(s.median)} | ${fell} of ${s.n} |`);
    }
  }
  console.log("");
  for (const p of pairs) {
    console.log(
      `- ${p.threat.at.slice(0, 10)} → ${p.down.at.slice(0, 10)} · ${p.threat.target ?? "?"} · ${p.threat.reason} → ${p.down.reason}`,
    );
  }
}

function printEvents(rows) {
  for (const r of rows.filter((x) => x.symbol === "SPY" && x.entry === "next")) {
    console.log(
      [
        r.at.slice(0, 16),
        r.kind,
        r.target ?? "?",
        `jump ${bp(r.jump)}`,
        ...EXITS.map((x) => `${x} ${bp(r[x])}`),
        r.reason ?? "",
      ].join(" | "),
    );
  }
}

/** Which cells clear the plan's bar: mean above round-trip cost, t ≥ 2 net of drift, n ≥ MIN_N. */
function printVerdict(cells) {
  const looks = cells.length;
  const strict = bonferroni(looks);
  const passes = cells.filter(
    (c) => c.n >= MIN_N && Math.abs(c.mean) > COST_BP && Math.abs(c.t) >= 2,
  );
  console.log(
    `\n${looks} cells above. With that many looks, a |t| near 2 turns up by chance a few times; only |t| ≥ ${strict.toFixed(1)} survives a Bonferroni correction at 5%.`,
  );
  console.log(
    `\n## Cells that clear ${COST_BP} bp, |t| ≥ 2 and n ≥ ${MIN_N} (${passes.length} of ${looks})\n`,
  );
  if (!passes.length) console.log("None.");
  for (const c of passes) {
    const side = c.mean > 0 ? "riding" : "fading";
    console.log(
      `- ${c.symbol} · ${c.kind} · ${ENTRIES[c.entry]} · to ${c.exit}: ${side} earns ${bp(Math.abs(c.mean) / 10_000)} bp gross, riding's t ${c.t.toFixed(1)} (n ${c.n})${Math.abs(c.t) >= strict ? " — survives Bonferroni" : ""}`,
    );
  }
}

async function study(showEvents) {
  const e24 = events(CLUSTER_MS["24 h"]);
  const e7 = events(CLUSTER_MS["7 days"]);
  const { rows, bySymbol } = await priceAll(e24.events);
  if (showEvents) {
    printEvents(rows);
    return;
  }
  const rows7 = (await priceAll(e7.events)).rows;
  printSample({ labelled: e24.labelled, evs24: e24.events, evs7: e7.events, bySymbol });
  printJump(rows);
  const cells = printRide(rows, "First of each kind per 24 h");
  // Every table counts toward the correction and the verdict, the robustness view included.
  cells.push(...printRide(rows7, "First of each kind per 7 days (windows do not overlap)"));
  printPairs(e24.events, bySymbol);
  printVerdict(cells);
}

const [stage] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (stage === "candidates") await candidates();
else if (stage === "merge") merge();
else await study(process.argv.includes("--events"));
