/**
 * CLI: replay Eric's AI-dip chain on CRWV's history, in shadow (#6959 slice 1).
 *
 *   npm run research:chain
 *   npm run research:chain -- --json=out.json
 *
 * The chain is `AI_DIP_CHAIN` (`src/playbooks/chain.ts`): CRWV-WHEEL sells a put; if it expires,
 * the cash it secured passes to CRWV-LONG-CALL; if it is assigned, the wheel keeps the shares and
 * sells covered calls (no link, so its own exit plan). A run starts every 5th session since CRWV's
 * vol can first be read, with one contract's collateral in cash; a day the wheel would sell nothing
 * is skipped, not scored. Each run goes until its position ends on an owner's exit or the tape does.
 *
 * It prints each link's own result and the chain's total beside them (criterion 3), and the
 * ownership check the plan names as its falsifier: sessions where two links decided, or a live
 * position had no owner.
 *
 * THE VOL MODEL is the long-call fence study's (`printVolModel`, `long-call-fence-math.mjs`): 60 sessions of
 * realized vol with every print's reaction left out, plus each print still ahead inside an option's
 * life priced at the root mean square of CRWV's past print reactions (NVDA's while CRWV has fewer
 * than two). Every option dollar is modeled; closes, not intraday.
 *
 * Network: the cached Yahoo bars and SEC EDGAR fetchers in `scripts/research/market-data.mjs`.
 * Paper only, educational; nothing here routes an order.
 */
import { writeFileSync } from "node:fs";
import {
  daysBetween,
  eventMove,
  eventsAhead,
  impliedVol,
  printVolModel,
} from "../../scripts/research/long-call-fence-math.mjs";
import { bars, earningsDates } from "../../scripts/research/market-data.mjs";
import { AI_DIP_CHAIN, chainStart } from "../playbooks/chain.js";
import {
  AI_DIP_MODELS,
  type ChainRun,
  ownershipCheck,
  runChain,
  type Tape,
} from "../playbooks/chain-replay.js";

const SYMBOL = "CRWV";
const STEP = 5;

interface Loaded {
  readonly dates: string[];
  readonly closes: number[];
  readonly prints: string[];
  readonly baseVol: (number | null)[];
  readonly moves: { reactedOn: string; move: number }[];
}

async function load(symbol: string): Promise<Loaded> {
  const px = await bars(symbol);
  const prints = await earningsDates(symbol).catch(() => [] as string[]);
  const closes = px.map((b) => b.close);
  const dates = px.map((b) => b.date);
  return { dates, closes, prints, ...printVolModel(closes, dates, prints) };
}

const crwv = await load(SYMBOL);
const nvda = await load("NVDA");

const tape: Tape = {
  dates: crwv.dates,
  closes: crwv.closes,
  prints: crwv.prints,
  volAt(t, expiry) {
    const base = crwv.baseVol[t];
    const date = crwv.dates[t];
    if (base == null || date === undefined) return null;
    const move = eventMove(crwv.moves, date) ?? eventMove(nvda.moves, date) ?? 0;
    return impliedVol({
      baseVol: base,
      years: daysBetween(date, expiry) / 365,
      events: eventsAhead(crwv.prints, date, expiry),
      eventMove: move,
    });
  },
};

const first = crwv.baseVol.findIndex((v) => v != null);
const runs: ChainRun[] = [];
let dark = 0;
const opener = AI_DIP_MODELS.get(chainStart(AI_DIP_CHAIN));
for (let t = first; t >= 0 && t < crwv.closes.length; t += STEP) {
  // A day the first link would open nothing is skipped before the chain runs, not scored.
  if (opener?.step(tape, t, { kind: "cash" }).event?.kind !== "filled") {
    dark++;
    continue;
  }
  runs.push(runChain(AI_DIP_CHAIN, AI_DIP_MODELS, tape, t));
}

const WHEEL = "CRWV-WHEEL";
const CALL = "CRWV-LONG-CALL";
const resultOf = (run: ChainRun, id: string): number | null =>
  run.links.find((l) => l.playbook === id)?.result ?? null;
