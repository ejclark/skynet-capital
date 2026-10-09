// THE ORACLE (#4943) — whether a simulated member actually got the task done. PURE: it reads the
// task file, the session's opening frame and its trace, and never a browser. Specced in
// tests/scripts/study-oracle.spec.ts.
//
// WHY AN ORACLE AND NOT THE MEMBER'S WORD: a member that says "done" may have guessed, read the
// wrong row, or answered from what it expected to find. So success needs BOTH halves:
//  1. the answer it gave with `done` matches the task's answer — a number within the task's
//     absolute or relative tolerance, or text whose every token is in the answer (case-blind); and
//  2. the place that answer lives (`answerRegion`: one or more text snippets) was at least half
//     inside the viewport, uncovered, in at least one frame the member saw BEFORE it said done.
// Neither half looks at the route, the path taken or where on the page the answer sat: two members
// who find it two different ways both succeed. How they got there is measured (metrics.mjs), never
// graded.
//
// Area-agnostic: tasks bring every value; nothing here names a surface.

/** A snippet counts as seen when at least this share of its text is inside the viewport. */
export const SEEN_MIN = 0.5;
/** More distinct numbers than this in one answer is a list of everything, which answers nothing. */
export const MAX_NUMBERS = 4;

const MINUS = /[-−–]/;
const NUMBER = /([-−–]\s*)?\$?\s*([-−–]\s*)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*([km](?![a-z]))?/gi;

/** Every number written in a free-text answer: "$1,056", "-$412", "−8.32%", "1.2k", "$-3". */
export function numbersIn(text) {
  const out = [];
  for (const m of String(text ?? "").matchAll(NUMBER)) {
    const negative = MINUS.test(m[1] ?? "") || MINUS.test(m[2] ?? "");
    let n = Number(`${m[3].replace(/,/g, "")}${m[4] ?? ""}`);
    const scale = (m[5] ?? "").toLowerCase();
    if (scale === "k") n *= 1_000;
    if (scale === "m") n *= 1_000_000;
    out.push(negative ? -n : n);
  }
  return out;
}

/** Lower-cased word tokens (letters and digits), accents folded. */
export function tokens(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Is `n` within the expected number's tolerance? `abs` and `rel` are alternatives: either holds. */
export function withinTolerance(n, { value, abs = 0, rel = 0, ignoreSign = false }) {
  const [a, b] = ignoreSign ? [Math.abs(n), Math.abs(value)] : [n, value];
  const gap = Math.abs(a - b);
  return gap <= abs + 1e-9 || gap <= Math.abs(b) * rel + 1e-9;
}

/**
 * Grade one answer against a task's `answer`:
 *   {kind: "number", value, abs?, rel?, ignoreSign?}   any number in the answer within tolerance
 *   {kind: "text", value, alternatives?}               every token of value (or one alternative)
 * → `{matched, why}`.
 */
export function gradeAnswer(given, expected) {
  if (typeof given !== "string" || given.trim() === "") return { matched: false, why: "no answer" };
  if (expected?.kind === "number") {
    const found = [...new Set(numbersIn(given))];
    if (found.length === 0) return { matched: false, why: "no number in the answer" };
    if (found.length > MAX_NUMBERS) {
      return {
        matched: false,
        why: `${found.length} numbers in one answer — it lists, it does not answer`,
      };
    }
    const hit = found.find((n) => withinTolerance(n, expected));
    return hit === undefined
      ? { matched: false, why: `${found.join(", ")} not within tolerance of ${expected.value}` }
      : { matched: true, why: `${hit} ≈ ${expected.value}` };
  }
  if (expected?.kind === "text") {
    const have = new Set(tokens(given));
    const options = [expected.value, ...(expected.alternatives ?? [])];
    const hit = options.find((o) => {
      const want = tokens(o);
      return want.length > 0 && want.every((t) => have.has(t));
    });
    return hit === undefined
      ? { matched: false, why: `none of ${JSON.stringify(options)} in the answer` }
      : { matched: true, why: `"${hit}" in the answer` };
  }
  return { matched: false, why: `task answer kind ${expected?.kind} is not number or text` };
}

/**
 * Was any of the region's snippets seen — ≥ SEEN_MIN inside the viewport and not covered — in any
 * of `frames` (each a `seen` list as session.mjs records it)? Returns the first frame that showed it.
 */
export function regionSeen(frames, region) {
  const want = new Set((Array.isArray(region) ? region : [region]).filter(Boolean));
  let best = 0;
  for (const [i, seen] of frames.entries()) {
    for (const s of seen ?? []) {
      if (!want.has(s.text)) continue;
      const ratio = s.covered ? 0 : s.ratio;
      best = Math.max(best, ratio);
      if (ratio >= SEEN_MIN) return { seen: true, frame: i, ratio };
    }
  }
  return { seen: false, frame: null, ratio: best };
}

/**
 * The verdict on one session. `opening` is the session's first frame (`{seen}`); `trace` its
 * records. Frames before the member's terminal action count; a run with no `done` (it gave up, or
 * ran out of steps) fails whatever it saw.
 */
export function grade({ task, opening, trace }) {
  const recs = trace.filter((r) => !r.refused);
  const endAt = recs.findIndex((r) => r.action.kind === "done" || r.action.kind === "give_up");
  const end = endAt >= 0 ? recs[endAt] : null;
  const before = endAt >= 0 ? recs.slice(0, endAt) : recs;
  const frames = [opening?.seen ?? [], ...before.map((r) => r.seen ?? [])];
  const region = regionSeen(frames, task.answerRegion);
  const endedBy = end ? end.action.kind : "cap";
  const answer =
    endedBy === "done"
      ? { given: end.action.answer ?? "", ...gradeAnswer(end.action.answer, task.answer) }
      : {
          given: null,
          matched: false,
          why: endedBy === "give_up" ? "gave up" : "ran out of steps",
        };
  const success = endedBy === "done" && answer.matched && region.seen;
  const reason = success
    ? "answer matches and its place was on screen"
    : !answer.matched
      ? answer.why
      : `answer region never ≥ ${SEEN_MIN * 100}% on screen (best ${Math.round(region.ratio * 100)}%)`;
  return { success, endedBy, answer, region, reason };
}
