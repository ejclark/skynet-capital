/**
 * The printed report of the market reading (`market-reading.mjs`): today's score and its votes,
 * the recent strip, the score by year, the forward tables, each vote alone, run lengths and the
 * house call mix. Formatting only — every number it prints was computed by the CLI, so the report
 * and `--json` cannot disagree.
 */

import { HORIZON, READINGS, VOTES } from "./market-reading-math.mjs";

const pct = (x, d = 1) =>
  x == null || Number.isNaN(x) ? "–" : `${x >= 0 ? "+" : ""}${(100 * x).toFixed(d)}%`;
const share = (x) => (x == null ? "–" : `${(100 * x).toFixed(0)}%`);
const vote = (x) => (x == null ? " ·" : `${x > 0 ? "+" : x < 0 ? "−" : " "}${Math.abs(x)}`);

export function printDay(d, label, live) {
  const t = d.inputs;
  const term = t.vix && t.vix3m ? (t.vix / t.vix3m).toFixed(3) : "–";
  console.log(
    `\n=== ${label} ${d.date}${live ? " (session in progress: last price, not a close)" : ""}: score ${d.score} → ${d.reading?.toUpperCase()} ===` +
      `\n  votes: ${VOTES.map((k) => `${k} ${vote(d.votes[k])}`).join(" · ")}` +
      `\n  SPY ${pct(t.spyDd)} · QQQ ${pct(t.qqqDd)} off the 60-session high · VIX ${t.vix?.toFixed(2)} / VIX3M ${t.vix3m?.toFixed(2)} = ${term} · sectors above their 50-day ${t.breadth.up}/${t.breadth.of}`,
  );
}

export function printRecent(days) {
  console.log(`\n--- the last ${days.length} sessions (score · reading · ${VOTES.join(" / ")})`);
  for (const d of days)
    console.log(
      `  ${d.date}  ${String(d.score).padStart(4)}  ${(d.reading ?? "–").padEnd(12)} ${VOTES.map((k) => vote(d.votes[k])).join(" ")}`,
    );
}

export function printYears(rows, from) {
  console.log(`\n--- by year (score defined from ${from})`);
  console.log("  year   mean   low (date)            bear+leaning   bull+leaning   SPY year");
  for (const r of rows)
    console.log(
      `  ${r.year}  ${String(r.mean).padStart(5)}   ${String(r.low.score).padStart(4)} (${r.low.date})   ${share(r.bearish).padStart(12)}   ${share(r.bullish).padStart(12)}   ${pct(r.spy).padStart(8)}`,
    );
}

export function printForward(rows, since) {
  console.log(
    `\n--- next ${HORIZON} sessions by reading, sessions from ${since} (sessions with a full window)`,
  );
  for (const sym of ["SPY", "QQQ"]) {
    console.log(
      `  ${sym}: reading       sessions  episodes  ep.median  median    p10    up   low median  low p10  ≥5% dip`,
    );
    for (const r of rows) {
      const x = r[sym];
      if (!x) continue;
      console.log(
        `       ${r.label.padEnd(13)} ${String(r.sessions).padStart(8)}  ${String(r.episodes ?? "–").padStart(8)}  ${pct(x.epMedian).padStart(9)}  ${pct(x.p50).padStart(6)}  ${pct(x.p10).padStart(6)}  ${share(x.up).padStart(4)}  ${pct(x.lowP50).padStart(10)}  ${pct(x.lowP10).padStart(7)}  ${share(x.dip5).padStart(7)}`,
      );
    }
  }
}

export function printVotes(rows, since) {
  console.log(`\n--- each vote alone, SPY next ${HORIZON} sessions, from ${since}`);
  const side = (s) => (s > 0 ? "bull" : s < 0 ? "bear" : "flat");
  for (const { vote: k, parts } of rows)
    console.log(
      `  ${k.padEnd(9)} ${parts.map((p) => `${side(p.sign)} n=${p.n} median ${pct(p.p50)} p10 ${pct(p.p10)} ≥5% dip ${share(p.dip5)}`).join("  |  ")}`,
    );
}

export function printRuns(name, rows, from) {
  console.log(`\n--- run length by reading, ${name} score (sessions in a row), from ${from}`);
  for (const r of rows.filter((x) => READINGS.includes(x.reading)))
    console.log(
      `  ${r.reading.padEnd(13)} runs ${String(r.runs).padStart(4)} · median ${r.p50.toFixed(0)} · p90 ${r.p90.toFixed(0)}`,
    );
}

export function printCallMix(weeks) {
  if (!weeks.ok) return console.log(`\n--- house call mix: unavailable offline (${weeks.error})`);
  console.log("\n--- house call mix by event week (Today row; context, never scored)");
  console.log("  week of      stand-aside  watch  act  conditional   market score (week mean)");
  for (const w of weeks.rows)
    console.log(
      `  ${w.week}   ${String(w.mix["stand-aside"]).padStart(11)}  ${String(w.mix.watch).padStart(5)}  ${String(w.mix.act).padStart(3)}  ${String(w.mix.conditional).padStart(11)}   ${String(w.score ?? "–").padStart(6)}`,
    );
}
