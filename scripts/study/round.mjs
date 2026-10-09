// ONE STUDY ROUND (#4943) — every blind role through a sealed call, against a pinned build.
//
//   node scripts/study/round.mjs --pin <pin dir> --out <dir> --sealed <dir>
//        [--profile scripts/study/tasks/<area>.json] [--thin] [--dry-run] [--stub <dir>]
//        [--concurrency N] [--only-world <name>] [--cap N]
//
// Run from today's checkout (the harness and the role prompts); everything the members see runs
// in the pin (`pin.mjs prepare`), whose harness must be this checkout's — a mismatch re-prepares.
// The answer key is read ONLY through `--sealed <dir>` (keywords.txt + gold.md, for the lint).
//
// THE STEPS, each into <out>/<step>/ and each logged to the append-only <out>/log.jsonl:
//   0 preflight   refuse unless stubbed or the CLI is signed in; the pin's record, a composed run;
//                 census + facts + harvest at the area's cap, if absent       (round-prepare.mjs)
//   1 cards       member cards by script (packets.mjs), linted as cards (priming counted); the
//                 page list linted as a role packet                            (round-prepare.mjs)
//   2 canary      every blind role once — any knowledge fails the round        (round-prepare.mjs)
//   3 framer      cards + page list → job map                                  (round-steps.mjs)
//   4 tasks       per member × world, linted; ONLY the lint's lines go back, ≤ 3 rewrites; frozen
//   5 sessions    drive.mjs --actor sealed per member × world × viewport × task × run, N at once
//   6 analysts    one per member: turns, summaries, key frames at half scale   (round-review.mjs)
//   7 experts     ×N, the census verbatim in batches of ≤ 20, then one consolidation each
//   8 words       the harvested strings
//   9 member types  the cards → proposals
//  10 collect     <out>/findings.jsonl + <out>/classes.json (+ findings-unlabelled.jsonl)
// A step whose <out>/<step>/done.json exists is skipped, so a round resumes where it stopped.
//
// --thin: the area's thin cut (one member · one task · one viewport · one run · one expert over
// one route; no words pass or audit). --dry-run: every call answered from a stub directory
// (default tests/fixtures/study-stub; `--stub <dir>` names another), each request recorded beside
// its answer under <out>/<step>/requests/ — no sign-in, no model. --only-world and --cap narrow a
// dry run; a real round uses the area config's numbers.

import { spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { resolveChromium } from "../shoot/lib.mjs";
import { censusPlan, roundArgs, STEPS, selectMatrix } from "./round-plan.mjs";
import { canary, cards, preflight } from "./round-prepare.mjs";
import { analysts, audit, collect, experts, words } from "./round-review.mjs";
import { framer, sessions, tasks } from "./round-steps.mjs";
import { halfFrame, makeCaller, ROLES } from "./sealed.mjs";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const RUN = {
  "0-preflight": preflight,
  "1-cards": cards,
  "2-canary": canary,
  "3-framer": framer,
  "4-tasks": tasks,
  "5-sessions": sessions,
  "6-analysts": analysts,
  "7-experts": experts,
  "8-words": words,
  "9-member-types": audit,
  "10-collect": collect,
};

/** A harness tool IN THE PIN (its build, its server code), under tsx, into a log file. */
function pinned(ctx, script, args) {
  return [
    process.execPath,
    ["--import", "tsx", join(ctx.pin, "scripts/study", script), ...args],
    { cwd: ctx.pin, env: { ...process.env, STUDY_UNDER_TSX: "1" } },
  ];
}

function tool(ctx, script, args, logFile) {
  const fd = openSync(logFile, "w");
  const [cmd, argv, opts] = pinned(ctx, script, args);
  return spawnSync(cmd, argv, { ...opts, stdio: ["ignore", fd, fd] }).status ?? 1;
}

function toolAsync(ctx, script, args, logFile) {
  const fd = openSync(logFile, "w");
  const [cmd, argv, opts] = pinned(ctx, script, args);
  return new Promise((done) => {
    const child = spawn(cmd, argv, { ...opts, stdio: ["ignore", fd, fd] });
    child.on("close", (code) => done(code ?? 1));
    child.on("error", () => done(1));
  });
}

/** lint.mjs — the gate, as its own process, from this checkout — over packet files. */
function lint(ctx, kind, files) {
  const args = [join(HERE, "scripts/study/lint.mjs"), "--sealed", ctx.sealed, "--kind", kind];
  args.push("--labels", join(ctx.out, "0-preflight/harvest/labels.txt"), ...files);
  const res = spawnSync(process.execPath, args, { encoding: "utf8", cwd: HERE });
  return { status: res.status ?? 1, stdout: res.stdout ?? "" };
}

/** The round's shared state: options, area config, paths, callers, the log, the tools. */
function context(opts) {
  const p = JSON.parse(readFileSync(resolve(opts.profile), "utf8"));
  const out = resolve(opts.out);
  mkdirSync(out, { recursive: true });
  const callers = new Map();
  const ctx = {
    opts,
    p,
    here: HERE,
    pin: resolve(opts.pin),
    run: join(resolve(opts.pin), ".study-run"),
    out,
    roles: ROLES,
    sealed: resolve(opts.sealed),
    stub: opts.stub ? resolve(opts.stub) : null,
    matrix: selectMatrix(p, opts),
    censuses: censusPlan(p, opts),
    dir: (step) => {
      const d = join(out, step);
      mkdirSync(d, { recursive: true });
      return d;
    },
    rel: (path) => relative(out, path),
    log: (step, event, data = {}) => {
      const line = { at: new Date().toISOString(), step, event, ...data };
      appendFileSync(join(out, "log.jsonl"), `${JSON.stringify(line)}\n`);
      console.log(`round ${step} · ${event}${data.note ? ` · ${data.note}` : ""}`);
    },
    /** One caller per step (the stub counts per role), recording under <step>/requests/. */
    call: (step) => {
      if (!callers.has(step)) {
        callers.set(step, makeCaller({ stub: ctx.stub, record: join(out, step, "requests") }));
      }
      return callers.get(step);
    },
    tool: (script, args, logFile) => tool(ctx, script, args, logFile),
    toolAsync: (script, args, logFile) => toolAsync(ctx, script, args, logFile),
    lint: (kind, files) => lint(ctx, kind, files),
    /** A frame at half scale, base64 — one browser for the round, opened on first use. */
    half: async (path) => {
      if (!ctx.browser) {
        const exe = resolveChromium();
        ctx.browser = await chromium.launch(exe ? { executablePath: exe } : {});
      }
      return halfFrame(ctx.browser, readFileSync(path));
    },
  };
  return ctx;
}

async function main(argv) {
  const opts = roundArgs(argv, {
    defaultStub: join(HERE, "tests/fixtures/study-stub"),
    defaultProfile: join(HERE, "scripts/study/tasks/profile.json"),
  });
  const ctx = context(opts);
  ctx.log("round", "start", { argv, thin: opts.thin, dryRun: opts.dryRun, stub: ctx.stub });
  try {
    for (const step of STEPS) {
      const done = join(ctx.out, step, "done.json");
      if (existsSync(done)) {
        ctx.log(step, "skip", { note: "done.json present" });
        continue;
      }
      ctx.log(step, "start");
      const result = (await RUN[step](ctx)) ?? {};
      const stamp = { at: new Date().toISOString(), ...result };
      writeFileSync(join(ctx.dir(step), "done.json"), `${JSON.stringify(stamp, null, 1)}\n`);
      ctx.log(step, "done", result);
    }
  } catch (e) {
    ctx.log("round", "stopped", { note: e instanceof Error ? e.message : String(e) });
    return 1;
  } finally {
    await ctx.browser?.close();
  }
  ctx.log("round", "complete", { findings: "findings.jsonl", classes: "classes.json" });
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    },
  );
}
