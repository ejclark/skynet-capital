// A study task file, read and checked (#4943) — PURE, specced in tests/scripts/study-drive.spec.ts.
// Area-agnostic: a task brings its own scenario, start and answer; this only checks the shape.
//
//   {
//     "id": "short-id",
//     "scenario": "what the member is told — a goal and a fact to report, never a route",
//     "start": "/app/…",            // where the session opens; never shown to the member
//     "optimal": 4,                 // the shortest path in actions (default 6) → the action cap
//     "optimalViews": 3,            // optional: the fewest views it takes → lostness (metrics.mjs)
//     "answer": {"kind": "number", "value": 412, "abs": 1, "rel": 0.01, "ignoreSign": true}
//            | {"kind": "text", "value": "…", "alternatives": ["…"]},
//     "answerRegion": ["text snippet", …],   // where the answer lives; the oracle needs one seen
//     "expectFirst": {"role": "button", "name": "…"}   // optional: the right first tap
//   }
//
// The scenario is the only field a member ever reads. `start`, `answer` and `answerRegion` stay
// with the harness, so a task can name where its answer lives without telling the member.

/** The default shortest path when a task does not say. */
const DEFAULT_OPTIMAL = 6;
/** The hard ceiling on actions in one session, whatever the task's optimal path. */
const MAX_ACTIONS = 15;

/** The action cap: min(2.5 × the optimal path, 15), never below 1. */
export function actionCap(optimal = DEFAULT_OPTIMAL) {
  return Math.max(1, Math.min(Math.floor(2.5 * optimal), MAX_ACTIONS));
}

const isText = (v) => typeof v === "string" && v.trim().length > 0;

function answerProblems(a) {
  if (!a || typeof a !== "object") return ["answer is required"];
  if (a.kind === "number") {
    const out = Number.isFinite(a.value) ? [] : ["answer.value must be a number"];
    for (const k of ["abs", "rel"])
      if (a[k] !== undefined && !(Number.isFinite(a[k]) && a[k] >= 0))
        out.push(`answer.${k} must be a number ≥ 0`);
    return out;
  }
  if (a.kind === "text") {
    const alts = a.alternatives ?? [];
    return isText(a.value) && Array.isArray(alts) && alts.every(isText)
      ? []
      : ["a text answer needs a non-empty value (and string alternatives)"];
  }
  return ["answer.kind must be number or text"];
}

/** A task's problems, or [] when it is usable. */
export function taskProblems(task) {
  if (!task || typeof task !== "object") return ["a task is a JSON object"];
  const out = [];
  if (!isText(task.id)) out.push("id is required");
  if (!isText(task.scenario)) out.push("scenario is required");
  if (!(isText(task.start) && task.start.startsWith("/"))) out.push("start must be a path");
  if (task.optimal !== undefined && !(Number.isInteger(task.optimal) && task.optimal > 0))
    out.push("optimal must be a positive integer");
  out.push(...answerProblems(task.answer));
  const region = task.answerRegion;
  if (!(Array.isArray(region) && region.length > 0 && region.every(isText)))
    out.push("answerRegion must list at least one text snippet");
  return out;
}

/** Parse a task file's text; throws listing every problem. */
export function parseTask(text) {
  const task = JSON.parse(text);
  const problems = taskProblems(task);
  if (problems.length > 0) throw new Error(`task file: ${problems.join("; ")}`);
  return { optimal: DEFAULT_OPTIMAL, ...task };
}

/** The one line that tells a member what they are holding (from a VIEWPORTS entry). */
export function deviceLine({ viewport, hasTouch }) {
  const size = `${viewport.width}×${viewport.height}`;
  return hasTouch
    ? `You are on your phone (a ${size} touch screen): you tap and scroll with a finger.`
    : `You are on a computer (a ${size} browser window): you click, scroll and can hover with a mouse.`;
}
