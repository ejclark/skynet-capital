// ONE STUDY ROUND (#4943) — every blind role through a sealed call, against a pinned build.
//
//   node scripts/study/round.mjs --pin <pin dir> --out <dir> --sealed <dir>
//        [--profile scripts/study/tasks/<area>.json] [--thin] [--dry-run] [--stub <dir>]
//        [--concurrency N] [--only-world <name>] [--cap N] [--runs N] [--experts N]
//        [--frozen-from <main round> --control negative|positive --expect <key ids file>]
//
// With --frozen-from it is a CONTROL round (round-control.mjs): the main round's frozen tasks,
// re-verified and copied in, against this --pin — no framer, no task author, no words pass or
// audit, 1 run and 1 expert unless told otherwise, and <out>/control.json for the grader.
//
// Run from today's checkout (the harness and the role prompts); everything the members see runs
// in the pin (`pin.mjs prepare`), whose harness must be this checkout's — a mismatch is refused
// with the prepare command (a pin is shared; re-preparing it in place would pull .study-run out
// from under another round), and a pin with no composed run is prepared.
// The answer key is read ONLY through `--sealed <dir>` (keywords.txt + gold.md, for the lint).
//
// THE STEPS, each into <out>/<step>/ and each logged to the append-only <out>/log.jsonl:
//   0 preflight   the area config; the pin's record (its harness must be this checkout's), a composed run;
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
// The out dir is a round directory exactly as grade.mjs and readout.mjs read it: its layout, the
// finding record and the classes are round-contract.mjs's, owned there for writer and readers both.
// A step whose <out>/<step>/done.json exists is skipped, so a round resumes where it stopped —
// but only under the mode the out dir was made with (<out>/round.json: the profile and its hash,
// the pin, the sealed dir, thin, the stub, --only-world, --cap); any other mode is refused. A real
// round checks the sign-in on every start, resumed or not.
//
// --thin: the area's thin cut (one member · one task · one viewport · one run · one expert over
// one route; no words pass or audit). --dry-run: every call answered from a stub directory
// (default tests/fixtures/study-stub; `--stub <dir>` names another), each request recorded beside
// its answer under <out>/<step>/requests/ — no sign-in, no model. --only-world and --cap narrow a
// dry run; a real round uses the area config's numbers.

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  closeSync,
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
import { roundClock } from "./clock.mjs";
import { FILES, SESSIONS } from "./round-contract.mjs";
import { adoptSource } from "./round-control.mjs";
import {
  censusPlan,
  isControl,
  modeChanges,
  roundArgs,
  roundMode,
  STEPS,
  selectMatrix,
} from "./round-plan.mjs";
import { canary, cards, preflight } from "./round-prepare.mjs";
import { analysts, audit, collect, experts, words } from "./round-review.mjs";
import { framer, sessions, tasks } from "./round-steps.mjs";
import { halfFrame, makeCaller, ROLES, signedIn } from "./sealed.mjs";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const RUN = {
  "0-preflight": preflight,
  "1-cards": cards,
  "2-canary": canary,
  "3-framer": framer,
  "4-tasks": tasks,
  [SESSIONS]: sessions,
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
  try {
    return spawnSync(cmd, argv, { ...opts, stdio: ["ignore", fd, fd] }).status ?? 1;
  } finally {
    closeSync(fd);
  }
}

function toolAsync(ctx, script, args, logFile) {
  const fd = openSync(logFile, "w");
  const [cmd, argv, opts] = pinned(ctx, script, args);
  return new Promise((done) => {
    const child = spawn(cmd, argv, { ...opts, stdio: ["ignore", fd, fd] });
    // The child holds its own copy of the descriptor; ours closes once it has started.
    child.on("spawn", () => closeSync(fd));
    child.on("close", (code) => done(code ?? 1));
    child.on("error", () => {
      try {
        closeSync(fd);
      } catch {
        // already closed after spawn
      }
      done(1);
    });
  });
}

/** lint.mjs — the gate, as its own process, from this checkout — over packet files. */
function lint(ctx, kind, files) {
  const args = [join(HERE, "scripts/study/lint.mjs"), "--sealed", ctx.sealed, "--kind", kind];
  args.push("--labels", join(ctx.out, "0-preflight/harvest/labels.txt"), ...files);
  const res = spawnSync(process.execPath, args, { encoding: "utf8", cwd: HERE });
  return { status: res.status ?? 1, stdout: res.stdout ?? "" };
}

