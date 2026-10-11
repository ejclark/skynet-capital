// A study round's middle steps (#4943): the framer (3), the task author with its lint loop and
// the freeze (4), and the member sessions (5). Each reads what earlier steps wrote under <out>/
// and writes its own folder; round.mjs runs them in order. The decisions are round-plan.mjs's.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { clockArg } from "./clock.mjs";
import { SESSIONS } from "./round-contract.mjs";
import { adoptTasks } from "./round-control.mjs";
import { framerText, taskAuthorText } from "./round-messages.mjs";
import {
  gradableFacts,
  isControl,
  lintFeedback,
  planSessions,
  resolveTasks,
  runsOverride,
  taskUnits,
} from "./round-plan.mjs";
import { readSchema, userMessage } from "./sealed.mjs";

/** How many rewrites the task author gets before its still-failing tasks are dropped. */
const REWRITES = 3;
/** The fewest clean tasks a member × world may keep; fewer stops the round. */
const MIN_TASKS = 2;

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, v) => writeFileSync(path, `${JSON.stringify(v, null, 1)}\n`);
const sha256 = (v) => createHash("sha256").update(v).digest("hex");

/** Every card this round wrote, member → text. */
export function readCards(ctx, members) {
  return Object.fromEntries(
    members.map((m) => [m, readFileSync(join(ctx.out, "1-cards", `${m}.md`), "utf8")]),
  );
}

/** Step 3: the framer reads every card and the page list → the job map. */
export async function framer(ctx) {
  const step = "3-framer";
  // A control round re-asks the main round's frozen tasks; the job map only fed their authoring.
  if (isControl(ctx.opts)) return { skipped: "control", from: ctx.source.dir };
  const dir = ctx.dir(step);
  const cards = readCards(ctx, [...new Set(ctx.matrix.map((r) => r.member))]);
  const answer = await ctx.call(step)({
    role: "framer",
    rolePath: join(ctx.roles, "framer.md"),
    schema: readSchema("framer"),
    message: userMessage(framerText({ cards, pages: ctx.p.pages })),
  });
  writeJson(join(dir, "job-map.json"), answer);
  const served = answer.job_map.filter((s) => s.served).map((s) => s.stage);
  return { served, measure: answer.measure.map((m) => m.outcome) };
}

/** The task-author schema with this area's task count. */
function taskSchema(n) {
  const s = JSON.parse(readSchema("task-author"));
  s.properties.tasks.minItems = n;
  s.properties.tasks.maxItems = n;
  return JSON.stringify(s);
}

/** One member × world: write, lint, feed back only the lint's lines, ≤ REWRITES times. */
async function authorUnit(ctx, unit, { jobMap, facts, call }) {
  const step = "4-tasks";
  const card = readFileSync(join(ctx.out, "1-cards", `${unit.member}.md`), "utf8");
  const own = facts.filter((f) => f.world === unit.world && f.viewer === unit.viewer);
  // The lint names the file in its rewrite lines, and those go back to the author: a neutral name,
  // never the unit key, which says the member and the world ("…--profile-bad-day").
  const file = "tasks.json";
  let previous = null;
  let feedback = [];
  for (let round = 0; round <= REWRITES; round++) {
    const answer = await call({
      role: "task-author",
      rolePath: join(ctx.roles, "task-author.md"),
      schema: taskSchema(ctx.p.tasksPer),
      message: userMessage(
        taskAuthorText({ card, jobMap, facts: own, tasksPer: ctx.p.tasksPer, previous, feedback }),
      ),
    });
    const lintDir = join(ctx.out, step, "lint", unit.key, `r${round}`);
    mkdirSync(lintDir, { recursive: true });
    writeJson(join(lintDir, file), answer.tasks);
    const linted = ctx.lint("task", [join(lintDir, file)]);
    const resolved = resolveTasks({ drafts: answer.tasks, facts: own, unit, file });
    feedback = [...lintFeedback(linted.stdout), ...resolved.problems];
    if (linted.status !== 0 && lintFeedback(linted.stdout).length === 0) {
      throw new Error(
        `lint failed without a rewrite line for ${unit.key}: ${linted.stdout.trim()}`,
      );
    }
    ctx.log(step, feedback.length === 0 ? "lint-clean" : "lint-feedback", {
      unit: unit.key,
      round,
      lines: feedback,
    });
    if (feedback.length === 0) return resolved.tasks;
    if (round === REWRITES) {
      const { kept, dropped } = keepClean(resolved.tasks, feedback);
      ctx.log(step, "dropped", { unit: unit.key, dropped, kept: kept.length });
      if (kept.length >= Math.min(MIN_TASKS, ctx.p.tasksPer)) return kept;
      throw new Error(
        `task author for ${unit.key} kept only ${kept.length} clean task(s) after ${REWRITES} rewrites`,
      );
    }
    previous = answer.tasks;
  }
  throw new Error(`task author for ${unit.key}: unreachable`);
}

