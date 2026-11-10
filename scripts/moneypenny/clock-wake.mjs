#!/usr/bin/env node
import { isMain } from "../is-main.mjs";
// THE CLOCK WAKES THE LANES (2026-11-01, #6470's study: lanes-stop-when-pushes-stop).
//
//   node scripts/moneypenny/clock-wake.mjs      # one tick, from bots-catchup.yml's 15-minute clock
//
// WHAT STOPPED. Every lane wakes on a repository event: a push to main, an issue event, a freed
// build slot (wake.mjs). When all three stop, so do the lanes — main sat 75.8 hours from
// 2026-10-27T13:37Z with research due and a build waiting, and the events workflow ran zero times
// for 75.2 of them. docs/ROUTINES.md's rule was "event-driven first — no crons", with that gap
// accepted on the record as the residual and the calendar-derived wake-ups of #431 named as the
// real fix; #431 closed without shipping them. This REVERSES the rule for one narrow case: on the
// clock the repo already runs, when the events workflow has not started in `QUIET_HOURS`, the dial
// is not halt, and the sweep's own peek or the due list names something admissible, dispatch the
// events workflow as `scan` — the same call the push tick and a freed slot make.
//
// WHAT MAKES IT SAFE. The scan claims through the same admission the push tick uses: the dial's
// in-flight cap, the fast-track-first order, and the per-issue retry limit (#6526, admission.mjs
// `retryHoldReason`: three starts in a UTC day with nothing merged holds the issue until
// midnight), and the peek applies that limit before anything is dispatched. The bound on a build that
// fails every time is not three, though. Two barred issues with nothing merging read as a lane
// outage, which allows one start an hour, up to `OUTAGE_DAY_CAP` (9) each (retry-hold-outage.mjs),
// and that retry waits for a sweep, which this clock now supplies on a quiet day. So a quiet day can
// run up to 12 scans of such builds, each within the dial's in-flight cap, where it used to run none;
// the spend brake counts research legs only, so nothing bounds those sessions in dollars. A dispatch
// is at most one per `QUIET_HOURS`, counted from the run list itself: the scan this starts is a run, so
// the next tick reads "ran 15 minutes ago" and stops at its first read.
//
// WHAT IT COSTS, per tick. The common case — the events workflow ran within the window — is ONE
// REST call (the run list) and nothing else. The quiet case reads the dial (one call at normal,
// three otherwise), then the sweep's peek (about ten: the ready, in-flight and plan lists, the open
// and recently closed PRs, each held issue's events), then only if the peek names nothing, the
// due list (event-scan.mjs locally, plus one PR-heads read), then one dispatch.
//
// WHAT IT NEVER DOES. It never claims, never labels, never flips `ready`, never writes anything
// but the one dispatch, and never acts under `halt`. The measure of what it is for: the hours in
// which admissible work waited with no start, read from this script's own `quiet=… admissible=…`
// line on each tick (docs/ROUTINES.md's row carries the rule).
import { dueForResearch } from "./events.mjs";
import { ghRest, sh } from "./gh.mjs";
import { peekNext } from "./index.mjs";
import { dispatchScan, EVENTS_WORKFLOW } from "./wake.mjs";
import { readWorkMode } from "./work-mode.mjs";

/** How long the events workflow may go without a run before the clock asks whether work waits. */
export const QUIET_HOURS = 2;
/** The one REST read of the common case: the newest run of the events workflow, any event. */
export const EVENTS_RUNS_PATH = `actions/workflows/${EVENTS_WORKFLOW}/runs?per_page=1`;

const hoursText = (h) => `${Math.round(h * 10) / 10}h`;

/** Pure: hours since the newest listed run started, or null when none is on record. */
export function hoursSinceNewestRun(runs, nowMs) {
  const newest = runs?.[0]?.created_at;
  if (!newest) return null;
  const at = Date.parse(newest);
  return Number.isNaN(at) ? null : (nowMs - at) / 3_600_000;
}

/** The due research the route job would dispatch: event-scan's list filtered against open
 *  research PR heads, capped at the dial's research number, exactly as the route job does it. */
export function readDue(mode, { run = sh, rest = ghRest } = {}) {
  const due = JSON.parse(run("node", ["scripts/event-scan.mjs", "--due"]) || "[]");
  if (!Array.isArray(due) || due.length === 0) return [];
  const heads = (rest("pulls?state=open&per_page=100") ?? [])
    .map((p) => p?.head?.ref)
    .filter(Boolean);
  return dueForResearch(due, heads, mode?.caps?.researchPerTick ?? 0);
}

/**
 * One tick. Reads stop at the first answer, cheapest first (see the header). A read that fails
 * costs one skipped tick, said as a warning — never a dispatch and never a red run; a dispatch
 * that fails throws, as wake.mjs's does, because a wake that silently did not happen is the
 * failure this exists to end. Returns `{ dispatched, quiet, admissible, line }`.
 */
export function clockWake({
  now = Date.now(),
  readRuns = () => ghRest(EVENTS_RUNS_PATH)?.workflow_runs,
  readDial = () => readWorkMode(),
  peek = () => peekNext(),
  due = (mode) => readDue(mode),
  dispatch = () => dispatchScan(),
  log = console.log,
} = {}) {
  const skipped = (why) => {
    log(`::warning::clock-wake: ${why}; no dispatch this tick`);
    return { dispatched: false, quiet: null, admissible: null, line: `clock-wake: ${why}` };
  };
  let runs;
  try {
    runs = readRuns();
  } catch (err) {
    return skipped(`the run list could not be read (${String(err?.message ?? err).slice(0, 160)})`);
  }
  if (!Array.isArray(runs)) return skipped("the run list did not come back as a list");
  const hours = hoursSinceNewestRun(runs, now);
  if (hours !== null && hours < QUIET_HOURS) {
    return {
      dispatched: false,
      quiet: hours,
      admissible: null,
      line: `clock-wake: the events workflow ran ${hoursText(hours)} ago; nothing to do`,
    };
  }
  const quiet = hours === null ? "no run on record" : hoursText(hours);
  const mode = readDial();
  if (mode?.position === "halt") {
    return {
      dispatched: false,
      quiet: hours,
      admissible: null,
      line: `clock-wake: quiet=${quiet} dial=halt; no dispatch`,
    };
  }
  let pick = null;
  let dueNow = [];
  try {
    pick = peek();
    if (!pick) dueNow = due(mode);
  } catch (err) {
    return skipped(`the queue could not be read (${String(err?.message ?? err).slice(0, 160)})`);
  }
  const what = pick ? `#${pick.number}` : dueNow.length ? `${dueNow.length} due event(s)` : null;
  if (!what) {
    return {
      dispatched: false,
      quiet: hours,
      admissible: false,
      line: `clock-wake: quiet=${quiet} admissible=no dial=${mode.position}; no dispatch`,
    };
  }
  dispatch();
  return {
    dispatched: true,
    quiet: hours,
    admissible: true,
    line: `clock-wake: quiet=${quiet} admissible=yes (${what}) dial=${mode.position} dispatched=yes`,
  };
}

function main() {
  const { line } = clockWake();
  console.log(`::notice::${line}`);
}

if (isMain(import.meta.url)) main();
