// THE MEMBER-SESSION DRIVER (#4943) — joins the recorder (session.mjs), a composed world (a
// worlds/compose.mjs run directory) and an actor, and grades the result with the oracle.
//
//   node scripts/study/drive.mjs --run <compose run dir> --world <name> --viewer <viewer>
//        --viewport phone|desktop --task <task.json> --card <card.md>
//        --actor scripted:<actions.json>|sealed --out <dir> [--dry-run]
//
// THE LOOP: frame (the viewport JPEG) → the actor's turn → that action through the recorder →
// append the turn and the trace record → repeat, until the member says `done` or `give_up`, or the
// cap — min(2.5 × the task's optimal path, 15) actions — runs out. Then the ease question (1–7, a
// reason at 5 or lower). A turn the recorder refuses (a tap outside the frame) is recorded with
// why, spends no recorder step, and still counts against the cap: a member who keeps trying the
// impossible is a member running out of patience.
//
// WHAT IT WRITES to --out: `turns.jsonl` (the actor's structured turns, same shape whoever played
// the member — schemas/actor-turn.json), `trace.jsonl` + `frames/` (the recorder's), and
// `summary.json` — the task metrics (metrics.mjs), the oracle's verdict (oracle.mjs), the ease
// answer, the world's own log (unstubbed reads, writes recorded and never sent) and the sha256 of
// the task and card, so a run names exactly what it was given.
//
// ACTORS: `scripted:<file>` plays an actions file (actor-turn.mjs → `parseScript`; its ease answer
// comes from the file) — the no-model run that proves the harness and replays across builds.
// `sealed` is the blind member (actor-sealed.mjs); it refuses to start while the standalone CLI is
// signed out. `--dry-run` with `sealed` builds the first turn's message and the half-scale frame,
// writes them, and stops before any call — what the member would see, inspectable.
//
// Needs a built app (`npm run build --prefix app`) and a compose run; run from the repo root. It
// re-runs itself under tsx (the world server imports the server's TypeScript).

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { VIEWPORTS } from "../crawl/steps.mjs";
import { actorMessage, easeMessage, halfFrame, sealedCall, signedIn } from "./actor-sealed.mjs";
import { easeProblems, parseScript, toAction, turnProblems } from "./actor-turn.mjs";
import { textTarget } from "./measure-text.mjs";
import { taskMetrics } from "./metrics.mjs";
import { grade } from "./oracle.mjs";
import { act, close, open, readTrace } from "./session.mjs";
import { loadWorld, rerunUnderTsx } from "./session-world.mjs";
import { actionCap, deviceLine, parseTask } from "./task-file.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROLE = resolve(HERE, "../../docs/members/study/roles/actor.md");
const schema = (name) =>
  JSON.stringify(JSON.parse(readFileSync(join(HERE, "schemas", `${name}.json`), "utf8")));
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const USAGE =
  "usage: drive.mjs --run <dir> --world <name> --viewer <who> --viewport phone|desktop " +
  "--task <task.json> --card <card.md> --actor scripted:<actions.json>|sealed --out <dir> [--dry-run]";

/** The command line, checked; throws the usage line naming what is missing. */
function driveArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const opts = {
    run: get("--run"),
    world: get("--world"),
    viewer: get("--viewer"),
    viewport: get("--viewport") ?? "phone",
    task: get("--task"),
    card: get("--card"),
    actor: get("--actor"),
    out: get("--out"),
    dryRun: argv.includes("--dry-run"),
  };
  const missing = ["run", "world", "viewer", "task", "card", "actor", "out"].filter(
    (k) => !opts[k],
  );
  if (missing.length > 0) throw new Error(`missing --${missing.join(", --")}\n${USAGE}`);
  if (!VIEWPORTS[opts.viewport]) throw new Error(`--viewport must be phone or desktop\n${USAGE}`);
  if (!(opts.actor === "sealed" || opts.actor.startsWith("scripted:")))
    throw new Error(`--actor must be scripted:<actions.json> or sealed\n${USAGE}`);
  if (opts.dryRun && opts.actor !== "sealed") throw new Error("--dry-run is for --actor sealed");
  return opts;
}

/** The scripted actor: the file's turns in order; a text tap resolved against the live frame. */
function scriptedActor(file, session) {
  const { turns, ease } = parseScript(readFileSync(file, "utf8"));
  let next = 0;
  return {
    async turn() {
      const t = turns[next++];
      if (!t) return { ...turns.at(-1), action: { type: "give_up", why: "the script ran out" } };
      const a = t.action;
      if (!(a.type === "tap" && typeof a.text === "string" && a.x === undefined)) return t;
      const at = await session.page.evaluate(textTarget, [a.text, a.nth ?? 0]);
      if (!at) return { ...t, refused: `no visible, uncovered "${a.text}" fully on screen` };
      return { ...t, action: { type: "tap", x: at.x, y: at.y, text: a.text } };
    },
    ease: async () => ease,
  };
}

/** The sealed actor: one blind call per turn, one for the ease question. */
function sealedActor({ card, device, scenario, size, browser }) {
  const turnSchema = schema("actor-turn");
  return {
    async message({ turns, frame, prevFrame, remaining }) {
      const prev = prevFrame ? await halfFrame(browser, readFileSync(prevFrame)) : null;
      const now = readFileSync(frame).toString("base64");
      return actorMessage({
        card,
        device,
        scenario,
        turns,
        prevFrame: prev,
        frame: now,
        size,
        remaining,
      });
    },
    async turn(ctx) {
      const message = await this.message(ctx);
      const turn = sealedCall({ rolePath: ROLE, schema: turnSchema, message });
      const problems = turnProblems(turn);
      return problems.length > 0
        ? { ...turn, refused: `malformed turn: ${problems.join("; ")}` }
        : turn;
    },
    ease: async ({ turns }) =>
      sealedCall({
        rolePath: ROLE,
        schema: schema("ease"),
        message: easeMessage({ card, device, scenario, turns }),
      }),
  };
}

