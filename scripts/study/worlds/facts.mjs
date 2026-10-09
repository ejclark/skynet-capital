// THE WORLD-FACTS SHEET (#4943) — what the blind task author may ask a member to find, extracted
// mechanically from a COMPOSED world's payloads (the run directory's `<world>/<viewer>.json`, the
// bytes each viewer's page is served), never from the inputs JSON:
//
//   node scripts/study/worlds/facts.mjs --run <compose dir> --world <name> [--viewer <who> …] \
//     --out <facts.json>
//
// One fact per stable name (`sauron.NVDA.average-cost`, `sauron.playbook.CRWV-WHEEL.verdict`, …),
// each with the oracle's answer shape and an `answerRegion` — the text the page prints where the
// fact is shown. The rules are facts-sheet.mjs (pure, specced); this file reads the run and hands
// in the app's own formatter where the run's checkout exports it, recording which one it used.
// Check the regions against what a member can actually see with harvest.mjs --facts.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { factSheet, VERDICT_WORDS_MIRROR } from "./facts-sheet.mjs";

const USAGE =
  "usage: facts.mjs --run <compose dir> --world <name> [--viewer <who> …] --out <facts.json>";

function args(argv) {
  const out = { viewers: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value\n${USAGE}`);
    if (flag === "--run") out.run = value;
    else if (flag === "--world") out.world = value;
    else if (flag === "--viewer") out.viewers.push(value);
    else if (flag === "--out") out.out = value;
    else throw new Error(`unknown flag ${flag}\n${USAGE}`);
  }
  if (!(out.run && out.world && out.out)) throw new Error(USAGE);
  return out;
}

/** The app's own verdict words when the checkout's app exports them (it is TypeScript: this
 *  works under tsx or a Node that strips types), else the specced mirror. */
async function verdictWords() {
  try {
    const app = await import("../../../app/src/live/heartbeat.ts");
    if (app.VERDICT_WORDS) return { words: app.VERDICT_WORDS, from: "app/src/live/heartbeat.ts" };
  } catch {
    // fall through to the mirror
  }
  return { words: VERDICT_WORDS_MIRROR, from: "facts-sheet.mjs mirror" };
}

async function main() {
  const opts = args(process.argv.slice(2));
  const run = resolve(opts.run);
  const manifest = JSON.parse(readFileSync(join(run, "manifest.json"), "utf8"));
  if (!manifest.worlds?.includes(opts.world)) {
    throw new Error(`run ${run} did not compose ${opts.world} (it has: ${manifest.worlds})`);
  }
  const dir = join(run, opts.world);
  const composed = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "compose.json")
    .map((f) => f.slice(0, -5))
    .sort();
  const viewers = opts.viewers.length > 0 ? opts.viewers : composed;
  const missing = viewers.filter((v) => !existsSync(join(dir, `${v}.json`)));
  if (missing.length > 0) throw new Error(`no composed viewer ${missing} (have: ${composed})`);
  const fmt = await verdictWords();
  const facts = viewers.flatMap((viewer) => {
    const entries = JSON.parse(readFileSync(join(dir, `${viewer}.json`), "utf8"));
    const payloads = Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, v.body]));
    return factSheet({ viewer, instant: manifest.instant, payloads, verdictWords: fmt.words });
  });
  const dupes = facts.map((f) => `${f.viewer}:${f.id}`).filter((k, i, all) => all.indexOf(k) !== i);
  if (dupes.length > 0)
    throw new Error(`fact ids are not unique: ${[...new Set(dupes)].join(", ")}`);
  const sheet = {
    world: opts.world,
    run,
    instant: manifest.instant,
    formatters: { verdictWords: fmt.from },
    facts,
  };
  writeFileSync(resolve(opts.out), `${JSON.stringify(sheet, null, 1)}\n`);
  const per = viewers.map((v) => `${v} ${facts.filter((f) => f.viewer === v).length}`).join(" · ");
  console.log(
    `facts: ${facts.length} facts (${per}) · verdict words from ${fmt.from} → ${opts.out}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
