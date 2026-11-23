#!/usr/bin/env node
// THE ROOT RUN (#8005) — places each counted structural problem of a graded round under its IA
// root, and writes the file readout.mjs groups by: <round>/roots.json.
//
//   node scripts/study/root.mjs --round <dir> [--grade <grade.json>] [--ia <docs/IA.md>]
//        [--chunk <n>] [--stub <dir>]
//
// An AWARE step after grading, like the matchers: a sealed call on roles/rooter.md, handed the §10
// ledger rows of `--ia` (default docs/IA.md) and the lead problem of each structural group
// grade.json counted (id, where, what), in chunks of --chunk (default 40). New roots named in one
// chunk are handed to the next, so one root keeps one name. It places; it never re-grades — what
// was counted, and how bad it is, stay grade.json's. What a call leaves out is asked once more;
// anything still unplaced is printed by id and the run exits 1, and the readout then shows it under
// "not yet placed" rather than guessing. Calls are recorded under <round>/root/requests/ (a re-run
// replays them; usage.mjs prices them). `--stub` answers from <dir>/rooter/<n>.json.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isMain } from "./compat.mjs";
import { ledgerRows, parseRoot, readPlacings, rooterText } from "./ia-roots.mjs";
import { FILES } from "./round-contract.mjs";
import { readJson, readJsonl } from "./round-files.mjs";
import { makeCaller, ROLES, readSchema, signedIn, userMessage } from "./sealed.mjs";
import { readRequests, sumUsage } from "./usage.mjs";

const USAGE =
  "usage: root.mjs --round <dir> [--grade <grade.json>] [--ia <IA.md>] [--chunk <n>] [--stub <dir>]";
/** The recorded calls' folder inside the round. */
export const ROOT_DIR = "root";
const CHUNK = 40;
const TIMEOUT_MS = 10 * 60_000;

/** The command line, checked; throws the usage line naming what is missing. */
export function rootArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const opts = {
    round: get("--round"),
    grade: get("--grade"),
    ia: get("--ia") ?? "docs/IA.md",
    chunk: Number(get("--chunk") ?? CHUNK),
    stub: get("--stub"),
  };
  if (!opts.round) throw new Error(`missing --round\n${USAGE}`);
  if (!(Number.isInteger(opts.chunk) && opts.chunk > 0)) throw new Error(`bad --chunk\n${USAGE}`);
  return opts;
}

/**
 * Place every lead problem, chunk by chunk, asking once more for what a call left out.
 * `call(text)` → the rooter's answer. Resolves to `{roots, left, calls}`.
 */
export async function runRoot({ leads, rows, size, call }) {
  const roots = {};
  const named = [];
  let calls = 0;
  for (let i = 0; i < leads.length; i += size) {
    let ask = leads.slice(i, i + size);
    for (let pass = 0; pass < 2 && ask.length > 0; pass++) {
      calls += 1;
      const answer = await call(rooterText({ rows, named, findings: ask }));
      const { placed, skipped } = readPlacings(answer, {
        asked: new Set(ask.map((f) => f.id)),
        rows,
      });
      Object.assign(roots, placed);
      for (const root of Object.values(placed)) {
        const r = parseRoot(root);
        if (r?.kind === "new" && !named.includes(r.name)) named.push(r.name);
      }
      ask = ask.filter((f) => skipped.includes(f.id));
    }
  }
  return { roots, left: leads.filter((f) => !(f.id in roots)).map((f) => f.id), calls };
}

/** Runs the placing and writes roots.json; resolves to the exit code. */
export async function main(argv) {
  const opts = rootArgs(argv);
  const round = resolve(opts.round);
  const grade = readJson(opts.grade ? resolve(opts.grade) : join(round, FILES.grade));
  const text = new Map(readJsonl(join(round, FILES.findings)).map((f) => [f.id, f]));
  const leads = Object.values(grade.structural?.groups ?? {})
    .map((ids) => text.get(ids[0]))
    .filter(Boolean);
  if (leads.length === 0) {
    console.log("root: no counted structural problems to place");
    return 0;
  }
  const rows = ledgerRows(readFileSync(resolve(opts.ia), "utf8"));
  if (rows.length === 0) throw new Error(`${opts.ia} holds no §10 ledger rows`);
  if (!opts.stub) {
    const auth = signedIn();
    if (!auth.ok) throw new Error(auth.why);
  }
  const caller = makeCaller({
    stub: opts.stub && resolve(opts.stub),
    record: join(round, ROOT_DIR, "requests"),
  });
  const rolePath = join(ROLES, "rooter.md");
  const schema = readSchema("rooter");
  const result = await runRoot({
    leads,
    rows,
    size: opts.chunk,
    call: (t) =>
      caller({ role: "rooter", rolePath, schema, message: userMessage(t), timeoutMs: TIMEOUT_MS }),
  });
  mkdirSync(join(round, ROOT_DIR), { recursive: true });
  writeFileSync(join(round, FILES.roots), `${JSON.stringify(result.roots, null, 1)}\n`);
  const cost = sumUsage(readRequests(join(round, ROOT_DIR)));
  const placedCount = Object.keys(result.roots).length;
  console.log(
    `root: placed ${placedCount} of ${leads.length} · ${result.calls} calls · ${cost.replayed} replayed · $${cost.cost_usd} (the CLI's estimate)`,
  );
  if (result.left.length > 0) {
    console.error(`root: still unplaced after the second ask: ${result.left.join(", ")}`);
    return 1;
  }
  return 0;
}

if (isMain(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      console.error(e.message);
      process.exitCode = 2;
    },
  );
}
