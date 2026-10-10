// THE WORLD-FACTS SHEET (#4943) — what the blind task author may ask a member to find, extracted
// mechanically from a COMPOSED world's payloads (the run directory's `<world>/<viewer>.json`, the
// bytes each viewer's page is served), never from the inputs JSON:
//
//   node scripts/study/worlds/facts.mjs --run <compose dir> --world <name> [--viewer <who> …] \
//     [--clock <zone>,<locale>] --out <facts.json>
//
// One fact per stable name (`sauron.NVDA.average-cost`, `sauron.playbook.CRWV-WHEEL.verdict`, …),
// each with the oracle's answer shape and an `answerRegion` — the text the page prints where the
// fact is shown. The rules are facts-sheet.mjs (pure, specced); this file reads the run and hands
// in the app's own formatter where the run's checkout exports it, recording which one it used.
// "The run's checkout" is the one that COMPOSED it (manifest.json → checkout, commit; for an older
// run, the git checkout holding the run dir), never the checkout this script runs from — and it
// must still be at the composed commit. Also writes `dataNames`, the world's own names in the
// payloads, so harvest.mjs can tell data on screen from the interface's words.
// Check the regions against what a member can actually see with harvest.mjs --facts. Times the
// page formats itself are written on `--clock` (../clock.mjs; default the owner's) — the clock the
// census and the members' sessions run on, so a region is text their screens show.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { clockArg, parseClock } from "../clock.mjs";
import { dataNames, factSheet, VERDICT_WORDS_MIRROR } from "./facts-sheet.mjs";

const USAGE =
  "usage: facts.mjs --run <compose dir> --world <name> [--viewer <who> …] [--clock <zone>,<locale>] --out <facts.json>";

function args(argv) {
  const out = { viewers: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value\n${USAGE}`);
    if (flag === "--run") out.run = value;
    else if (flag === "--world") out.world = value;
    else if (flag === "--viewer") out.viewers.push(value);
    else if (flag === "--out") out.out = value;
    else if (flag === "--clock") out.clock = value;
    else throw new Error(`unknown flag ${flag}\n${USAGE}`);
  }
  if (!(out.run && out.world && out.out)) throw new Error(USAGE);
  return out;
}

const git = (dir, args) => {
  const out = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  return out.status === 0 ? out.stdout.trim() : null;
};

/**
 * The checkout that composed the run, at the commit it composed: manifest.json's record, or for a
 * run that predates it, the git checkout holding the run dir. Refused when that checkout has
 * moved off the composed commit — its words may no longer be the run's.
 */
function composedCheckout(run, manifest) {
  const checkout = manifest.checkout ?? git(run, ["rev-parse", "--show-toplevel"]);
  if (!checkout) throw new Error(`facts: cannot tell which checkout composed ${run}`);
  const head = git(checkout, ["rev-parse", "HEAD"]);
  if (manifest.commit && head !== manifest.commit) {
    throw new Error(
      `facts: ${checkout} is at ${head?.slice(0, 8)}, but composed ${run} at ${manifest.commit.slice(0, 8)} — check that commit out there, or compose again`,
    );
  }
  return { checkout, commit: head, recorded: Boolean(manifest.commit) };
}

/** The app's own verdict words when the composing checkout's app exports them (it is
 *  TypeScript: this works under tsx or a Node that strips types), else the specced mirror. */
async function verdictWords(at) {
  const file = join(at.checkout, "app", "src", "live", "heartbeat.ts");
  try {
    const app = await import(pathToFileURL(file).href);
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
  const at = composedCheckout(run, manifest);
  const clock = parseClock(opts.clock);
  const fmt = await verdictWords(at);
  const names = new Set();
  const facts = viewers.flatMap((viewer) => {
    const entries = JSON.parse(readFileSync(join(dir, `${viewer}.json`), "utf8"));
    const payloads = Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, v.body]));
    for (const n of dataNames(payloads)) names.add(n);
    return factSheet({
      viewer,
      instant: manifest.instant,
      payloads,
      verdictWords: fmt.words,
      clock,
    });
  });
  const dupes = facts.map((f) => `${f.viewer}:${f.id}`).filter((k, i, all) => all.indexOf(k) !== i);
  if (dupes.length > 0)
    throw new Error(`fact ids are not unique: ${[...new Set(dupes)].join(", ")}`);
  const sheet = {
    world: opts.world,
    run,
    instant: manifest.instant,
    clock,
    formatters: {
      verdictWords: fmt.from,
      checkout: at.checkout,
      commit: at.commit,
      ...(at.recorded
        ? {}
        : { note: "the run predates manifest.commit; checkout found from the run dir" }),
    },
    dataNames: [...names].sort(),
    facts,
  };
  writeFileSync(resolve(opts.out), `${JSON.stringify(sheet, null, 1)}\n`);
  const per = viewers.map((v) => `${v} ${facts.filter((f) => f.viewer === v).length}`).join(" · ");
  console.log(
    `facts: ${facts.length} facts (${per}) · clock ${clockArg(clock)} · verdict words from ${fmt.from} at ${at.commit?.slice(0, 8)} · ${names.size} data names → ${opts.out}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
