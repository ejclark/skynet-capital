#!/usr/bin/env node
/**
 * MARKET READING — how bull or bear is the whole market today, and what did each reading lead to?
 *
 *   node scripts/research/market-reading.mjs
 *   node scripts/research/market-reading.mjs --since=2006-07-17 --recent=40 --json=out.json
 *
 * Plan #5496. Eric (#5154 round 0, 2026-10-16): "visual feedback that provides temperature of bull
 * vs bear across a spectrum of time" — and "helps prevent dumb playbook executions when market
 * conditions are bad". So this computes ONE score per session (rules in `market-reading-math.mjs`:
 * five votes from SPY/QQQ trend and drawdown, VIX level, VIX term and sector breadth), prints its
 * history, and then grades it: for every past session with the same reading, what SPY and QQQ did
 * over the next 21 sessions — the return, and the lowest close on the way (the number a sold put
 * cares about).
 *
 * A READING, NOT A FORECAST. The score uses closes up to the session it describes and nothing
 * after; the forward table is a separate, graded claim about what tends to follow, and the doc
 * that cites it carries the dated falsifiers. The house call mix (counts of stand-aside / watch /
 * act / conditional in the event ledgers, by week) is printed beside it as CONTEXT and never
 * scored: it has eight weeks of history, and posture is not direction.
 *
 * Episodes, not sessions, are the honest n (house rule, `cycle-phase-math.mjs`): a bull year is
 * one episode. Paper-only, educational; nothing here routes an order.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { band, perEpisode } from "./cycle-phase-math.mjs";
import { bars } from "./market-data.mjs";
import {
  breadthShare,
  breadthVote,
  episodesByReading,
  FAST,
  forward,
  indexVotes,
  meanVote,
  READINGS,
  readingOf,
  runsOf,
  scoreOf,
  sma,
  smoothReadings,
  VOTES,
  vixLevelVote,
  vixTermVote,
} from "./market-reading-math.mjs";
import {
  printCallMix,
  printDay,
  printForward,
  printRecent,
  printRuns,
  printVotes,
  printYears,
} from "./market-reading-report.mjs";
import { quantile } from "./premium-fit-math.mjs";

/** The nine original SPDR sector funds: fixed since 1998-12, so the basket has no survivor pick. */
const SECTORS = ["XLB", "XLE", "XLF", "XLI", "XLK", "XLP", "XLU", "XLV", "XLY"];
/** The first session ^VIX3M exists: from here all five votes are present. */
const ALL_FIVE = "2006-07-17";

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const SINCE = flag("since") ?? "2000-01-01";
const RECENT = Number(flag("recent") ?? 30);

const load = async (sym) => {
  const px = await bars(sym);
  return { sym, px, closes: px.map((b) => b.close), at: new Map(px.map((b, i) => [b.date, i])) };
};
const closeMap = async (sym) => new Map((await bars(sym)).map((b) => [b.date, b.close]));

const spy = await load("SPY");
const qqq = await load("QQQ");
const vix = await closeMap("^VIX");
const vix3m = await closeMap("^VIX3M");
const sectors = [];
for (const sym of SECTORS) {
  const s = await load(sym);
  const avg = sma(s.closes, FAST);
  sectors.push({ ...s, above: s.closes.map((c, i) => (avg[i] == null ? null : c > avg[i])) });
}
const spyVotes = indexVotes(spy.closes);
const qqqVotes = indexVotes(qqq.closes);
const on = (series, values, date) => {
  const i = series.at.get(date);
  return i == null ? null : values[i];
};

/** Every SPY session, read. SPY is the calendar: a session it did not trade is not a session. */
const days = spy.px.map((b, i) => {
  const s = spyVotes[i];
  const q = on(qqq, qqqVotes, b.date);
  const br = breadthShare(sectors.map((x) => on(x, x.above, b.date)));
  const v = vix.get(b.date) ?? null;
  const v3 = vix3m.get(b.date) ?? null;
  const votes = {
    trend: meanVote([s.trend, q?.trend ?? null]),
    drawdown: meanVote([s.drawdown, q?.drawdown ?? null]),
    vixLevel: vixLevelVote(v),
    vixTerm: vixTermVote(v, v3),
    breadth: breadthVote(br.share),
  };
  const score = scoreOf(votes);
  const inputs = { spyDd: s.dd, qqqDd: q?.dd ?? null, vix: v, vix3m: v3, breadth: br };
  return { date: b.date, i, score, reading: readingOf(score), votes, inputs };
});
const scored = days.filter((d) => d.score != null);
const last = days.at(-1);
// Yahoo serves the session in progress as a bar; before ~4pm ET it is a price, not a close.
const live = last.date === new Date().toISOString().slice(0, 10) && new Date().getUTCHours() < 21;

printDay(last, "MARKET READING", live);
if (live) printDay(days.at(-2), "last complete close", false);
printRecent(days.slice(-RECENT));

const mean = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
const years = [...new Set(scored.map((d) => d.date.slice(0, 4)))].map((year) => {
  const ds = scored.filter((d) => d.date.startsWith(year));
  const sh = (rs) => ds.filter((d) => rs.includes(d.reading)).length / ds.length;
  const before = spy.closes[Math.max(0, ds[0].i - 1)];
  return {
    year,
    mean: mean(ds.map((d) => d.score)),
    low: ds.reduce((a, b) => (b.score < a.score ? b : a)),
    bearish: sh(["bear", "leaning bear"]),
    bullish: sh(["bull", "leaning bull"]),
    spy: spy.closes[ds.at(-1).i] / before - 1,
  };
});
printYears(years, scored[0].date);

