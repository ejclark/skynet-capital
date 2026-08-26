/**
 * The adversarial controls stage of the earnings-cycle study — the four checks that try to KILL
 * a run-up/fade finding before it's allowed to stand: is it just the era's own base rate, where
 * inside the window does it actually happen, does the reaction session behave abnormally, and
 * does the effect show up in peers (sector-seasonal) or only in the one name (idiosyncratic)?
 *
 * Carries its own small statistics toolkit (ret / stats / binomTail) since it is the one stage
 * of the study that leans on all three at once — the mean-vs-base-rate binomial test in
 * particular belongs with the control it powers, not with the general report plumbing.
 */

import { bars } from "./market-data.mjs";

export const ret = (a, b) => (b / a - 1) * 100;

export function stats(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return null;
  const q = (p) => s[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  const mean = s.reduce((a, b) => a + b, 0) / n;
  return {
    n,
    mean,
    median: q(0.5),
    p10: q(0.1),
    p90: q(0.9),
    win: (100 * s.filter((x) => x > 0).length) / n,
  };
}

/** P(at least k of n) under a fair-ish base rate p — the "is 14/14 luck?" test. */
export function binomTail(k, n, p) {
  const logFact = (m) => {
    let t = 0;
    for (let i = 2; i <= m; i++) t += Math.log(i);
    return t;
  };
  let total = 0;
  for (let i = k; i <= n; i++) {
    total += Math.exp(
      logFact(n) - logFact(i) - logFact(n - i) + i * Math.log(p) + (n - i) * Math.log(1 - p),
    );
  }
  return total;
}

/** Is the run-up earnings, or just a bull market? The binomial test against the era's own rate. */
export function controlBaseRate(px, modern, eraFrom) {
  const all20 = [];
  for (let i = eraFrom; i < px.length - 20; i++) all20.push(ret(px[i].close, px[i + 20].close));
  const base20 = stats(all20);
  const ev20 = stats(modern.map((e) => ret(px[e.i - 20].close, px[e.i].close)));
  const wins = modern.filter((e) => ret(px[e.i - 20].close, px[e.i].close) > 0).length;
  console.log(`\n  1. run-up vs the era's OWN base rate (is it earnings, or just a bull market?)`);
  console.log(
    `     every 20d window : n=${String(base20.n).padStart(4)}  mean ${base20.mean.toFixed(2)}%  win ${base20.win.toFixed(0)}%`,
  );
  console.log(
    `     pre-earnings 20d : n=${String(ev20.n).padStart(4)}  mean ${ev20.mean.toFixed(2)}%  win ${ev20.win.toFixed(0)}%`,
  );
  const p = binomTail(wins, modern.length, base20.win / 100);
  console.log(
    `     P(${wins}/${modern.length} positive | base rate) = ${p.toFixed(4)} -> ${p < 0.05 ? "SURVIVES" : "NOT SIGNIFICANT"}`,
  );
}

/** Where inside the window the run-up happens — the leg that decides the exit date. */
export function controlShape(px, modern) {
  console.log(`\n  2. where inside the window does the run-up actually happen?`);
  for (const [lo, hi, label] of [
    [20, 10, "D-20 -> D-10"],
    [10, 5, "D-10 -> D-5 "],
    [5, 0, "D-5  -> D   "],
  ]) {
    const s = stats(modern.map((e) => ret(px[e.i - lo].close, px[e.i - hi].close)));
    console.log(
      `     ${label}  mean ${s.mean.toFixed(2).padStart(6)}%  med ${s.median.toFixed(2).padStart(6)}%  win ${s.win.toFixed(0).padStart(3)}%`,
    );
  }
}

/** Does the reaction session behave unlike an ordinary one? */
export function controlFade(px, modern, eraFrom) {
  const allIntra = [];
  for (let i = eraFrom; i < px.length; i++) allIntra.push(ret(px[i].open, px[i].close));
  const bi = stats(allIntra);
  const fi = stats(modern.map((e) => ret(px[e.i + 1].open, px[e.i + 1].close)));
  console.log(`\n  3. reaction-day fade vs an ordinary session`);
  console.log(`     every session      : mean ${bi.mean.toFixed(2)}%  win ${bi.win.toFixed(0)}%`);
  console.log(`     earnings reaction  : mean ${fi.mean.toFixed(2)}%  win ${fi.win.toFixed(0)}%`);
}

/** A sector-seasonal effect shows up in peers; a name-specific one does not. */
export async function controlPeers(px, modern, peers, symbol) {
  if (!peers.length) return;
  console.log(`\n  4. out-of-sample — do peers run up over ${symbol}'s OWN pre-print windows?`);
  console.log(
    `     (a sector-seasonal effect would show here; a ${symbol}-specific one would not)`,
  );
  for (const sym of peers) {
    const pk = await bars(sym);
    const pi = new Map(pk.map((b, i) => [b.date, i]));
    const xs = modern
      .filter((e) => pi.has(px[e.i - 20].date) && pi.has(px[e.i].date))
      .map((e) => ret(pk[pi.get(px[e.i - 20].date)].close, pk[pi.get(px[e.i].date)].close));
    const s = stats(xs);
    if (s) {
      console.log(
        `     ${sym.padEnd(5)} n=${String(s.n).padStart(3)}  mean ${s.mean.toFixed(2).padStart(6)}%  win ${s.win.toFixed(0).padStart(3)}%`,
      );
    }
  }
}
