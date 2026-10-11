// THE MATCH RUN, ITS PURE HALF (#5218) — matcher 1, matcher 2 and the tie-break over one round's
// findings, through any `call` (sealed.mjs's makeCaller: the real CLI, or a stub). match.mjs reads
// the files and writes matches-1.json, matches-2.json and tiebreak.json; this decides what each
// call is given and what came back short. The rubric the matchers apply is
// docs/members/study/roles/matcher.md; the answer shape is schemas/matcher.json.
//
// WHY A SECOND PASS: round one's matchers ran by hand from one session's scratchpad, and each one
// skipped about one finding in sixty (the fixed-build control, #5099). A skipped finding is not a
// 0: grade.mjs counts it as a problem and refuses the grade. So every call's answer is checked
// against what it was given; whatever it left out is offered again, to the same matcher, in one
// call of its own. What is still missing after that is LISTED, never filled in, and match.mjs
// exits 1 — a guessed label would be a match nobody earned.
//
// The tie-break gets only the findings whose labels differ (grade-core's consensus decides that,
// so a 1-vs-0.5 on the same key item is agreement at the lower score, never a dispute).

import { consensus } from "./grade-core.mjs";
import { pool } from "./round-steps.mjs";

/** Findings per matcher call: small enough that a skip is rare, large enough to stay cheap. */
export const CHUNK = 40;
/** Matcher calls in flight at once, per role. */
const AT_ONCE = 4;

/** `list` in slices of `size`, in order. */
export function chunks(list, size = CHUNK) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** The expect entries as the role reads them: `A3 — the mechanism`, one a line. */
const expectLines = (expect) =>
  expect.map((e) => (e.mechanism ? `- ${e.id} — ${e.mechanism}` : `- ${e.id}`)).join("\n");

/**
 * One matcher call's text: the key, a control's expectations, then the findings one JSON line
 * each. `again` marks the second pass; `answers` (tie-break) puts both matchers' answers on each
 * finding's line.
 */
export function matcherText({ gold, expect = [], findings, again = false, answers = null }) {
  const head = answers
    ? "You are the tie-break. Matcher 1 and matcher 2 disagree on every finding below; each line carries both answers."
    : "You are a matcher. Label every finding below against the key.";
  const parts = [head, "", "## The key (gold.md)", "", gold.trim()];
  if (expect.length > 0) {
    parts.push("", "## This control round's expectations (--expect)", "", expectLines(expect));
  }
  if (again) {
    parts.push(
      "",
      "## Asked again",
      "",
      "Your earlier answer left these findings out. Answer every one of them, in order.",
    );
  }
  const lines = findings.map((f) =>
    JSON.stringify(answers ? { ...f, matcher1: answers.m1[f.id], matcher2: answers.m2[f.id] } : f),
  );
  parts.push("", `## The findings (${findings.length})`, "", ...lines);
  return parts.join("\n");
}

/**
 * What an answer covered of what it was given: `kept` (one entry per given id, the first when
 * repeated), `skipped` (given, not answered) and `stray` (answered, never given — dropped).
 */
export function coverage(givenIds, matches) {
  const given = new Set(givenIds);
  const byId = new Map();
  const stray = [];
  for (const m of matches ?? []) {
    if (!given.has(m.finding)) stray.push(m.finding);
    else if (!byId.has(m.finding)) byId.set(m.finding, m);
  }
  return {
    kept: givenIds.filter((id) => byId.has(id)).map((id) => byId.get(id)),
    skipped: givenIds.filter((id) => !byId.has(id)),
    stray,
  };
}

/** The ids the two matchers label differently — the tie-break's whole input. */
export function disputedIds(ids, m1, m2) {
  const { byId } = consensus({ ids, m1, m2 });
  return ids.filter((id) => byId.get(id).disputed);
}

/**
 * One role over `findings`: chunked calls at once, then ONE second-pass call with whatever came
 * back short. → {matches (in findings order), left (ids still unanswered), stray, calls}.
 * `n` numbers every call explicitly, so a re-run replays the same answers (makeCaller).
 */
