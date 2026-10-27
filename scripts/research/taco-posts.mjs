#!/usr/bin/env node
/**
 * TACO backtest — what happens to a stock after Trump posts about the company, and which part of
 * that move is still there for a reader who sees the post late (#4820, slice 1).
 *
 *   node scripts/research/taco-posts.mjs candidates   # posts naming a company → batches to label
 *   node scripts/research/taco-posts.mjs              # the study, from the committed labels
 *   node scripts/research/taco-posts.mjs --events     # one row per event, for auditing
 *
 * THE QUESTION. Eric (2026-10-06): "calculate the shelf life of the pump and dump… I imagine… closed
 * by EOD, 24-48 hours… Backtesting the theory presents data that can refine the duration." The
 * research behind #4820 adds the constraint that shapes the answer: about ten funds pay Trump Media
 * for millisecond delivery, and every free copy of a post arrives minutes later. So this script does
 * not ask "does a post move the stock" — it asks what is LEFT after we could have acted, on each
 * side: riding the move (with) or betting against it (fade).
 *
 * METHOD, IN ONE PASS.
 *   1. Corpus: CNN's Truth Social archive (millisecond timestamps), original posts only (reposts
 *      dropped), from the first hourly bar Yahoo serves (2023-11).
 *   2. Mentions: `taco-companies.mjs` — a hand list of names and brands → ticker.
 *   3. Labels: a cheap-model pass decided, per (post, ticker), whether the company is the subject,
 *      the kind (praise · attack · tariff · deal · policy · other) and the direction a reader would
 *      expect (+1 / −1). Committed as `docs/research/taco-posts-labels.json` so the study re-runs
 *      without a model; the text itself is never committed.
 *   4. Prices: Yahoo 60-minute bars with pre/post-market, for the ticker and for SPY. Every return
 *      is the stock minus SPY over the same bars (abnormal), times the label's direction.
 *   5. Entry: the open of the first bar after the post ("next bar", 0–60 min late) or the bar after
 *      that (60–120 min late); and, separately, only during regular hours (a post made outside them
 *      enters at the 9:30 open). Exit: one bar later, the day's close, one and two sessions later.
 *
 * WHAT HOURLY BARS CANNOT SAY. Entries 0, 5 and 15 minutes after a post all land in the same bar.
 * The minutes question waits for slice 2's live delay log; this run answers Eric's hours-to-days one.
 *
 * Offline research tooling: no broker credential, touches no trading path, places nothing.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  barAt,
  bonferroni,
  bp,
  CACHE,
  etClock,
  fiveMinute,
  hourly,
  pct,
  posts,
  REGULAR_CLOSE,
  REGULAR_OPEN,
  sessionClose,
  summary,
} from "./taco-common.mjs";
import { companiesIn } from "./taco-companies.mjs";

const LABELS = join(process.cwd(), "docs", "research", "taco-posts-labels.json");
const KINDS = ["praise", "attack", "tariff", "deal", "policy"];
/** Two of the same ticker inside this window are one story: only the first post counts. */
const SAME_STORY_MS = 24 * 3_600_000;
/** Below this many events a cell is printed but never called. */
const MIN_N = 15;

/**
 * The price path one event offers, as indexes into `bars`: the bar the post sits in (or the last
 * bar before it), the entry bar, and each exit's bar. "Before" is that bar's open when the post
 * lands inside it, else its close (a post overnight or on a weekend).
 */
function path(bars, postMs, entry) {
  const at = barAt(bars, postMs);
  if (at < 0 || at + 2 >= bars.length) return undefined;
  const inside = postMs < bars[at].t + 3_600_000 && etClock(postMs).date === bars[at].date;
  let e = at + 1 + (entry === "next+1" ? 1 : 0);
  if (entry === "regular") while (e < bars.length && !bars[e].regular) e++;
  if (e >= bars.length) return undefined;
  const close = sessionClose(bars, e, 0);
  const exits = {
    "1 bar": e,
    close,
    "+1 day": close < 0 ? -1 : sessionClose(bars, close + 1, 0),
    "+2 days": close < 0 ? -1 : sessionClose(bars, close + 1, 1),
  };
  return { at, beforeField: inside ? "open" : "close", entry: e, exits };
}

/** SPY's price at the bar starting at `t` (that field), else the close of the bar before it. */
function spyPrice(spy, t, field) {
  const i = barAt(spy, t);
  if (i < 0) return undefined;
  return spy[i].t === t ? spy[i][field] : spy[i].close;
}

