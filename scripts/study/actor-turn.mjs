// One simulated member turn, checked and turned into a recorder action (#4943) — PURE, specced in
// tests/scripts/study-drive.spec.ts. Both actors produce the same turn shape
// (schemas/actor-turn.json): the sealed model through `--json-schema`, the scripted actor from an
// actions file with defaults filled in. So turns.jsonl reads the same whoever played the member,
// and the analyst downstream never needs to know which.
//
// The turn's `action` uses `type` (what the member chose); the recorder's action uses `kind`
// (session.mjs). The mapping is here and nowhere else; the recorder still refuses what cannot be
// performed in the frame (metrics.mjs → `actionRefusal`).

/** The role prompt's cap on what a member says it noticed. */
const NOTICED_WORDS = 60;

const VERDICTS = new Set(["match", "partial", "surprise"]);
const words = (s) =>
  String(s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

/** Problems with a turn's talk (not its action): [] when it is a usable turn. */
export function turnProblems(turn) {
  if (!turn || typeof turn !== "object") return ["a turn is an object"];
  const out = [];
  for (const k of ["as_member", "noticed", "expect"])
    if (typeof turn[k] !== "string") out.push(`${k} must be text`);
  if (words(turn.noticed) > NOTICED_WORDS) out.push(`noticed runs past ${NOTICED_WORDS} words`);
  const cands = turn.candidates;
  if (!(Array.isArray(cands) && cands.length <= 3)) out.push("candidates: a list of at most 3");
  else if (!cands.every((c) => typeof c?.target === "string" && isInt(c?.confidence, 0, 100)))
    out.push("each candidate needs a target and a confidence 0–100");
  if (!VERDICTS.has(turn.last_expectation?.verdict))
    out.push("last_expectation.verdict must be match, partial or surprise");
  if (!isInt(turn.confusion, 0, 3)) out.push("confusion must be 0–3");
  if (!turn.action || typeof turn.action.type !== "string") out.push("action.type is required");
  return out;
}

/**
 * The recorder action for a turn's action, or `{refused}` when the turn did not say enough to act
 * (a `done` with no answer, a tap with no point). What the frame forbids is the recorder's call.
 */
export function toAction(a) {
  switch (a?.type) {
    case "tap":
    case "hover":
      return { kind: a.type, x: a.x, y: a.y };
    case "scroll":
      return { kind: "scroll", dir: a.dir, screens: a.screens };
    case "type":
      return { kind: "type", text: a.text };
    case "key":
      return { kind: "key", key: a.key };
    case "back":
      return { kind: "back" };
    case "done":
      return typeof a.answer === "string" && a.answer.trim()
        ? { kind: "done", answer: a.answer.trim() }
        : { refused: "done needs an answer" };
    case "give_up":
      return { kind: "give_up", why: String(a.why ?? "").trim() };
    default:
      return { refused: `unknown action ${a?.type ?? "(none)"}` };
  }
}

/** The ease answer, checked: a score 1–7, and a reason whenever it is 5 or lower. */
export function easeProblems(ease) {
  if (!isInt(ease?.score, 1, 7)) return ["ease score must be 1–7"];
  if (ease.score <= 5 && !String(ease.reason ?? "").trim())
    return ["a score of 5 or lower needs a reason"];
  return [];
}

/** A scripted turn with the talk a script does not carry filled in, so it fits the turn shape. */
function scriptedTurn(raw, i) {
  return {
    as_member: raw.as_member ?? "(scripted)",
    noticed: raw.noticed ?? "",
    candidates: raw.candidates ?? [],
    expect: raw.expect ?? "",
    last_expectation: raw.last_expectation ?? { verdict: "match", note: "scripted" },
    confusion: raw.confusion ?? 0,
    action: raw.action,
    ...(i === undefined ? {} : { scripted: i }),
  };
}

/**
 * A scripted actor's file: `{turns: [{action, …talk?}], ease: {score, reason}}`. A tap may name
 * on-screen `text` instead of a point (`{type: "tap", text, nth?}`) — the script's finger, resolved
 * against the live frame by the driver — so one script replays on two builds whose layouts differ.
 */
export function parseScript(text) {
  const file = JSON.parse(text);
  if (!Array.isArray(file?.turns) || file.turns.length === 0)
    throw new Error("actions file: `turns` must list at least one turn");
  const turns = file.turns.map((raw, i) => scriptedTurn(raw, i));
  const problems = turns.flatMap((t, i) => turnProblems(t).map((p) => `turn ${i}: ${p}`));
  problems.push(...easeProblems(file.ease).map((p) => `ease: ${p}`));
  if (problems.length > 0) throw new Error(`actions file: ${problems.join("; ")}`);
  return { turns, ease: { score: file.ease.score, reason: file.ease.reason ?? "" } };
}
