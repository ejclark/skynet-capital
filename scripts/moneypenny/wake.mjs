// THE NIGHT CHAIN (#5056 slice 2) — a build slot that frees wakes the queue, merge or no merge.
//
//   node scripts/moneypenny/index.mjs --end-build plan-4612   # a build's job ended: take its label off
//
// WHAT WAS STOPPING. Every claim in this repo is woken by a tick, and the only tick is a merge to
// `main` (moneypenny-events.yml: "every merge to main is the tick — no cron"). A build that ends
// WITHOUT a merge — a red PR, a held PR, a session that stopped short — frees its slot and wakes
// nothing. Measured over the nights of Oct 3–9: on Oct 4–5 and 5–6 the in-flight cap (3) sat full
// of `in-progress` labels on builds that had already ended, the retry sweep said "nothing
// admissible" on every tick it got, and the queue moved again only when Eric's morning digest merge
// ran the stale-label sweep — 5.3h and 8.0h of ready work idle. Two causes, two fixes:
//
//   1. The PR-open sync undid the session's last write. A lane session opens its PR, then takes
//      `in-progress` off; the board sync for that PR lands seconds later and puts it back (plan/4469:
//      off 04:45:30Z, back on 04:45:54Z, held 8h). Fixed at the writer — `pr-in-progress.mjs` leaves
//      a lane build's own PR alone, because the claim lane owns that label.
//   2. A slot freeing is not a merge. `in-progress` coming off an issue IS the "a build slot freed"
//      event, and it already reaches this router: the label comes off under the App token (the
//      session's own last write, `--release`, the PR-close sync, the stale sweep), whose events are
//      never suppressed. So `routeWake` turns it into one intent, and `wakeNext` asks the retry
//      sweep's own peek — the dial, the in-flight cap, the fence, fast-track first — and, when
//      something is admissible, re-dispatches the events workflow as `scan`, exactly the call the
//      push pass makes. The scan's `--claim-next` does the claiming; this file never claims.
//
// WHY NOT A WORKFLOW STEP. `.github/workflows/**` is Eric's carve-out, and the label event already
// runs `index.mjs` with the App token on every issue event — the same "ride the router, not the
// workflow" call continuation.mjs records. The one thing an event cannot cover is a build whose job
// ends with the label still on (a cancelled job, a session that never took it off — #4612 on the
// Oct 4–5 night). `--end-build` is that backstop's script half; its workflow line boards the platter.
//
// WHAT IT NEVER DOES. It never claims, never takes or frees a lease (a lease outliving a build is
// the throttle on a do-nothing build being retried in a loop), never wakes a failed build's own
// retry (`wakeNext`'s note), and never acts under `halt`: the peek it asks refuses everything
// there, fast-track included.
import { sh } from "./gh.mjs";
import { issueNumberFromSlug, LABELS, setInProgress } from "./labels.mjs";

/** The workflow the push pass re-dispatches, and so the one a wake re-dispatches. */
export const EVENTS_WORKFLOW = "moneypenny-events.yml";

/**
 * Pure: one `wake-next` intent when an issue event frees a build slot — `in-progress` coming off —
 * else nothing. A label going ON is a claim, never a wake.
 */
export function routeWake(ctx) {
  if (ctx?.eventName !== "issues" || ctx?.action !== "unlabeled") return [];
  if (ctx?.payload?.label?.name !== LABELS.inProgress.name) return [];
  const issueNumber = ctx.payload?.issue?.number;
  return issueNumber ? [{ kind: "wake-next", issueNumber }] : [];
}

/**
 * Re-fire the events workflow as a `scan` — the push pass's own re-dispatch, so the run it starts
 * is the one `--claim-next` already claims in. Under the App token (the router's), never
 * GITHUB_TOKEN: a GITHUB_TOKEN dispatch hides the run's failure from the repair lane (LESSONS.md
 * 2026-09-08).
 */
export function dispatchScan({ exec = sh, ref = process.env.GITHUB_REF_NAME || "main" } = {}) {
  exec("gh", ["workflow", "run", EVENTS_WORKFLOW, "--ref", ref, "-f", "command=scan"]);
}

/**
 * Ask the sweep's peek; dispatch the scan only when it names something admissible. A dispatch
 * failure throws, so `runIntents` records it and the run goes red — a wake that silently did not
 * happen is the failure this file exists to end.
 *
 * A FAILED BUILD IS NEVER RETRIED BY ITS OWN WAKE. `--release` frees a failed build's lease and
 * label so a retry can start — on the next tick. Before this file the next tick was the next merge;
 * a wake is seconds later, so a build that fails every time (a broken action pin, a session that
 * always runs out of turns) would retry itself all night, unattended. So when the peek's pick is
 * the issue that just freed the slot and no claim holds it, nothing is dispatched: its retry keeps
 * the merge-tick pace it always had. When a claim DOES hold it (a build that ended normally keeps
 * its lease for the TTL), the scan's own sweep steps past it — so the wake asks what is behind it.
 *
 * @param deps.peek  the retry sweep's dry run (`peekNext`) — the pick, or null; `peek(n)` leaves #n out
 * @param deps.isHeld  does a live claim lease hold #n? (`isClaimed` on either lane's slug)
 * @param deps.dispatch  the re-dispatch (`dispatchScan`)
 * @param deps.freed  the issue whose slot freed
 * @returns {{ dispatched: boolean, pick?: number, line: string }}
 */
export function wakeNext({
  peek,
  isHeld = () => false,
  dispatch = () => dispatchScan(),
  freed,
} = {}) {
  const why = freed ? `#${freed} freed a build slot` : "a build slot freed";
  let pick = peek();
  if (pick && freed && pick.number === freed) {
    if (!isHeld(freed)) {
      console.log(
        `::notice::${why} — the next pick is #${freed} itself with no claim held; no dispatch`,
      );
      return {
        dispatched: false,
        line: `· ${why} — the next pick is #${freed} itself (a failed build's retry); it waits for the next merge`,
      };
    }
    pick = peek(freed);
  }
  if (!pick) {
    console.log(`::notice::${why} — nothing admissible, no dispatch`);
    return { dispatched: false, line: `· ${why} — nothing admissible to start` };
  }
  dispatch();
  console.log(`::notice::${why} — #${pick.number} is admissible; dispatched the scan`);
  return {
    dispatched: true,
    pick: pick.number,
    line: `⏭ ${why} — dispatched the scan that claims #${pick.number}`,
  };
}

/**
 * A build's job ended: take `in-progress` off its issue. The lane's own prompts promise this as the
 * session's last write ("every ending removes `in-progress`"); this makes the promise mechanical,
 * the way the feedback guard does for "never silent". The lease is left alone on purpose. Under the
 * App token the removal is itself an `unlabeled` event, so `routeWake` wakes the queue from it — one
 * door, not two. Removing a label that is already off writes nothing and wakes nothing.
 */
export function endBuild(slug, { setLabel = setInProgress } = {}) {
  const n = issueNumberFromSlug(slug);
  if (!n) {
    console.log(`::notice::--end-build: \`${slug}\` names no lane build — nothing to end`);
    return `· \`${slug}\` names no lane build`;
  }
  const wrote = setLabel(n, false);
  const line = wrote
    ? `🏁 build on #${n} ended — \`${LABELS.inProgress.name}\` is off, its slot is free`
    : `⚠ build on #${n} ended, but \`${LABELS.inProgress.name}\` could not be taken off`;
  console.log(`::notice::${line}`);
  return line;
}
