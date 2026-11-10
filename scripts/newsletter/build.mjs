// The newsletter's numbers as one JSON object (#6872, slice N1). PURE: `buildNewsletter(inputs)`
// reads only what gather.mjs collected (or a fixture), so the same inputs give the same object,
// byte for byte, and a week can be rebuilt later from its saved inputs (`--save-inputs`).
//
// A source gather could not read arrives as its own words ("unavailable: …") and leaves as them:
// the metric reads unknown, and the rest of the object is unaffected.
import { asksDue, openAsks } from "./asks.mjs";
import { decisionsReport } from "./decisions.mjs";
import { knownGaps, memberChanges } from "./member-changes.mjs";
import {
  defects,
  failureToFix,
  fitness,
  loopsMoved,
  mergedByKind,
  needsEric,
  scorecard,
  verifyFirstTry,
} from "./metrics.mjs";
import { auditRecords, paceReading, planBlock, planLogLines } from "./records.mjs";
import { jobRows, tokenSplit } from "./split.mjs";
import { previousWeek, windowOf } from "./week.mjs";

/** The schema's version: bump it when a field changes meaning, so the series can tell readings apart. */
export const SCHEMA = 1;

const isList = Array.isArray;
/** Run `read` over a source, or pass a failed read's words through. */
const over = (source, read) =>
  typeof source === "string" ? source : source == null ? null : read(source);
const within = (ms, w) => ms >= w.sinceMs && ms < w.untilMs;

/** Closed sub-issues of a plan, closed as completed inside the week. */
function closedSubIssues(issues, w) {
  return issues
    .filter((i) => i.parent && i.closedAt && within(Date.parse(i.closedAt), w))
    .sort((a, b) => a.number - b.number)
    .map(({ number, title, parent, closedAt }) => ({ number, title, parent, closedAt }));
}

/** A milestone links to its issue, which holds the whole line; the JSON keeps its opening. */
export const LOG_TEXT_MAX = 200;
const clip = (text) => {
  if (text.length <= LOG_TEXT_MAX) return text;
  const cut = text.slice(0, LOG_TEXT_MAX);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : LOG_TEXT_MAX)}…`;
};

/** Dated Log lines from plan state blocks, by issue then date, each clipped to its opening. */
function planLog(blocks, w) {
  return blocks
    .flatMap((b) =>
      planLogLines(b.body, w).map((line) => ({
        issue: b.issue,
        title: b.title ?? null,
        date: line.date,
        text: clip(line.text),
      })),
    )
    .sort((a, b) => a.issue - b.issue || a.date.localeCompare(b.date));
}

/** Last week's commitments, from the previous newsletter's plan block, as written (N4 scores them). */
function lastWeek(previous, week) {
  const prior = previousWeek(week);
  if (!previous) return { week: prior, source: null, note: `no newsletter for ${prior}` };
  const block = planBlock(previous.md);
  if (block.problem) return { week: prior, source: previous.path, problem: block.problem };
  return { week: prior, source: previous.path, commitments: block.commitments };
}

export function buildNewsletter(inputs) {
  const asOfMs = Date.parse(inputs.asOf);
  const w = windowOf(inputs.week, asOfMs);
  const tracker = typeof inputs.tracker === "string" ? null : inputs.tracker;
  const audits = tracker ? auditRecords(tracker.comments ?? [], w) : [];
  const defectReading = tracker
    ? defects(audits, inputs.localReceipts ?? [], inputs.defectIssues, w)
    : inputs.tracker;
  const rows = jobRows(
    inputs.jobs,
    typeof defectReading === "object" && defectReading?.tokens
      ? { tokens: defectReading.tokens, confirmed: defectReading.pricedConfirmed }
      : null,
  );
  const previous = typeof inputs.previous === "string" ? null : inputs.previous;
  const carriedIn = previous ? (planBlock(previous.md).rolledOver ?? []) : [];
  const decisions = inputs.decisions
    ? decisionsReport(
        { ...inputs.decisions, needsEric: inputs.needsEric },
        { w, asOfMs, priorWeek: previousWeek(w.week) },
      )
    : null;
  const steps = over(inputs.registry, (r) => asksDue({ rows: r, week: w.week, carriedIn }));

  return {
    schema: SCHEMA,
    week: w.week,
    window: { since: w.since, until: w.until, partial: w.partial },
    asOf: new Date(asOfMs).toISOString(),
    metrics: {
      mergedPrs: over(inputs.prs, (prs) => mergedByKind(prs, w)),
      defects: defectReading,
      failureToFix: failureToFix(inputs.failureToFix),
      verifyFirstTry: verifyFirstTry(inputs.jobs, isList(inputs.ciRuns) ? inputs.ciRuns : null),
      tokensPerVerified: rows,
      usage:
        inputs.usageNow === false
          ? `unavailable: #4153 holds only today's pace, which cannot stand for ${w.week}`
          : tracker
            ? paceReading(tracker.title, tracker.body)
            : inputs.tracker,
      needsEric: over(inputs.needsEric, (r) => needsEric(r, asOfMs)),
      playthroughGaps: knownGaps(inputs.journeyGaps),
      memberChanges: memberChanges(inputs.memberPrs, inputs.memberIssues, w),
      fitness: over(inputs.fitness, (f) => fitness(f.contracts, f.issues, w)),
      loops: over(inputs.loopIterations, (r) => loopsMoved(r, w)),
      research: scorecard(inputs.scorecard),
      decisions,
    },
    tokenSplit: tokenSplit(rows),
    milestones: {
      closedSubIssues: over(inputs.subIssues, (i) => closedSubIssues(i, w)),
      planLog: over(inputs.stateBlocks, (b) => planLog(b, w)),
    },
    lastWeek: lastWeek(previous, w.week),
    humanSteps:
      steps && typeof steps === "object" && decisions
        ? { ...steps, openAsks: openAsks(inputs.decisions.snapshot, inputs.needsEric, asOfMs) }
        : steps,
  };
}
