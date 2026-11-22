// RE-GRADE A ROUND (#change-scenarios) — the current oracle over every session's recorded account,
// no browser, no model, no server. An oracle fix (round 2: a member's own change-in-place read as an
// unasked order) is a re-grade, never a re-run: each session kept `before.json` and `after.json`.
//
//   node scripts/faculty/regrade.mjs <round dir> [--scenarios scripts/faculty/scenarios]
//
// Rewrites each session's `summary.json` verdict (the old one kept as `verdictBefore`), then the
// round's `round.json` and `round.md`. The session's own clock is its summary file's mtime, so an
// option's days-to-expiry is judged as of the run.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gradeChange } from "./oracle.mjs";
import { roundMarkdown, rowOf } from "./round-table.mjs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Whether any turn asked for Backspace or Tab and the recorder refused it as not a key. */
function refusedOfferedKey(turnsPath) {
  if (!existsSync(turnsPath)) return false;
  return readFileSync(turnsPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .some(
      (t) =>
        /key must be one of/.test(t.refused ?? "") && /Backspace|Tab/.test(t.action?.key ?? ""),
    );
}

function main(argv) {
  const dir = argv[0];
  const i = argv.indexOf("--scenarios");
  const scenarios = i >= 0 ? argv[i + 1] : "scripts/faculty/scenarios";
  if (!dir) throw new Error("usage: regrade.mjs <round dir> [--scenarios <dir>]");
  const rows = [];
  for (const name of readdirSync(dir).sort()) {
    const session = join(dir, name);
    const summaryPath = join(session, "summary.json");
    if (!(existsSync(summaryPath) && existsSync(join(session, "after.json")))) continue;
    const summary = read(summaryPath);
    const scenario = read(join(scenarios, `${summary.scenario}.json`));
    const now = statSync(summaryPath).mtime;
    const verdict = gradeChange(
      read(join(session, "before.json")),
      read(join(session, "after.json")),
      scenario.end ?? {},
      now,
    );
    // A session whose page reported a stale build chunk is confounded, whenever it ran.
    const stale = (summary.writes ?? []).some(
      (w) =>
        String(w.url).startsWith("/api/client-error") &&
        /stale-chunk|ChunkLoadError/.test(w.body ?? ""),
    );
    if (stale && !summary.confounded)
      summary.confounded = "the page could not load its code (a stale build chunk)";
    // A member refused a key its own role offered (round 1: the role gained Backspace mid-round while
    // the loaded recorder still refused it) was graded by a broken instrument.
    if (!summary.confounded && refusedOfferedKey(join(session, "turns.jsonl"))) {
      summary.confounded = "the member was refused a key its role offered (Backspace)";
    }
    const changed = JSON.stringify(verdict) !== JSON.stringify(summary.verdict);
    const next = { ...summary, verdict, ...(changed ? { verdictBefore: summary.verdict } : {}) };
    writeFileSync(summaryPath, `${JSON.stringify(next, null, 2)}\n`);
    rows.push(rowOf(scenario, Number(name.match(/run(\d+)$/)?.[1] ?? 1), next));
    if (changed)
      console.log(
        `regrade: ${summary.scenario} ${summary.verdict.success ? "landed" : "not landed"} → ${verdict.success ? "landed" : "not landed"} (${verdict.reason})`,
      );
  }
  writeFileSync(join(dir, "round.json"), `${JSON.stringify(rows, null, 2)}\n`);
  writeFileSync(join(dir, "round.md"), roundMarkdown(rows));
  console.log(`regrade: ${rows.length} session(s) → ${join(dir, "round.md")}`);
}

main(process.argv.slice(2));
