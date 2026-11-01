// THE CLOCK'S WATCHER — the push-tick audit reads whether the one schedule in this repo is ticking.
//
// WHY (#6470: clock-has-no-watcher, nothing-watches-the-clock). bots-catchup.yml's 15-minute cron
// is the only schedule here, and since #6476 it is more than a redeploy lever: it starts a stopped
// bots machine and runs the fitness contracts (`scripts/fitness.mjs --report`), so a clock that
// stops silences every contract at once and nobody is told — a schedule GitHub pauses after 60
// days without repository activity, a workflow someone disables, a runner outage. Nothing read
// whether it was ticking: the fitness contracts cannot watch the clock they ride, and the repair
// lane watches failed runs, not runs that never start.
//
// WHAT IT READS. The newest SUCCESSFUL scheduled run — `event=schedule&status=success` — not the
// newest run: a tick that started and died is not a tick, and a run of the dispatch button is not
// the schedule. One REST call per push tick, the Actions list the deploy-lag scan already reads.
// The open issue is found in the audit's own open-issue list, so the watch costs no second call.
//
// WHAT IT DOES. While the newest successful scheduled run is older than `CLOCK_STALE_HOURS` it keeps
// exactly ONE issue, `[fitness] clock-running`, as a `bug` assigned to the owner — the same shape
// and reach as the issues fitness.mjs files, since re-enabling a workflow is his click, not a
// lane's (the cut list of #6470 keeps the clock off the repair lane: every clock failure on record
// was a flyctl install step, and a stopped schedule still reaches nobody). The open issue is its
// own memory; when a successful scheduled run is fresh again the issue closes with the reason.
//
// SAID PLAINLY: this rides the push tick, so a stopped clock is noticed at the NEXT MERGE TO MAIN,
// not within 3 hours. Gaps between pushes reached 75.8h in the 17 days before this was written. A
// merge-quiet stretch still watches nothing; the digest's quiet reason (digest-scan.mjs) is the
// net under that, and a clock the pushes cannot see is the residual docs/ROUTINES.md records.
// The threshold sits above the largest honest tick gap seen (116 minutes, 2026-10) with room: 3h
// is twelve missed ticks, never one slow one.
import { ERIC } from "./decision-callout.mjs";
import { ghRest, sh } from "./gh.mjs";
import { FOOTER } from "./labels.mjs";

/** The one scheduled workflow (docs/ROUTINES.md → Active → Bots deploy catch-up). */
export const CLOCK_WORKFLOW = "bots-catchup.yml";
/** How old the newest successful scheduled run may be before the clock reads as stopped. */
export const CLOCK_STALE_HOURS = 3;
/** The issue this keeps — `[fitness] <id>`, the shape scripts/fitness.mjs gives its own. */
export const CLOCK_ISSUE_TITLE = "[fitness] clock-running";
/** The one REST read: the newest successful run the schedule started. */
export const CLOCK_RUNS_PATH = `actions/workflows/${CLOCK_WORKFLOW}/runs?event=schedule&status=success&per_page=1`;

const hoursText = (h) => `${Math.round(h * 10) / 10}h`;

/**
 * Pure: the intents for one tick. `hoursSince` is the age of the newest successful scheduled run
 * (null when none exists at all, which is a stopped clock, not a fresh one); `openIssue` is the
 * open `[fitness] clock-running` issue, or null. Returns at most one intent: open while stale with
 * no issue, close while fresh with one, else nothing — the open issue is the memory. A null state
 * (the read failed this tick) decides nothing.
 */