function spyReturn(spy, fromT, fromField, toT, toField) {
  const a = spyPrice(spy, fromT, fromField);
  const b = spyPrice(spy, toT, toField);
  return a === undefined || b === undefined ? undefined : b / a - 1;
}

const FINE = [5, 15, 30, 60];

/**
 * One event's first hour on 5-minute bars: the signed abnormal move from just before the post to
 * the open of the first bar at or after +5/+15/+30/+60 minutes, and to that session's close.
 */
async function firstHour(ev, spy5) {
  const bars = await fiveMinute(ev.ticker);
  if (bars.length === 0 || ev.ms < bars[0].t) return undefined;
  const at = barAt(bars, ev.ms);
  if (at < 0) return undefined;
  const inside = ev.ms < bars[at].t + 300_000;
  const field = inside ? "open" : "close";
  const from = bars[at][field];
  const spyFrom = spyPrice(spy5, bars[at].t, field);
  if (spyFrom === undefined) return undefined;
  const signed = (i, f) => {
    const s = spyPrice(spy5, bars[i].t, f);
    return s === undefined ? undefined : ev.direction * (bars[i][f] / from - 1 - (s / spyFrom - 1));
  };
  const row = {
    at: ev.at,
    ticker: ev.ticker,
    kind: ev.kind,
    source: ev.source,
  };
  for (const m of FINE) {
    let i = at + 1;
    while (i < bars.length && bars[i].t < ev.ms + m * 60_000) i++;
    if (i < bars.length) row[m] = signed(i, "open");
  }
  const c = sessionClose(bars, at + 1, 0);
  if (c > 0) row.close = signed(c, "close");
  return row;
}

// ── stats ──────────────────────────────────────────────────────────────────────────────────────

// ── stages ─────────────────────────────────────────────────────────────────────────────────────

const STUDY_FROM = "2023-11-07";

async function candidates() {
  const all = await posts(STUDY_FROM);
  const out = [];
  for (const p of all) {
    for (const hit of companiesIn(p.text, p.at)) {
      out.push({
        id: p.id,
        at: p.at,
        ticker: hit.ticker,
        matched: hit.matched,
        text: p.text,
      });
    }
  }
  const dir = join(CACHE, "label-batches");
  mkdirSync(dir, { recursive: true });
  const size = 60;
  for (let b = 0; b * size < out.length; b++) {
    const batch = out.slice(b * size, (b + 1) * size).map((c) => ({
      ...c,
      // Long posts: keep the opening and the stretch around the name, which is what a label needs.
      text: c.text.length <= 1500 ? c.text : excerpt(c.text, c.matched),
    }));
    writeFileSync(
      join(dir, `batch-${String(b).padStart(2, "0")}.json`),
      JSON.stringify(batch, null, 1),
    );
  }
  console.log(`${all.length} original posts → ${out.length} (post, ticker) candidates → ${dir}`);
}

function excerpt(text, name) {
  const at = Math.max(text.indexOf(name), text.indexOf(name.toUpperCase()));
  return `${text.slice(0, 400)} … ${text.slice(Math.max(400, at - 500), at + 600)}`;
}

/** A post that is a headline plus a link: the news was public before he shared it. */
const LINK_SHARE = /https?:\/\/\S+\s*$/;
/** Naming this many companies at once is a roll-call ("…Apple, Nvidia, Lilly, IBM…"), not a post about one. */
const LIST_SIZE = 4;

/**
 * Where an event's information came from. "own" — his words about the company. "link" — a shared
 * headline, already public when he posted it (the case Machus, Mestel & Theissen 2022 found moved
 * nothing). "list" — one name among many. Kinds are judged on "own" only; the other two are controls.
 */
function sourceOf(post) {
  const link = post.text.match(LINK_SHARE);
  if (link && post.text.replace(link[0], "").trim().length < 260) return "link";
  return new Set(companiesIn(post.text, post.at).map((h) => h.ticker)).size >= LIST_SIZE
    ? "list"
    : "own";
}

/** Labelled, on-subject, signed events; one per ticker per story. */
async function events() {
  const labels = JSON.parse(readFileSync(LABELS, "utf8"));
  const byId = new Map((await posts(STUDY_FROM)).map((p) => [p.id, p]));
  const kept = labels
    .filter((l) => l.about && l.direction !== 0 && KINDS.includes(l.kind) && byId.has(l.id))
    .sort((a, b) => (a.at < b.at ? -1 : 1));
  const last = new Map();
  const out = [];
  for (const l of kept) {
    const t = Date.parse(l.at);
    const prev = last.get(l.ticker);
    if (prev !== undefined && t - prev < SAME_STORY_MS) continue;
    last.set(l.ticker, t);
    const post = byId.get(l.id);
    out.push({ ...l, ms: t, url: post.url, source: sourceOf(post) });
  }
  return {
    labelled: labels.length,
    about: labels.filter((l) => l.about).length,
    events: out,
  };
}

