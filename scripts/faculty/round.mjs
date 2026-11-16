// A FACULTY ROUND (#change-scenarios) — every scenario file in a directory, one blind member each,
// N at once, each on its own fresh faculty server, then one table.
//
//   npx tsx scripts/faculty/round.mjs --scenarios scripts/faculty/scenarios --out <fresh dir>
//        [--only EQ-01,OM-02] [--concurrency 3] [--actor sealed] [--port 8830] [--runs 1]
//
// Each session is scripts/faculty/drive.mjs's `driveChange` (its header says what a session is).
// Sessions run in parallel on ports `port + 4·slot`, so two servers never share a port or an
// insights-bridge port. A session that throws is recorded as an error row, never a lost round.
// Out: <out>/<id>-<viewport>-run<n>/ per session, and <out>/round.json + <out>/round.md — the
// table a readout starts from (verdict, unintended writes, turns, ease, worst confusion, said).

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { driveChange } from "./drive.mjs";

function args(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    scenarios: get("--scenarios") ?? "scripts/faculty/scenarios",
    out: get("--out"),
    only: get("--only")?.split(",").filter(Boolean),
    concurrency: Number(get("--concurrency") ?? 3),
    actor: get("--actor") ?? "sealed",
    port: Number(get("--port") ?? 8830),
    runs: Number(get("--runs") ?? 1),
  };
}

/** One row of the round's table — what a readout ranks. */
export function rowOf(scenario, run, summary, error) {
  if (error)
    return { id: scenario.id, member: scenario.member, viewport: scenario.viewport, run, error };
  const v = summary.verdict;
  return {
    id: scenario.id,
    member: scenario.member,
    viewport: summary.viewport,
    run,
    success: v.success,
    reason: v.reason,
    unintended: v.unintended,
    newOrders: v.newOrders,
    ended: summary.ended,
    turns: summary.turns,
    cap: summary.cap,
    ease: summary.ease?.score ?? null,
    easeWhy: summary.ease?.reason ?? null,
    maxConfusion: summary.maxConfusion,
    said: summary.said,
  };
}

/** The table in words, worst first: errors, unintended writes, failures, then the rest. */
export function roundMarkdown(rows) {
  const rank = (r) => (r.error ? 0 : r.unintended?.length ? 1 : r.success ? 3 : 2);
  const sorted = [...rows].sort((a, b) => rank(a) - rank(b) || String(a.id).localeCompare(b.id));
  const ok = rows.filter((r) => r.success).length;
  const harm = rows.filter((r) => r.unintended?.length).length;
  const lines = [
    `# Faculty round — ${ok} of ${rows.length} changes landed as meant · ${harm} with an unintended write`,
    "",
    "| id | member · device | landed? | why | unintended | turns | ease | confusion |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const r of sorted) {
    if (r.error) {
      lines.push(`| ${r.id} | ${r.member} · ${r.viewport} | error | ${clip(r.error)} | | | | |`);
      continue;
    }
    lines.push(
      `| ${r.id} | ${r.member} · ${r.viewport} | ${r.success ? "yes" : "no"} | ${clip(r.reason)} | ${clip((r.unintended ?? []).join("; "))} | ${r.turns}/${r.cap} | ${r.ease ?? "—"} | ${r.maxConfusion} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

const clip = (s) =>
  String(s ?? "")
    .replace(/\|/g, "/")
    .replace(/\s+/g, " ")
    .slice(0, 160);

async function main() {
  const o = args(process.argv.slice(2));
  if (!o.out) throw new Error("usage: round.mjs --scenarios <dir> --out <fresh dir> [...]");
  const out = resolve(o.out);
  mkdirSync(out, { recursive: true });
  const files = readdirSync(o.scenarios)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const scenarios = files
    .map((f) => ({
      path: join(o.scenarios, f),
      ...JSON.parse(readFileSync(join(o.scenarios, f), "utf8")),
    }))
    .filter((s) => !o.only || o.only.includes(s.id));
  const jobs = scenarios.flatMap((s) =>
    Array.from({ length: o.runs }, (_, i) => ({ s, run: i + 1 })),
  );
  console.log(`faculty round: ${jobs.length} session(s), ${o.concurrency} at once → ${out}`);
  const rows = [];
  let next = 0;
  const worker = async (slot) => {
    while (next < jobs.length) {
      const { s, run } = jobs[next++];
      const dir = join(out, `${s.id}-${s.viewport ?? "phone"}-run${run}`);
      if (existsSync(join(dir, "summary.json"))) {
        rows.push(rowOf(s, run, JSON.parse(readFileSync(join(dir, "summary.json"), "utf8"))));
        continue;
      }
      try {
        const summary = await driveChange({
          scenario: s.path,
          out: dir,
          actor: o.actor,
          port: o.port + 4 * slot,
        });
        rows.push(rowOf(s, run, summary));
        console.log(
          `  ${s.id} run ${run}: ${summary.verdict.success ? "landed" : "NOT landed"} — ${summary.verdict.reason}`,
        );
      } catch (e) {
        rows.push(rowOf(s, run, null, e instanceof Error ? e.message : String(e)));
        console.log(`  ${s.id} run ${run}: error — ${e instanceof Error ? e.message : e}`);
      }
      writeFileSync(join(out, "round.json"), `${JSON.stringify(rows, null, 2)}\n`);
      writeFileSync(join(out, "round.md"), roundMarkdown(rows));
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, o.concurrency) }, (_, slot) => worker(slot)));
  writeFileSync(join(out, "round.json"), `${JSON.stringify(rows, null, 2)}\n`);
  writeFileSync(join(out, "round.md"), roundMarkdown(rows));
  console.log(roundMarkdown(rows));
}

if (process.argv[1]?.endsWith("faculty/round.mjs")) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.stack : e);
    process.exitCode = 1;
  });
}
