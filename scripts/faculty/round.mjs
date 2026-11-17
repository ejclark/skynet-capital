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

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROLES } from "../study/sealed.mjs";
import { driveChange } from "./drive.mjs";
import { roundMarkdown, rowOf } from "./round-table.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

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
    .filter((s) => !o.only || o.only.includes(s.id))
    // `--only` is also the running order: the scenarios a round most needs answered go first.
    .sort((a, b) => (o.only ? o.only.indexOf(a.id) - o.only.indexOf(b.id) : 0));
  // The round's instrument is frozen at its start: every blind call reads its role prompt per call,
  // so editing the role mid-round told later members about keys the already-loaded recorder still
  // refused (round 1, 2026-11-16: EQ-03 and PM-01 were refused a Backspace their role offered).
  // Copy the role once; every session reads the copy.
  const roles = join(out, "roles");
  mkdirSync(roles, { recursive: true });
  if (!existsSync(join(roles, "actor.md")))
    copyFileSync(join(ROLES, "actor.md"), join(roles, "actor.md"));
  if (!existsSync(join(roles, "ease.md")) && existsSync(join(ROLES, "ease.md"))) {
    copyFileSync(join(ROLES, "ease.md"), join(roles, "ease.md"));
  }
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
  // The misses, read for whoever opens the round next (digest.mjs): no hand-reading of turns.
  spawnSync(process.execPath, [join(HERE, "digest.mjs"), out], { stdio: "inherit" });
  console.log(roundMarkdown(rows));
}

/**
 * A round runs inside the checkout's one heavy-work lock (`scripts/verify-locked.sh`, #5548), the
 * lock every full verify already takes. Three browsers, three servers and three blind members fill
 * a 4-CPU cloud session; on 2026-11-17 a verify started beside a running round ran the container
 * out of memory and killed both, and the way out offered was a push that skipped its verify. With
 * one lock the two queue instead of competing: a push's verify waits for the round (up to
 * VERIFY_LOCK_WAIT, then exit 75, "try again"), and a round started during a verify waits for it.
 * SKYNET_VERIFY_LOCKED marks a process already inside the lock, so the re-run never waits on itself.
 */
function underTheLock(argv) {
  if (process.env.SKYNET_VERIFY_LOCKED === "1") return undefined;
  const self = fileURLToPath(import.meta.url);
  const child = spawnSync(
    "bash",
    [join(HERE, "..", "verify-locked.sh"), "--", "npx", "tsx", self, ...argv],
    { stdio: "inherit" },
  );
  return child.status ?? 1;
}

if (process.argv[1]?.endsWith("faculty/round.mjs")) {
  const locked = underTheLock(process.argv.slice(2));
  if (locked !== undefined) process.exitCode = locked;
  else
    main().catch((e) => {
      console.error(e instanceof Error ? e.stack : e);
      process.exitCode = 1;
    });
}