/** The rows of every table: each kind on his own words, then all of them, then the two controls. */
const GROUPS = [
  ...KINDS.map((k) => ({
    name: k,
    has: (r) => r.source === "own" && r.kind === k,
  })),
  { name: "**all own words**", has: (r) => r.source === "own" },
  { name: "control: shared links", has: (r) => r.source === "link" },
  { name: "control: lists", has: (r) => r.source === "list" },
];

const ENTRIES = {
  next: "next bar (0–60 min late)",
  "next+1": "a bar later (60–120 min)",
  regular: "regular hours only",
};
const EXITS = ["1 bar", "close", "+1 day", "+2 days"];

function postedWhileOpen(ms) {
  const { minute } = etClock(ms);
  const day = new Date(ms).getUTCDay();
  return day > 0 && day < 6 && minute >= REGULAR_OPEN && minute < REGULAR_CLOSE;
}

/** One event under one entry rule: the jump we missed and each exit's return, signed and vs SPY. */
function pricedRow(ev, bars, spy, entry) {
  const p = path(bars, ev.ms, entry);
  if (!p) return undefined;
  const entryBar = bars[p.entry];
  const beforeBar = bars[p.at];
  const jumpRaw = entryBar.open / beforeBar[p.beforeField] - 1;
  const jumpSpy = spyReturn(spy, beforeBar.t, p.beforeField, entryBar.t, "open");
  if (jumpSpy === undefined) return undefined;
  const marketOpen = postedWhileOpen(ev.ms);
  const row = {
    ...ev,
    entry,
    marketOpen,
    jump: ev.direction * (jumpRaw - jumpSpy),
  };
  for (const exit of EXITS) {
    const x = p.exits[exit];
    if (x < p.entry) continue;
    const r = bars[x].close / entryBar.open - 1;
    const s = spyReturn(spy, entryBar.t, "open", bars[x].t, "close");
    if (s !== undefined) row[exit] = ev.direction * (r - s);
  }
  return row;
}

/** Every event priced under every entry rule, plus the 5-minute first-hour rows where they exist. */
async function priceAll(evs) {
  const spy = await hourly("SPY");
  const spy5 = await fiveMinute("SPY");
  const rows = [];
  const fineRows = [];
  const skipped = {};
  for (const ev of evs) {
    const bars = await hourly(ev.ticker);
    if (bars.length === 0 || ev.ms < bars[0].t) {
      skipped[ev.ticker] = (skipped[ev.ticker] ?? 0) + 1;
      continue;
    }
    const fine = await firstHour(ev, spy5);
    if (fine) fineRows.push(fine);
    for (const entry of Object.keys(ENTRIES)) {
      const row = pricedRow(ev, bars, spy, entry);
      if (row) rows.push(row);
    }
  }
  return { rows, fineRows, skipped };
}

function printEvents(rows) {
  for (const r of rows.filter((x) => x.entry === "next")) {
    console.log(
      [
        r.at.slice(0, 16),
        r.ticker,
        r.kind,
        r.source,
        r.direction > 0 ? "+" : "−",
        r.marketOpen ? "open" : "closed",
        `jump ${bp(r.jump)}`,
        ...EXITS.map((e) => `${e} ${bp(r[e])}`),
        r.reason ?? "",
      ].join(" | "),
    );
  }
}

function printSample({ labelled, about, evs, nextRows, skipped }) {
  const missing = Object.entries(skipped).map(([t, n]) => `${t} (${n})`);
  const groups = GROUPS.map((g) => `${g.name.replace(/\*/g, "")} ${nextRows.filter(g.has).length}`);
  const open = nextRows.filter((r) => r.marketOpen).length;
  console.log(`## Sample\n`);
  console.log(
    `- ${labelled} (post, ticker) candidates labelled; ${about} had the company as the subject.`,
  );
  console.log(
    `- ${evs.length} signed events after one-per-ticker-per-24h; ${nextRows.length} priced.`,
  );
  console.log(`- No hourly bars for: ${missing.join(", ") || "none"}.`);
  console.log(`- By group: ${groups.join(" · ")}.`);
  console.log(`- Posted while the market was open: ${open} of ${nextRows.length}.\n`);
}