/**
 * The round's shared state: options, area config, paths, callers, the log, the tools. `seams`
 * replace the pinned tools (`tool`, `toolAsync`), the frame scaler (`half`) and the console line
 * (`say`) — for a stub round only, so the end-to-end spec runs with no build and no browser.
 */
function context(opts, seams = {}) {
  const p = JSON.parse(readFileSync(resolve(opts.profile), "utf8"));
  const out = resolve(opts.out);
  mkdirSync(out, { recursive: true });
  const callers = new Map();
  const matrix = selectMatrix(p, opts);
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
    matrix,
    censuses: censusPlan(p, opts),
    // One clock for the round, from the members' own files (clock.mjs): the census, the facts
    // sheet and every session read the page on it.
    clock: roundClock(
      matrix.map((r) => r.member),
      join(HERE, "docs/members"),
    ),
    dir: (step) => {
      const d = join(out, step);
      mkdirSync(d, { recursive: true });
      return d;
    },
    rel: (path) => relative(out, path),
    log: (step, event, data = {}) => {
      const line = { at: new Date().toISOString(), step, event, ...data };
      appendFileSync(join(out, "log.jsonl"), `${JSON.stringify(line)}\n`);
      (seams.say ?? console.log)(`round ${step} · ${event}${data.note ? ` · ${data.note}` : ""}`);
    },
    /** One caller per step (the stub counts per role), recording under <step>/requests/. */
    call: (step) => {
      if (!callers.has(step)) {
        callers.set(step, makeCaller({ stub: ctx.stub, record: join(out, step, "requests") }));
      }
      return callers.get(step);
    },
    tool: seams.tool ?? ((script, args, logFile) => tool(ctx, script, args, logFile)),
    toolAsync:
      seams.toolAsync ?? ((script, args, logFile) => toolAsync(ctx, script, args, logFile)),
    lint: (kind, files) => lint(ctx, kind, files),
    /** A frame at half scale, base64 — one browser for the round, opened on first use. */
    half:
      seams.half ??
      (async (path) => {
        if (!ctx.browser) {
          const exe = resolveChromium();
          ctx.browser = await chromium.launch(exe ? { executablePath: exe } : {});
        }
        return halfFrame(ctx.browser, readFileSync(path));
      }),
  };
  return ctx;
}

/** The out dir's mode, recorded on first start and held on every resume. */
function holdMode(ctx) {
  const profile = resolve(ctx.opts.profile);
  const sha = createHash("sha256").update(readFileSync(profile)).digest("hex");
  const now = roundMode(
    { ...ctx.opts, profile, pin: ctx.pin, sealed: ctx.sealed, stub: ctx.stub },
    sha,
  );
  const file = join(ctx.out, "round.json");
  if (existsSync(file)) {
    const changed = modeChanges(JSON.parse(readFileSync(file, "utf8")), now);
    if (changed.length > 0) {
      throw new Error(
        `${ctx.out} was made under another mode (${changed.join(", ")}) — resume with the same flags, or start a fresh --out`,
      );
    }
    return;
  }
  const finished = STEPS.filter((step) => existsSync(join(ctx.out, step, "done.json")));
  if (finished.length > 0) {
    throw new Error(`${ctx.out} holds finished steps but no round.json — start a fresh --out`);
  }
  writeFileSync(file, `${JSON.stringify(now, null, 1)}\n`);
}

/** One round, start or resume; the exit status. `seams`: see context() — a stub round only. */
export async function runRound(argv, seams = {}) {
  const opts = roundArgs(argv, {
    defaultStub: join(HERE, "tests/fixtures/study-stub"),
    defaultProfile: join(HERE, "scripts/study/tasks/profile.json"),
  });
  if (Object.keys(seams).length > 0 && !opts.stub) {
    throw new Error("a round with its tools replaced must be a stub round (--dry-run or --stub)");
  }
  const ctx = context(opts, seams);
  ctx.log("round", "start", { argv, thin: opts.thin, dryRun: opts.dryRun, stub: ctx.stub });
  try {
    // A control round plans from its main round (thin cut, world), so it reads it before the mode.
    if (isControl(opts)) adoptSource(ctx);
    holdMode(ctx);
    if (!ctx.stub) {
      const auth = signedIn();
      if (!auth.ok) throw new Error(`refusing the round — ${auth.why}`);
      ctx.log("round", "signed-in");
    }
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
  ctx.log("round", "complete", { findings: FILES.findings, classes: FILES.classes });
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runRound(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    },
  );
}
