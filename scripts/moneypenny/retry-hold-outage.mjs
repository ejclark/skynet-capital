// A LANE OUTAGE IS NOT ONE ISSUE'S FAULT. The retry limit (`retryHoldReason`, admission.mjs) charges
// every start to the issue it was for, and a build that dies for a reason nothing to do with that
// issue charges it all the same. So an outage walked down the queue, three starts an issue, and once
// the lane recovered the healthy top of the queue stayed barred until midnight UTC while lower-ranked
// issues built. Replaying #4621's pace of 2026-10-27 through the real sweep barred six issues.
//
// WHAT TELLS THEM APART. One issue's failure looks like: it hit the limit, and no other issue did
// between the same two lane merges. An outage looks like: two or more hit it in one stretch with no
// lane build merged. That is all the evidence there is without reading job logs, and it cannot be
// told earlier than the second issue, so the walk itself stays: each start is also the only probe of
// whether the lane has recovered, and the limit keeps any one issue at three a go.
//
// WHAT THE OUTAGE SHAPE BUYS. The bar lasts an hour past the issue's last start, not until midnight,
// so the top of the queue is first again within the hour without anyone doing anything, and a whole
// barred queue cannot sit idle after the lane recovers. An hour, because #4621's deaths came three
// minutes apart: a retry per hour per issue is under a tenth of that, and it is short enough that
// a lower-ranked build barely gets ahead.
//
// TWO BAD ISSUES LOOK LIKE AN OUTAGE, and that error is the one this accepts. They get `OUTAGE_DAY_CAP`
// starts instead of `MAX_STARTS_PER_DAY`, then stay barred, and the queue behind them moves throughout
// because a bar still steps past. The other error is the costlier one: a healthy issue waiting most
// of a day with nobody told. An outage that outlasts the cap, six hours of retries, does bar until
// midnight; the note on the issue says how to start it sooner.
//
// ONLY A LANE BRANCH'S MERGE COUNTS. A live session's PR landing says nothing about whether the
// build action can start. A lane PR opened and not merged is not counted either, so a stretch can read
// longer than it was, which at worst earns a retry.
import { FOOTER, LABELS } from "./labels.mjs";

/** How long the outage shape holds an issue past its last start. */
export const OUTAGE_RETRY_HOURS = 1;
/** How many starts an issue gets in a UTC day on the outage reading before it stays barred. */
export const OUTAGE_DAY_CAP = 9;
/**
 * How many queue neighbours' histories one refused pick reads. An outage walks in rank order, so its
 * other victims sit right beside this one (and those already walked past are in hand), and a queue of
 * 40 must not mean 40 calls on every tick of a day one issue is barred (#6319).
 */
export const OUTAGE_PEER_READS = 5;

const LANE_BRANCH = /^(?:plan|feedback)\/\d+$/;
const NOTE_MARKER = (day) => `<!-- moneypenny:retry-held day=${day} -->`;

/** When `in-progress` went on, in ms ascending, from `from` on. The start `retryHoldReason` counts. */
const startsFrom = (events, from) =>
  (events ?? [])
    .filter((e) => e?.event === "labeled" && e.label?.name === LABELS.inProgress.name)
    .map((e) => Date.parse(e?.created_at ?? ""))
    .filter((at) => at >= from)
    .sort((a, b) => a - b);

/** When a lane branch's PR merged, in ms ascending, from the closed PR list. Pure. */
export function laneLandings(closedPrs = []) {
  return closedPrs
    .filter((pr) => LANE_BRANCH.test(pr?.head?.ref ?? ""))
    .map((pr) => Date.parse(pr?.merged_at ?? ""))
    .filter((at) => !Number.isNaN(at))
    .sort((a, b) => a - b);
}

/**
 * Do this issue's last `limit` starts share a stretch between lane merges with `limit` starts of
 * another issue? Pure. A lane merge among those starts means the lane was working meanwhile, so the
 * issue's failure is its own however many others failed. The stretch's ends are exclusive of the
 * merges, so an issue that recovered still vouches for the issues it failed beside.
 */
export function sharesOutage({ starts, peerStarts = [], landings = [], limit }) {
  const last = starts.at(-1);
  const first = starts.at(-limit);
  if (first === undefined || landings.some((at) => at > first && at < last)) return false;
  const after = landings.find((at) => at >= last) ?? Number.POSITIVE_INFINITY;
  const before = landings.findLast((at) => at <= first) ?? Number.NEGATIVE_INFINITY;
  return peerStarts.some((p) => p.filter((at) => at > before && at < after).length >= limit);
}

/**
 * May a barred issue start again, because it looks like a lane outage and its hour has passed? Every
 * cheap answer comes first: a fresh bar and a capped issue read nothing more. The caller's `seen`
 * holds every history already read, so the issues walked past count as peers at no cost.
 */
export function mayRetryThroughOutage({
  issue,
  events,
  mergedMs,
  closed,
  peers,
  seen,
  eventsOf,
  limit,
  now,
  log = console.log,
}) {
  const day = new Date(now);
  const midnight = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const starts = startsFrom(events, Math.max(midnight, mergedMs ?? 0));
  if (starts.length >= OUTAGE_DAY_CAP) return false;
  if (now - (starts.at(-1) ?? now) < OUTAGE_RETRY_HOURS * 3.6e6) return false;
  const landings = laneLandings(closed);
  for (const p of peers.filter((i) => i.number !== issue.number).slice(0, OUTAGE_PEER_READS)) {
    eventsOf(p.number);
  }
  const peerStarts = [...seen]
    .filter(([n]) => n !== issue.number)
    .map(([, history]) => startsFrom(history, midnight));
  if (!sharesOutage({ starts, peerStarts, landings, limit })) return false;
  log(
    `::notice::retry sweep — trying #${issue.number} again: other issues failed the same way with no lane build merged, so this reads as the lane and not the issue`,
  );
  return true;
}

/**
 * The note on a barred issue, once a UTC day. A hold that only logged left a healthy issue barred
 * with nothing on it to say why, or that a `ready` label event gets past the hold. Its own failure
 * is only a warning: `retryHold` fails open, and a note that could not be written must not free an
 * issue the count just barred. One comments read per barred issue per claim tick.
 */
export function noteRetryHold({ issue, reason, now, readAll, run, log = console.log }) {
  const marker = NOTE_MARKER(new Date(now).toISOString().slice(0, 10));
  try {
    const comments = readAll(`issues/${issue.number}/comments`);
    if ((comments ?? []).some((c) => String(c?.body ?? "").includes(marker))) return;
    const body = [
      `⏸ **The build sweep has stopped retrying this issue for now:** ${reason}.`,
      "",
      "- If other issues are failing the same way with no lane build merged, that reads as the lane and not this issue, and it tries again about an hour after its last start.",
      "- **To start it now:** remove `ready` and add it back. A `ready` label event is someone asking for this build, which this limit does not stop.",
      "",
      marker,
      "",
      FOOTER,
    ].join("\n");
    run("gh", ["issue", "comment", String(issue.number), "--body", body]);
  } catch (err) {
    log(
      `::warning::#${issue.number} is barred but the note could not be written: ${String(err?.message ?? err).slice(0, 200)}`,
    );
  }
}