/** Step 4: tasks per member × world, then frozen with their sha256. */
export async function tasks(ctx) {
  const step = "4-tasks";
  if (isControl(ctx.opts)) return adoptTasks(ctx);
  const dir = ctx.dir(step);
  const jobMap = readJson(join(ctx.out, "3-framer", "job-map.json"));
  const sheet = readJson(join(ctx.out, "0-preflight", "facts.json")).facts;
  // Only facts a census screen showed: a region no screen prints can never be graded (#5009).
  const regionsFile = join(ctx.out, "0-preflight", "harvest", "regions.json");
  const { facts, withheld } = gradableFacts(
    sheet,
    existsSync(regionsFile) ? readJson(regionsFile) : null,
  );
  ctx.log(step, "facts", { gradable: facts.length, withheld: withheld.length });
  const units = taskUnits(ctx.matrix);
  const bare = units.filter(
    (u) => !facts.some((f) => f.world === u.world && f.viewer === u.viewer),
  );
  if (bare.length > 0) {
    throw new Error(
      `no fact on ${bare.map((u) => `${u.world}/${u.viewer}`).join(", ")}'s sheet was seen on a census screen — see 0-preflight/harvest/regions.json`,
    );
  }
  const call = ctx.call(step);
  const all = [];
  for (const unit of units) {
    all.push(...(await authorUnit(ctx, unit, { jobMap, facts, call })));
  }
  mkdirSync(join(dir, "tasks"), { recursive: true });
  for (const t of all) writeJson(join(dir, "tasks", `${t.id}.json`), t);
  const text = `${JSON.stringify(all, null, 1)}\n`;
  writeFileSync(join(dir, "tasks.json"), text);
  const sha = sha256(text);
  writeJson(join(ctx.out, "frozen.json"), {
    tasks: all.length,
    sha256: sha,
    at: new Date().toISOString(),
  });
  ctx.log(step, "frozen", { tasks: all.length, sha256: sha });
  return { tasks: all.length, sha256: sha };
}

/**
 * The frozen task set, held to its freeze: tasks.json must hash to frozen.json's sha256, and every
 * per-task file drive.mjs reads must equal its entry. → id → that task's own sha256.
 */
function checkFreeze(ctx) {
  const text = readFileSync(join(ctx.out, "4-tasks", "tasks.json"), "utf8");
  const frozen = readJson(join(ctx.out, "frozen.json"));
  if (sha256(text) !== frozen.sha256) {
    throw new Error(
      `4-tasks/tasks.json no longer hashes to frozen.json (${frozen.sha256.slice(0, 12)}) — start a fresh --out`,
    );
  }
  // A control's copy must still be the main round's freeze, resumed or not (round-control.mjs).
  if (isControl(ctx.opts) && frozen.sha256 !== ctx.source.frozen) {
    throw new Error(
      `frozen.json (${frozen.sha256.slice(0, 12)}) is not the --frozen-from round's freeze — start a fresh --out`,
    );
  }
  const shas = {};
  for (const t of JSON.parse(text)) {
    const file = join(ctx.out, "4-tasks", "tasks", `${t.id}.json`);
    const same = existsSync(file) && JSON.stringify(readJson(file)) === JSON.stringify(t);
    if (!same)
      throw new Error(`4-tasks/tasks/${t.id}.json is not the frozen task — start a fresh --out`);
    shas[t.id] = sha256(JSON.stringify(t));
  }
  return { frozen: frozen.sha256, shas };
}

/** Run `fn` over `items`, at most `n` at once; results in item order. */
export async function pool(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return results;
}

/** Step 5: every session through drive.mjs --actor sealed, each in its own directory. */
export async function sessions(ctx) {
  const step = SESSIONS;
  const dir = ctx.dir(step);
  const { frozen: frozenSha, shas } = checkFreeze(ctx);
  const frozen = readJson(join(ctx.out, "4-tasks", "tasks.json"));
  const tasksByUnit = {};
  for (const t of frozen) {
    const key = `${t.member}--${t.world}`;
    tasksByUnit[key] = [...(tasksByUnit[key] ?? []), t.id];
  }
  const plan = planSessions({
    p: ctx.p,
    matrix: ctx.matrix,
    tasksByUnit,
    thin: ctx.opts.thin,
    runs: runsOverride(ctx.opts),
  }).map((s) => ({ ...s, taskSha: shas[s.task] }));
  writeJson(join(dir, "plan.json"), plan);
  const n = ctx.opts.concurrency ?? ctx.p.concurrency;
  ctx.log(step, "plan", { sessions: plan.length, concurrency: n, frozen: frozenSha });
  const results = await pool(plan, n, async (s) => {
    const out = join(dir, s.dir);
    // A session is kept only when it ran this exact task: the dir name is positional (t1, t2 …),
    // so a re-authored task set would otherwise inherit sessions recorded against other scenarios.
    const stamp = join(out, "task.sha256");
    const ran = existsSync(stamp) ? readFileSync(stamp, "utf8").trim() : null;
    if (existsSync(join(out, "summary.json")) && ran === s.taskSha) {
      return { ...s, status: 0, kept: true };
    }
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    const args = ["--run", ctx.run, "--world", s.world, "--viewer", s.viewer];
    args.push(
      "--viewport",
      s.viewport,
      "--task",
      join(ctx.out, "4-tasks", "tasks", `${s.task}.json`),
    );
    args.push("--card", join(ctx.out, "1-cards", `${s.member}.md`), "--actor", "sealed");
    args.push("--out", out, "--roles", ctx.roles, "--clock", clockArg(ctx.clock));
    if (ctx.stub) args.push("--stub", ctx.stub);
    const status = await ctx.toolAsync("drive.mjs", args, `${out}.log`);
    const summary = existsSync(join(out, "summary.json"))
      ? readJson(join(out, "summary.json"))
      : null;
    if (status === 0) writeFileSync(stamp, `${s.taskSha}\n`);
    ctx.log(step, status === 0 ? "session" : "session-failed", {
      session: s.dir,
      status,
      turns: summary?.turns,
      success: summary?.oracle?.success,
      ease: summary?.ease?.score,
    });
    return { ...s, status };
  });
  const failed = results.filter((r) => r.status !== 0);
  writeJson(join(dir, "sessions.json"), results);
  if (failed.length > 0) throw new Error(`${failed.length} session(s) failed — see ${dir}/*.log`);
  return { sessions: results.length };
}