export async function runRole({ role, findings, call, ask, size = CHUNK }) {
  const ids = findings.map((f) => f.id);
  const batches = chunks(findings, size);
  const first = await pool(batches, AT_ONCE, async (batch, i) => {
    const answer = await call({ role, n: i + 1, message: ask(batch, false) });
    return coverage(
      batch.map((f) => f.id),
      answer.matches,
    );
  });
  const kept = first.flatMap((c) => c.kept);
  const stray = first.flatMap((c) => c.stray);
  const skipped = new Set(first.flatMap((c) => c.skipped));
  let calls = batches.length;
  if (skipped.size > 0) {
    const again = findings.filter((f) => skipped.has(f.id));
    const answer = await call({ role, n: batches.length + 1, message: ask(again, true) });
    calls += 1;
    const c = coverage(
      again.map((f) => f.id),
      answer.matches,
    );
    kept.push(...c.kept);
    stray.push(...c.stray);
  }
  const byId = new Map(kept.map((m) => [m.finding, m]));
  return {
    matches: ids.filter((id) => byId.has(id)).map((id) => byId.get(id)),
    left: ids.filter((id) => !byId.has(id)),
    stray,
    calls,
  };
}

/** An answer as the tie-break sees it: the label, the score and the one-line why. */
const brief = (m) => (m ? { gold: m.gold, score: m.score, why: m.why } : null);

/**
 * The whole match: matcher 1 and 2 at once over every finding, then the tie-break over their
 * disputes. `message(text)` wraps a text as the call's message (userMessage). → {m1, m2, tiebreak,
 * disputed, left: {m1, m2, tiebreak}, stray, calls}.
 */
export async function runMatch({ findings, gold, expect = [], call, message, size = CHUNK }) {
  const ask = (batch, again) => message(matcherText({ gold, expect, findings: batch, again }));
  const [r1, r2] = await Promise.all(
    ["matcher-1", "matcher-2"].map((role) => runRole({ role, findings, call, ask, size })),
  );
  const ids = findings.map((f) => f.id);
  // A finding either matcher left out cannot be disputed yet; it is listed under `left` instead.
  const both = ids.filter((id) => !(r1.left.includes(id) || r2.left.includes(id)));
  const disputed = disputedIds(both, r1.matches, r2.matches);
  const answers = { m1: {}, m2: {} };
  for (const m of r1.matches) answers.m1[m.finding] = brief(m);
  for (const m of r2.matches) answers.m2[m.finding] = brief(m);
  const tb =
    disputed.length > 0
      ? await runRole({
          role: "tiebreak",
          findings: findings.filter((f) => disputed.includes(f.id)),
          call,
          size,
          ask: (batch, again) =>
            message(matcherText({ gold, expect, findings: batch, again, answers })),
        })
      : { matches: [], left: [], stray: [], calls: 0 };
  return {
    m1: r1.matches,
    m2: r2.matches,
    tiebreak: tb.matches,
    disputed,
    left: { m1: r1.left, m2: r2.left, tiebreak: tb.left },
    stray: { m1: r1.stray, m2: r2.stray, tiebreak: tb.stray },
    calls: r1.calls + r2.calls + tb.calls,
  };
}

/** The run's one-line-per-role account, and whether it covered every finding. */
export function matchReport(total, result) {
  const line = (name, given, left, stray) =>
    `${name}: ${given - left.length}/${given}` +
    (left.length ? ` — left out: ${left.join(", ")}` : "") +
    (stray.length ? ` — answered ids it was never given (dropped): ${stray.join(", ")}` : "");
  const lines = [
    line("matcher 1", total, result.left.m1, result.stray.m1),
    line("matcher 2", total, result.left.m2, result.stray.m2),
    line("tie-break", result.disputed.length, result.left.tiebreak, result.stray.tiebreak),
  ];
  const complete = Object.values(result.left).every((l) => l.length === 0);
  return { lines, complete };
}
