/**
 * The printed report of the cycle-phase detector (`cycle-phase.mjs`): today's reading, one line
 * per sample × conditioning level, and the analog episodes behind a band. Formatting only — every
 * number it prints was computed by the CLI, so the report and `--json` cannot disagree.
 */

import { DD_LABELS, RECOVER_HORIZON, rankQuantile, vixBucket } from "./cycle-phase-math.mjs";

const pct = (x, d = 1) =>
  x == null || Number.isNaN(x) ? "–" : `${x >= 0 ? "+" : ""}${(100 * x).toFixed(d)}%`;
const sess = (x) => (x == null ? "–" : Number.isFinite(x) ? String(x) : `>${RECOVER_HORIZON}`);
const share = (x) => (x == null ? "–" : `${(100 * x).toFixed(0)}%`);

export function printReading(t) {
  const o = t.options;
  const peers = t.peerDds.map(([sym, dd]) => `${sym} ${pct(dd, 0)}`).join(", ");
  console.log(
    `\n=== ${t.sym} as of ${t.date}${t.live ? " (session in progress: last price, not a close)" : ""}: ${t.phase.toUpperCase()} ===` +
      `\n  close ${t.close.toFixed(2)} · 60-session high ${t.high.toFixed(2)} (${t.sinceHigh} sessions ago) · drawdown ${pct(t.dd)} [bucket ${DD_LABELS[t.bucket]}]` +
      `\n  20-session return ${pct(t.ret20)} · deepest drawdown in 20 sessions ${pct(t.ddMinRecent)} · realized vol (60) ${share(t.rv60)}` +
      `\n  peers ≥10% off their highs: ${t.flag.off}/${t.flag.of} → ${t.wide == null ? "unknown" : t.wide ? "sector-wide" : "single-name"} (${peers}) · VIX ${t.vix?.toFixed(2)} (${vixBucket(t.vix)})` +
      `\n  prints: last ${t.clock.last ?? "–"} (${t.clock.sinceLast ?? "–"} sessions ago) · next ${t.clock.next ?? "–"} (${t.clock.toNext ?? "–"} sessions) · last pre-print expiry ${t.putExpiry ?? "–"} (${t.putHold ?? "–"} sessions)`,
  );
  if (!o) return console.log("  chain: skipped (--no-chain)");
  if (o.error) return console.log(`  chain: unavailable — ${o.error}`);
  console.log(
    `  chain ${o.asOf}: iv30 ${share(o.iv30)} sits above ${share(o.rank)} of forward-30d realized (gap ${pct(o.gap)}) → premium fit ${o.verdict} (${o.confidence})` +
      `\n  puts @ ${t.putExpiry}: ${o.puts.map((p) => (p ? `Δ${p.delta} $${p.strike} bid ${p.bid.toFixed(2)} (${pct(p.strike / t.close - 1)})` : "none")).join(" · ")}`,
  );
}

export function printBand(tag, b, t) {
  if (!b.sessions) return console.log(`  ${tag.padEnd(34)} n=0`);
  const units =
    b.episodes == null ? "every session" : `${b.episodes} episodes, ${b.clusters} clusters`;
  const f = b.further;
  const fs = b.furtherScaled;
  const tri = (xs, fmt) => (xs ? xs.map(fmt).join(" / ") : "–");
  console.log(
    `  ${tag.padEnd(34)} ${String(b.sessions).padStart(5)} sessions, ${units.padEnd(26)}` +
      ` | further low ${pct(f.p25)} / ${pct(f.p50)} / ${pct(f.p75)} [p10 ${pct(f.p10)}, p90 ${pct(f.p90)}]` +
      (fs ? ` (vol-scaled ${pct(fs.p25)} / ${pct(fs.p50)} / ${pct(fs.p75)})` : "") +
      ` | low at ${tri(b.toLow?.slice(1, 4), sess)} | back to entry ${tri(b.backToEntry?.slice(1, 4), sess)} [p90 ${sess(b.backToEntry?.[4])}]` +
      ` | entry by 63 ${share(b.entryIn63)} · high by ${RECOVER_HORIZON} ${share(b.highIn126)}` +
      (b.atPut ? ` | close @${t.putHold} p10/p20/p50 ${tri(b.atPut, (x) => pct(x))}` : "") +
      (b.atPutScaled ? ` (scaled ${tri(b.atPutScaled, (x) => pct(x))})` : "") +
      b.rungs
        .map((r) => ` | $${r.strike} put ITM ${share(r.raw)} (scaled ${share(r.scaled)})`)
        .join(""),
  );
}

export function printEpisodes(b) {
  for (const e of b.eps) {
    const mid = (f) => {
      const v = e.os.map(f).filter((x) => x != null);
      return v.length ? rankQuantile(v, 0.5) : null;
    };
    console.log(
      `     ${e.sym.padEnd(5)} ${e.start} → ${e.end} (${String(e.os.length).padStart(3)} sessions)` +
        ` further ${pct(mid((o) => o.further))} · low at ${sess(mid((o) => o.toLow))} · back to entry ${sess(mid((o) => o.backToEntry))}`,
    );
  }
}