export function clockIntents(state) {
  if (!state) return [];
  const { hoursSince, newestSuccessAt, openIssue } = state;
  const stale = hoursSince === null || hoursSince === undefined || hoursSince >= CLOCK_STALE_HOURS;
  if (stale && !openIssue) {
    const seen =
      hoursSince === null || hoursSince === undefined
        ? "no successful scheduled run is on record"
        : `the newest successful scheduled run is **${hoursText(hoursSince)}** old (${newestSuccessAt})`;
    return [
      {
        kind: "open-clock-issue",
        title: CLOCK_ISSUE_TITLE,
        body: [
          `**This must stay true:** the 15-minute clock (\`${CLOCK_WORKFLOW}\`) keeps ticking — it starts a stopped bots machine and runs the fitness contracts, so a stopped clock silences every one of them.`,
          `**What failed:** ${seen}; the clock reads as stopped past ${CLOCK_STALE_HOURS}h.`,
          `**What fixes it:** nothing automatic — check Actions → *Bots deploy catch-up*: a schedule GitHub paused (60 days without repository activity), a disabled workflow, or a run series that never reaches its first step. \`gh workflow enable ${CLOCK_WORKFLOW}\` re-arms a paused one; a failing series is the repair lane's.`,
          "",
          `This was noticed on a push to \`main\`, not within ${CLOCK_STALE_HOURS}h: the watch rides the push tick, so a merge-quiet stretch delays it until the next merge. This issue closes itself once a successful scheduled run is fresh again. Watcher: \`scripts/moneypenny/clock-watch.mjs\`.`,
          "",
          FOOTER,
        ].join("\n"),
      },
    ];
  }
  if (!stale && openIssue) {
    return [
      {
        kind: "close-clock-issue",
        issueNumber: openIssue.number,
        title: openIssue.title ?? CLOCK_ISSUE_TITLE,
        body: `The clock is back: the newest successful scheduled run is ${hoursText(hoursSince)} old (${newestSuccessAt}).\n\n${FOOTER}`,
      },
    ];
  }
  return [];
}

/**
 * The read: one REST call, plus a title match over the audit's own open-issue list. Loud on
 * failure, like `gatherStranded`; `clockOrUnknown` is the soft wrapper the audit calls.
 * `created_at` is the run's start as the API reports it — the same field `gh run list` shows.
 */
export function readClock(nowMs, issues = [], { rest = ghRest } = {}) {
  const runs = rest(CLOCK_RUNS_PATH)?.workflow_runs ?? [];
  const newest = runs[0]?.created_at ?? null;
  const hoursSince = newest ? (nowMs - Date.parse(newest)) / 3_600_000 : null;
  const openIssue = (issues ?? []).find((i) => i?.title === CLOCK_ISSUE_TITLE) ?? null;
  return { hoursSince, newestSuccessAt: newest, openIssue };
}

/**
 * `readClock` for the audit step, soft on failure: the stall, silent-feedback and conflict checks
 * ride the same run, and an Actions list this cannot read must cost one skipped watch — retried
 * on the next push — not those eyes. Null means unknown; `clockIntents` is never called on it.
 */
export function clockOrUnknown(nowMs, issues, { rest = ghRest, log = console.log } = {}) {
  try {
    return readClock(nowMs, issues, { rest });
  } catch (err) {
    log(`::warning::clock watch skipped — ${String(err?.message ?? err).slice(0, 200)}`);
    return null;
  }
}

/** The open act: one `gh issue create`, `bug` and assigned to the owner, as fitness.mjs files its own. */
export function openClockIssue(i, { run = sh } = {}) {
  const url = run("gh", [
    "issue",
    "create",
    "--title",
    i.title,
    "--label",
    "bug",
    "--assignee",
    ERIC,
    "--body",
    i.body,
  ]);
  return `⏰ clock stopped — opened \`${i.title}\` → ${String(url).trim()}`;
}

/** The close act: one call, reason and comment together, as `close-receipt` does. */
export function closeClockIssue(i, { run = sh } = {}) {
  run("gh", [
    "issue",
    "close",
    String(i.issueNumber),
    "--reason",
    "completed",
    "--comment",
    i.body,
  ]);
  return `⏰ clock back — closed #${i.issueNumber} \`${i.title}\``;
}