const dateOf = (t: number): string => crwv.dates[t] ?? "?";
const pathOf = (run: ChainRun): string => {
  if (run.path.some((p) => p.event === "assigned")) return "assigned → the wheel keeps it";
  if (run.path.some((p) => p.event === "expired")) return "expired → the long call";
  return "the put still open";
};
const mean = (xs: readonly number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : Number.NaN;
const usd = (x: number | null): string =>
  x === null || Number.isNaN(x)
    ? "—"
    : `${x < 0 ? "−" : "+"}$${Math.abs(Math.round(x)).toLocaleString("en-US")}`;
const pct = (n: number, d: number): string => (d ? `${Math.round((100 * n) / d)}%` : "—");

// Each link's own result and the chain's total, by the path the position took.
const PATHS = ["expired → the long call", "assigned → the wheel keeps it", "the put still open"];
const rows = PATHS.map((path) => {
  const these = runs.filter((r) => pathOf(r) === path);
  const call = these.flatMap((r) => {
    const x = resultOf(r, CALL);
    return x === null ? [] : [x];
  });
  return {
    path,
    runs: these.length,
    open: these.filter((r) => r.status === "open").length,
    wheel: mean(these.map((r) => resultOf(r, WHEEL) ?? 0)),
    longCall: call.length ? mean(call) : null,
    total: mean(these.map((r) => r.total)),
    won: these.filter((r) => r.total > 0).length,
  };
});

// The plan's falsifier, over every session of every run.
const checks = runs.map((r) => ownershipCheck(r, AI_DIP_CHAIN));
const sessions = checks.reduce((s, c) => s + c.sessions, 0);
const twoDeciders = checks.reduce((s, c) => s + c.twoDeciders, 0);
const unowned = checks.reduce((s, c) => s + c.unowned, 0);

// Eric's words were "then buy calls after earnings if the price is still low". Neither is a chain
// condition: the first is the long call's own fence, the second is on no menu. Both are observed.
interface Handoff {
  readonly bought: boolean;
  readonly afterPrint?: boolean;
  readonly stillLow?: boolean;
}
const handoffs = runs.flatMap((r): Handoff[] => {
  const handed = r.path.find((p) => p.event === "expired");
  const bought = r.path.find((p) => p.event === "filled" && p.by === CALL);
  if (!handed) return [];
  if (!bought) return [{ bought: false }];
  const afterPrint = crwv.prints.some((p) => p > dateOf(handed.t) && p <= dateOf(bought.t));
  const stillLow = (crwv.closes[bought.t] ?? 0) < (crwv.closes[r.start] ?? 0);
  return [{ bought: true, afterPrint, stillLow }];
});
const boughtRows = handoffs.filter((h) => h.bought);

const lines = [
  `# ${AI_DIP_CHAIN.id} — ${AI_DIP_CHAIN.title}`,
  "",
  `Shadow replay on ${SYMBOL}, ${dateOf(first)} → ${dateOf(crwv.closes.length - 1)}: a run every ${STEP}th session, ` +
    `${runs.length} runs (${dark} days the wheel would sell nothing, skipped). Dollars per contract, modeled premium.`,
  "",
  "| Path | Runs | CRWV-WHEEL | CRWV-LONG-CALL | Chain total | Chain won |",
  "|---|---:|---:|---:|---:|---:|",
  ...rows.map(
    (r) =>
      `| ${r.path}${r.open ? ` (${r.open} still open, marked)` : ""} | ${r.runs} | ${usd(r.wheel)} | ` +
      `${r.longCall === null ? "—" : usd(r.longCall)} | ${usd(r.total)} | ${pct(r.won, r.runs)} |`,
  ),
  `| **Every run** | ${runs.length} | ${usd(mean(runs.map((r) => resultOf(r, WHEEL) ?? 0)))} | ` +
    `${usd(
      mean(
        runs.flatMap((r) => {
          const x = resultOf(r, CALL);
          return x === null ? [] : [x];
        }),
      ),
    )} | ` +
    `${usd(mean(runs.map((r) => r.total)))} | ${pct(runs.filter((r) => r.total > 0).length, runs.length)} |`,
  "",
  `_Each link's mean is over the runs it owned a position in; the chain total sits beside them._`,
  "",
  `**One owner per position:** ${sessions.toLocaleString("en-US")} sessions checked · two links deciding: ${twoDeciders} · ` +
    `a live position with no owner: ${unowned}.`,
  "",
  `**After the handoff** (${handoffs.length} expired puts): the long call bought in ${boughtRows.length}; ` +
    `${boughtRows.filter((h) => h.afterPrint).length} of those buys came after the next print, ` +
    `${boughtRows.filter((h) => !h.afterPrint).length} before it. ` +
    `CRWV was still under the put's sale-day close at the buy in ${boughtRows.filter((h) => h.stillLow).length}.`,
  "",
  "Newest runs:",
  "",
  "| Put sold | Path | Events | CRWV-WHEEL | CRWV-LONG-CALL | Total | |",
  "|---|---|---|---:|---:|---:|---|",
  ...runs
    .slice(-6)
    .map(
      (r) =>
        `| ${dateOf(r.start)} | ${pathOf(r)} | ${r.path.map((p) => `${p.event} ${dateOf(p.t)}`).join(" · ")} | ` +
        `${usd(resultOf(r, WHEEL))} | ${usd(resultOf(r, CALL))} | ${usd(r.total)} | ${r.status} |`,
    ),
];
console.log(lines.join("\n"));

const json = process.argv
  .slice(2)
  .find((a) => a.startsWith("--json="))
  ?.split("=")[1];
if (json) {
  writeFileSync(
    json,
    JSON.stringify(
      {
        chain: AI_DIP_CHAIN,
        rows,
        ownership: { sessions, twoDeciders, unowned },
        runs: runs.map(({ steps: _steps, ...r }) => ({ ...r, date: dateOf(r.start) })),
      },
      null,
      2,
    ),
  );
}
if (twoDeciders > 0 || unowned > 0) process.exitCode = 1;