/** What one index did over the next 21 sessions from SPY session index i. */
const outcome = (series, i) => {
  const j = series.at.get(days[i].date);
  return j == null ? null : forward(series.closes, j);
};

/** The forward distribution of each reading: SPY and QQQ, one row per reading plus all. */
function forwardTable(since) {
  const labels = days.map((d) => (d.date >= since ? d.reading : null));
  const eps = episodesByReading(labels);
  return [...READINGS, "all"].map((label) => {
    const all = label === "all";
    const groups = all ? [labels.flatMap((l, i) => (l ? [i] : []))] : (eps.get(label) ?? []);
    const row = { label, sessions: 0, episodes: all ? null : groups.length };
    for (const series of [spy, qqq]) {
      const os = groups.map((ep) => ep.map((i) => outcome(series, i)).filter(Boolean));
      const flat = os.flat();
      if (!flat.length) continue;
      if (series === spy) row.sessions = flat.length;
      const ret = flat.map((o) => o.ret);
      const low = flat.map((o) => o.low);
      row[series.sym] = {
        epMedian: all ? null : band(perEpisode(os, (o) => o.ret))?.p50,
        p10: quantile(ret, 0.1),
        p50: quantile(ret, 0.5),
        up: ret.filter((r) => r > 0).length / ret.length,
        lowP50: quantile(low, 0.5),
        lowP10: quantile(low, 0.1),
        dip5: low.filter((l) => l <= -0.05).length / low.length,
      };
    }
    return row;
  });
}
const forwardMain = forwardTable(SINCE);
const forwardFive = forwardTable(ALL_FIVE);
printForward(forwardMain, SINCE);
printForward(forwardFive, ALL_FIVE);

/** Each vote alone: does it sort SPY's next 21 sessions? The score is only as good as its parts. */
const voteRows = VOTES.map((k) => ({
  vote: k,
  parts: [1, 0, -1].flatMap((sign) => {
    const os = days
      .filter((d) => d.date >= SINCE && d.votes[k] != null && Math.sign(d.votes[k]) === sign)
      .map((d) => outcome(spy, d.i))
      .filter(Boolean);
    if (!os.length) return [];
    const r = os.map((o) => o.ret);
    const dip5 = os.filter((o) => o.low <= -0.05).length / os.length;
    return [{ sign, n: os.length, p50: quantile(r, 0.5), p10: quantile(r, 0.1), dip5 }];
  }),
}));
printVotes(voteRows, SINCE);

/** How sticky a reading is, daily and smoothed: a strip that flips daily is noise on a calendar. */
const runStats = (labels) =>
  READINGS.flatMap((reading) => {
    const ns = runsOf(labels)
      .filter((r) => r.reading === reading)
      .map((r) => r.n);
    return ns.length
      ? [{ reading, runs: ns.length, p50: quantile(ns, 0.5), p90: quantile(ns, 0.9) }]
      : [];
  });
const runsDaily = runStats(scored.map((d) => d.reading));
const runsSmooth = runStats(smoothReadings(scored.map((d) => d.score)));
printRuns("daily", runsDaily, scored[0].date);
printRuns("5-session mean", runsSmooth, scored[0].date);

/**
 * The house call mix — context only. Reads the event ledgers' Today calls through the same parser
 * and classifier the app uses (Node strips the types), keyed by the event's own date, for the
 * weeks the ledgers cover. Never part of the score.
 */
async function callMixByWeek() {
  try {
    const { horizonCallsOf } = await import("../../src/server/research-event-calls.ts");
    const { callMix } = await import("../../app/src/live/call-mix.ts");
    const dir = join(process.cwd(), "docs", "research", "events");
    const weekOf = (iso) => {
      const d = new Date(`${iso}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      return d.toISOString().slice(0, 10);
    };
    const byWeek = new Map();
    for (const f of readdirSync(dir)) {
      const date = f.match(/(\d{4}-\d{2}-\d{2})\.md$/)?.[1];
      const call = date && horizonCallsOf(readFileSync(join(dir, f), "utf8")).today?.call;
      if (!call) continue;
      byWeek.set(weekOf(date), [...(byWeek.get(weekOf(date)) ?? []), call]);
    }
    const end = new Date(Date.parse(`${last.date}T00:00:00Z`) + 21 * 864e5).toISOString();
    const rows = [...byWeek]
      .filter(([w]) => w >= "2026-08-24" && w <= end.slice(0, 10))
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([week, calls]) => {
        const next = new Date(Date.parse(`${week}T00:00:00Z`) + 7 * 864e5).toISOString();
        const ds = scored.filter((d) => d.date >= week && d.date < next.slice(0, 10));
        return {
          week,
          mix: callMix(calls),
          score: ds.length ? mean(ds.map((d) => d.score)) : null,
        };
      });
    return { ok: true, rows };
  } catch (e) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
const mix = await callMixByWeek();
printCallMix(mix);

console.log(
  `\nSPY ${spy.px[0].date}→${last.date} · QQQ from ${qqq.px[0].date} · VIX3M from ${[...vix3m.keys()][0]} · sectors ${SECTORS.join(" ")} · paper-only research, not an order`,
);
const json = flag("json");
if (json)
  writeFileSync(
    json,
    JSON.stringify({
      asOf: last.date,
      live,
      today: last,
      history: scored.map(({ date, score, reading, votes }) => ({ date, score, reading, votes })),
      forward: { [SINCE]: forwardMain, [ALL_FIVE]: forwardFive },
      votes: voteRows,
      runs: { daily: runsDaily, smoothed: runsSmooth },
      callMix: mix.ok ? mix.rows : null,
    }),
  );