/** Play the actor until done/give_up or the cap; returns the turns and how it ended. */
async function play(session, actor, cap, turnsPath) {
  const turns = [];
  let frame = session.opening.frame;
  let prevFrame = null;
  for (let n = 0; n < cap; n++) {
    const turn = await actor.turn({ turns, frame, prevFrame, remaining: cap - n });
    const action = turn.refused ? { refused: turn.refused } : toAction(turn.action);
    const record = action.refused ? null : await act(session, action);
    const refused = action.refused ?? record?.refused ?? null;
    const entry = { n, ...turn, ...(refused ? { refused } : { step: record.step }) };
    turns.push(entry);
    appendFileSync(turnsPath, `${JSON.stringify(entry)}\n`);
    if (refused) continue;
    if (action.kind === "done" || action.kind === "give_up") return { turns, ended: action.kind };
    if (record.frame) [prevFrame, frame] = [frame, record.frame];
  }
  return { turns, ended: "cap" };
}

/** The run's summary: metrics, oracle, ease, world log, provenance. */
function summarise({ opts, task, world, session, cap, turns, ease, texts }) {
  const tracePath = join(session.runDir, "trace.jsonl");
  const trace = existsSync(tracePath) ? readTrace(session.runDir) : [];
  const { findings, ...metrics } = taskMetrics(trace, {
    startPath: session.startPath,
    optimal: task.optimalViews,
    expectFirst: task.expectFirst,
  });
  const log = session.worldLog;
  return {
    world: world.name,
    viewer: world.viewer,
    viewport: opts.viewport,
    pinnedInstant: world.pinnedInstant,
    run: world.run,
    task: task.id,
    actor: opts.actor,
    cap,
    turns: turns.length,
    refusedTurns: turns.filter((t) => t.refused).length,
    oracle: grade({ task, opening: session.opening, trace }),
    ease: { ...ease, problems: easeProblems(ease) },
    metrics,
    findings,
    worldLog: {
      unstubbed: [...new Set(log?.unstubbed ?? [])],
      writes: log?.writes ?? [],
      blocked: trace.flatMap((r) => r.blocked ?? []),
    },
    inputs: { task: sha256(texts.task), card: sha256(texts.card) },
    frames: session.frames,
  };
}

async function main(argv) {
  const opts = driveArgs(argv);
  if (opts.actor === "sealed" && !opts.dryRun) {
    const auth = signedIn();
    if (!auth.ok) {
      console.error(`drive: refusing the sealed actor — ${auth.why}`);
      return 2;
    }
  }
  const rerun = rerunUnderTsx(import.meta.url, argv);
  if (rerun !== null) return rerun;
  const texts = { task: readFileSync(opts.task, "utf8"), card: readFileSync(opts.card, "utf8") };
  const task = parseTask(texts.task);
  const out = resolve(opts.out);
  if (existsSync(join(out, "trace.jsonl")) || existsSync(join(out, "turns.jsonl")))
    throw new Error(`${out} already holds a run — give each run its own --out`);
  mkdirSync(out, { recursive: true });
  const world = await loadWorld(opts.world, { run: opts.run, viewer: opts.viewer });
  const session = await open({
    world,
    viewport: opts.viewport,
    startPath: task.start,
    runDir: out,
    watch: task.answerRegion,
  });
  const vp = VIEWPORTS[opts.viewport];
  const cap = actionCap(task.optimal);
  let played;
  try {
    const actor =
      opts.actor === "sealed"
        ? sealedActor({
            card: texts.card,
            device: deviceLine(vp),
            scenario: task.scenario,
            size: vp.viewport,
            browser: session.page.context().browser(),
          })
        : scriptedActor(opts.actor.slice("scripted:".length), session);
    if (opts.dryRun) return await dryRun(actor, session, out, cap);
    played = await play(session, actor, cap, join(out, "turns.jsonl"));
    played.ease = await actor.ease({ turns: played.turns });
  } finally {
    await close(session);
  }
  const summary = summarise({ opts, task, world, session, cap, ...played, texts });
  writeFileSync(join(out, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  const o = summary.oracle;
  console.log(
    `drive: ${task.id} · ${world.name}/${world.viewer} @${opts.viewport} · ${summary.turns} turn(s), ended by ${o.endedBy}` +
      ` · ${o.success ? "SUCCESS" : "FAIL"} (${o.reason}) · involuntary scroll ${summary.metrics.involuntaryScroll}px` +
      ` · ease ${summary.ease.score} → ${join(out, "summary.json")}`,
  );
  return 0;
}

/** The first turn's sealed message and a half-scale frame, written for inspection; no call. */
async function dryRun(actor, session, out, cap) {
  const frame = session.opening.frame;
  const message = await actor.message({ turns: [], frame, prevFrame: null, remaining: cap });
  writeFileSync(join(out, "turn-000.message.json"), `${JSON.stringify(message)}\n`);
  const half = await halfFrame(session.page.context().browser(), readFileSync(frame));
  writeFileSync(join(out, "frames", "000-half.jpg"), Buffer.from(half, "base64"));
  const blocks = message.message.content.map((b) =>
    b.type === "text" ? `text ${b.text.length} chars` : `image ${b.source.data.length} b64`,
  );
  console.log(
    `drive --dry-run: first message [${blocks.join(", ")}], half frame → ${join(out, "frames", "000-half.jpg")}`,
  );
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