function printDirection(nextRows) {
  console.log(
    "## Did the text call the direction? (the move we could not catch: before the post → next bar open, vs SPY)\n",
  );
  console.log("| kind | n | median jump, bp | jump went the post's way | t |");
  console.log("|---|---|---|---|---|");
  for (const g of GROUPS) {
    const s = summary(nextRows.filter(g.has).map((r) => r.jump));
    if (s.n)
      console.log(`| ${g.name} | ${s.n} | ${bp(s.median)} | ${pct(s.win)} | ${s.t.toFixed(2)} |`);
  }
}

/** One table per entry rule; returns how many non-empty cells it printed (for the correction). */
function printEntries(rows) {
  let cells = 0;
  for (const entry of Object.keys(ENTRIES)) {
    console.log(
      `\n## Entry: ${ENTRIES[entry]} — riding the post's direction, abnormal vs SPY, bp\n`,
    );
    console.log(
      "Each cell: mean · median · win% · t (n). Fading is the same number with the sign flipped.\n",
    );
    console.log(`| kind | ${EXITS.join(" | ")} |`);
    console.log(`|---|${EXITS.map(() => "---").join("|")}|`);
    for (const g of GROUPS) {
      const sel = rows.filter((r) => r.entry === entry && g.has(r));
      const out = EXITS.map((e) => {
        const s = summary(sel.map((r) => r[e]).filter((x) => x !== undefined));
        if (!s.n) return "—";
        cells++;
        const flag = s.n < MIN_N ? " ·thin" : "";
        return `${bp(s.mean)} · ${bp(s.median)} · ${pct(s.win)} · ${s.t.toFixed(1)} (${s.n})${flag}`;
      });
      console.log(`| ${g.name} | ${out.join(" | ")} |`);
    }
  }
  return cells;
}

function printOpenShut(nextRows) {
  console.log(
    "\n## Posted while the market was open vs. closed — next-bar entry, to the day's close\n",
  );
  console.log("| kind | open: mean · win · t (n) | closed: mean · win · t (n) |");
  console.log("|---|---|---|");
  for (const g of GROUPS) {
    const cell = (open) => {
      const xs = nextRows.filter((r) => g.has(r) && r.marketOpen === open && r.close !== undefined);
      const s = summary(xs.map((r) => r.close));
      return s.n ? `${bp(s.mean)} · ${pct(s.win)} · ${s.t.toFixed(1)} (${s.n})` : "—";
    };
    console.log(`| ${g.name} | ${cell(true)} | ${cell(false)} |`);
  }
}

function printFirstHour(fineRows) {
  console.log("\n## The first hour, on 5-minute bars (posts in the last 60 days only)\n");
  console.log(
    "Signed move vs SPY from just before the post to each point, bp — how much was already gone.\n",
  );
  console.log(`| | ${FINE.map((m) => `+${m} min`).join(" | ")} | close |`);
  console.log(`|---|${FINE.map(() => "---").join("|")}|---|`);
  for (const r of fineRows) {
    const tag = r.source === "own" ? "" : ` (${r.source})`;
    console.log(
      `| ${r.at.slice(0, 10)} ${r.ticker} ${r.kind}${tag} | ${FINE.map((m) => bp(r[m])).join(" | ")} | ${bp(r.close)} |`,
    );
  }
  if (!fineRows.length) return;
  const med = (k) => summary(fineRows.map((r) => r[k]).filter((x) => x !== undefined)).median;
  console.log(
    `| **median (n=${fineRows.length})** | ${FINE.map((m) => bp(med(m))).join(" | ")} | ${bp(med("close"))} |`,
  );
}

async function study(showEvents) {
  const { labelled, about, events: evs } = await events();
  const { rows, fineRows, skipped } = await priceAll(evs);
  if (showEvents) {
    printEvents(rows);
    return;
  }
  const nextRows = rows.filter((r) => r.entry === "next");
  printSample({ labelled, about, evs, nextRows, skipped });
  printDirection(nextRows);
  const cells = printEntries(rows);
  printOpenShut(nextRows);
  printFirstHour(fineRows);
  console.log(
    `\n${cells} cells above. With that many looks, a |t| near 2 turns up by chance a few times; ` +
      `only |t| ≥ ${bonferroni(cells).toFixed(1)} survives a Bonferroni correction at 5%.`,
  );
}

const [stage] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (stage === "candidates") await candidates();
else await study(process.argv.includes("--events"));
