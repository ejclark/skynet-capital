// READINESS NOTES — what an issue should carry at the moment it goes `ready`, checked mechanically
// and reported as advice, never as a gate (#4056 slice 1).
//
// WHY THESE CHECKS AND NOT OTHERS. #4056's predictive study scored 158 built issues on what their
// body carried at handoff against whether delivery came out clean (no follow-up fix, reopen or
// stall). Two things tracked clean delivery. The first is scope that fits one delivery unit:
// declared ≤3 PRs was 84% clean vs 68% at ≥4. The second is having no open decision left when the
// build starts: decision-shaped plans with no recorded call were where remainders went idle, and
// #3407 went ready while its IA fork was still open. Format hygiene (mermaid, fold, lint-clean,
// file paths, non-goals) was flat or inverse, 78–80% either way, so none of it appears here: it
// serves the human reader, and issue-lint already owns it.
//
// WHY ADVISORY. The evidence is thin (p≈0.06–0.09, n in the dozens), and a gate built on a thin
// signal is a momentum breaker (CLAUDE.md). The one check a lane may later BLOCK on is parked-while-
// ready, because other lanes depend on that contract (#3818 slice 2 owns the block). Everything here
// is a note the filing session can act on before it flips `ready`. #4056's call sheet carries the
// falsifier that retires the rubric: by 2026-10-31, over ≥20 newly readied items, flagged and
// unflagged clean rates within 5pp.
import { readFileSync } from "node:fs";
import { breachOf } from "./envelope-scan.mjs";
import { PARKING_LABELS, parkedBy } from "./moneypenny/labels.mjs";

// Re-exported so a caller that only needs "is this parked?" imports the readiness surface alone.
export { PARKING_LABELS, parkedBy };

/** Above this many declared PRs an issue is a program, not one delivery unit (#4056). */
export const MAX_UNIT_PRS = 3;

const ENVELOPE_RULES = (() => {
  try {
    const manifest = JSON.parse(readFileSync(new URL("../envelope.json", import.meta.url), "utf8"));
    return manifest.protected ?? [];
  } catch {
    return [];
  }
})();

/** The metadata table's Size cell, or null when the body has none. */
export function sizeCell(body) {
  const row = /^\|\s*\*\*Size\*\*\s*\|\s*(.+?)\s*\|\s*$/im.exec(body);
  return row ? row[1] : null;
}

/**
 * The PR count a Size cell declares, or null when it names none. A range takes its top ("2–3
 * PRs" → 3), and slices count as PRs because every slice ships as at least one ("~9 slices + slice
 * B" → 9). 43 of 158 bodies in the study had a Size cell this cannot read; the note below asks for
 * a leading `~N PRs` so the next report can size them.
 */
export function declaredPrs(cell) {
  if (!cell) return null;
  const m = /(\d+)\s*(?:[–-]|to)?\s*(\d+)?\s*(?:PRs?|slices?|pull requests?)\b/i.exec(cell);
  if (!m) return null;
  return Math.max(Number(m[1]), Number(m[2] ?? 0));
}

// Titles whose job is to reach a decision rather than build one. On the study's plan path these
// went idle after one PR when nothing said what "done" meant (#1977, #2224, #2946).
const DECISION_TITLE =
  /^(decide|investigate|explore|research|rethink|evaluate|study|assess|consider|chart)\b/i;

/** Backticked tokens that look like repo paths — the only paths a body names precisely. */
function namedPaths(body) {
  const paths = new Set();
  for (const [, token] of body.matchAll(/`([^`\s]+)`/g)) {
    const path = token.replace(/:\d+(?:-\d+)?$/, "").replace(/^\/+/, "");
    if (/^[\w.@-]+(?:\/[\w.*@-]+)+$/.test(path)) paths.add(path);
  }
  return [...paths];
}

/** Paths an unattended lane cannot land: the envelope, plus `.claude/`, which the lane harness
 *  refuses even where the envelope does not list it (#1352's `.claude/workflows/grind.js`). */
export function protectedPaths(body, rules = ENVELOPE_RULES) {
  return namedPaths(body).filter((p) => p.startsWith(".claude/") || breachOf(p, rules));
}

const ROUTED = /platter|held PR|hold-merge|Eric merges|Eric's merge|carve-out|protected/i;
const AS_OF = /\b(?:as[ -]of|read at)\b[^\n]{0,60}?\b[0-9a-f]{7,40}\b/i;

/**
 * Advisory readiness notes for one issue. Runs only when the labels say it is (or is about to be)
 * committed work — `ready` or `plan` — because a bare filing is allowed to be rough; `labels`
 * absent means "not checked", matching lintIssue's own contract.
 */
export function readinessNotes({ title = "", body = "", labels } = {}) {
  if (!Array.isArray(labels)) return [];
  const isPlan = labels.includes("plan");
  if (!(isPlan || labels.includes("ready"))) return [];
  const notes = [];
  const say = (text) => notes.push(`readiness: ${text} (#4056)`);

  const parked = parkedBy(labels);
  if (labels.includes("ready") && parked.length) {
    say(
      `ready while parked by ${parked.join(", ")} — no lane should build it; either the flip or the ` +
        "parking label is stale, so say which on the issue",
    );
  }

  const cell = sizeCell(body);
  const prs = declaredPrs(cell);
  if (prs !== null && prs > MAX_UNIT_PRS) {
    say(
      `declares ~${prs} PRs — past one delivery unit (≤${MAX_UNIT_PRS} PRs shipped clean 84% vs 68% ` +
        "at ≥4); split the slices into sub-issues that each fit one",
    );
  } else if (isPlan && prs === null) {
    say("the Size cell names no PR count — lead it with `~N PRs` so the ready report can size it");
  }

  const decisionShaped = DECISION_TITLE.test(title.trim());
  if (decisionShaped && !/done when/i.test(body)) {
    say(
      "a decision-shaped title with no `Done when` line — say what recorded decision ends it, or the " +
        "remainder idles after the first PR",
    );
  }

  const guarded = protectedPaths(body);
  if (guarded.length && !ROUTED.test(body)) {
    say(
      `names protected ${guarded.slice(0, 3).join(", ")} with no route — name the platter or Eric's ` +
        "merge for that step, or the lane stops mid-build",
    );
  }

  if (isPlan && !decisionShaped && !/\bshall\b/i.test(body)) {
    say("a build plan with no WHEN/IF … SHALL criterion — give the builder a check it can run");
  }

  if (isPlan && !AS_OF.test(body)) {
    say(
      "no as-of sha — record the `main` commit the brief was read at, so a pickup can re-check " +
        "what changed since (#3818 criterion 8a)",
    );
  }

  return notes;
}
