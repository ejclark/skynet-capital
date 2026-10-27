// THE HARVEST (#4943) — the interface's own words, taken from the census walk (census.mjs writes
// walk.json beside census.json), never typed by hand:
//
//   node scripts/study/harvest.mjs --out <dir> [--facts <facts.json>] <census dir> [<census dir> …]
//
//  - labels.txt   every control's accessible name + every heading, de-duplicated, one per line —
//                 the interface-label list `scripts/study/lint.mjs --labels` bans from task text.
//                 Names no screen showed are banned under a marking comment; names that are the
//                 world's data or the facts sheet's own words (with --facts), carry no word, or
//                 are one short word are set aside, commented out with why (harvest-plan.mjs).
//  - strings.json visible text by route and by kind (heading · button/link · label · short status
//                 < 60 chars · long text) — the words pass's input.
//  - with --facts (worlds/facts.mjs → facts.json): regions.json, which facts' answer regions the
//    walk actually saw on screen — a fact whose region no screen shows cannot be graded.
//
// Pure file work over walk.json; every rule is harvest-plan.mjs (specced, tests/scripts/).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  factWords,
  groupStrings,
  KINDS,
  labelSheet,
  labelsText,
  regionCoverage,
} from "./harvest-plan.mjs";

const USAGE = "usage: harvest.mjs --out <dir> [--facts <facts.json>] <census dir> [<census dir> …]";

function args(argv) {
  const out = { dirs: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out.out = argv[++i];
    else if (argv[i] === "--facts") out.facts = argv[++i];
    else if (argv[i].startsWith("--")) throw new Error(`unknown flag ${argv[i]}\n${USAGE}`);
    else out.dirs.push(argv[i]);
  }
  if (!out.out || out.dirs.length === 0) throw new Error(USAGE);
  return out;
}

/** Every walk of every census dir, each carrying its census's viewer. */
function readWalks(dirs) {
  return dirs.flatMap((dir) => {
    const path = join(resolve(dir), "walk.json");
    if (!existsSync(path)) throw new Error(`${dir} holds no walk.json — run census.mjs first`);
    const file = JSON.parse(readFileSync(path, "utf8"));
    return file.walks.map((w) => ({ ...w, viewer: file.viewer, world: file.world }));
  });
}

function main() {
  const opts = args(process.argv.slice(2));
  const walks = readWalks(opts.dirs);
  const out = resolve(opts.out);
  mkdirSync(out, { recursive: true });
  const sheet = opts.facts ? JSON.parse(readFileSync(opts.facts, "utf8")) : null;
  const labels = labelSheet(walks, {
    dataNames: sheet?.dataNames ?? [],
    vocabulary: sheet ? factWords(sheet.facts) : [],
  });
  writeFileSync(join(out, "labels.txt"), labelsText(labels));
  const strings = groupStrings(walks);
  const head = {
    worlds: [...new Set(walks.map((w) => w.world))],
    viewers: [...new Set(walks.map((w) => w.viewer))],
  };
  writeFileSync(join(out, "strings.json"), `${JSON.stringify({ ...head, ...strings }, null, 1)}\n`);
  const why = (w) => labels.setAside.filter((s) => s.why === w).length;
  console.log(
    `harvest: ${walks.length} walk(s) → labels.txt ${labels.banned.length} banned · ${labels.unseen.length} banned, never on screen · set aside ${labels.setAside.length} (data ${why("data")} · facts sheet ${why("facts sheet")} · short ${why("short")} · no words ${why("no words")})`,
  );
  if (!sheet)
    console.log("harvest: no --facts — data names and the facts sheet's words stay banned");
  console.log(`harvest: strings.json ${KINDS.map((k) => `${k} ${strings.counts[k]}`).join(" · ")}`);
  if (sheet) {
    const regions = regionCoverage(sheet.facts, walks);
    writeFileSync(join(out, "regions.json"), `${JSON.stringify(regions, null, 1)}\n`);
    console.log(`harvest: answer regions seen for ${regions.covered}/${regions.judged} facts`);
    for (const id of regions.missing) console.log(`  not on any screen walked: ${id}`);
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
