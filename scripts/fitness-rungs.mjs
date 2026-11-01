// When a failing fitness contract reaches the owner (#6470). Pure: no reads, no writes.
//
// Eric, 2026-11-01: "an issue in github should email me which has a reasonable chance to catch my
// attention from email notifications my watch picks up. That said, we've already detected failure at
// this point, in which case I expect self correcting (i.e. learning loops) to kick in and heal the
// system." So the system corrects first, and an issue assigned to him is that email, as the last step.
//
// Each contract in scripts/fitness.mjs names the rung it starts on, and a verdict may name another:
//
//   script   a script acts first. He is assigned once its budget is spent, counted from marked
//            bot comments on the issue so the count survives a runner. It also takes the two-hour
//            limit below: a script that never acts (a machine state it leaves alone) must not hold
//            the email back for ever.
//   wait     nothing here fixes it. Whatever may (the repair lane, a deploy, the failure passing on
//            its own) gets the two-hour limit below.
//   owner    only he can fix it, such as a credential, so he is assigned at once.
//   session  it prints where a person already is, and files nothing.
//
// A dead credential behind a read moves a verdict to the owner rung whatever its contract says.
//
// Moving past the first rung is one comment carrying ASSIGNED_MARKER, or the marker in the body of
// an issue that opened assigned, and that marker is what makes it once: an owner who takes himself
// off a standing failure has answered, and is not asked again until the thread closes and reopens. There is no quiet-hours rule. Whether a night's email is wanted is
// a question the plan holds open until there is data on how these emails are actually read.
export const RUNGS = ["script", "wait", "owner", "session"];
export const OWNER = "ejclark";

const HOUR_MS = 60 * 60_000;

// Two hours: a fix that is working takes about 80 minutes at the 90th percentile to read as a pass
// (the build lane's 36-minute close, then the next tick, the bots deploy and the read after it; an
// estimate, #6470 study), and one late tick adds up to 47 minutes (the worst gap in 400 clock runs).
// So anything shorter emails him about heals that are working. He works about 8 to 4 Central, and
// two hours is still the same working block. It is a first guess: it is wrong if most assignments it
// makes clear within the next hour, or if a failure it held back cost more than the wait.
export const OWNER_AFTER_MS = 2 * HOUR_MS;
const OWNER_AFTER_HOURS = OWNER_AFTER_MS / HOUR_MS;

// A closed issue whose contract fails again inside this keeps its thread, so its attempts stay in
// one place. The shipped sweep closes a fitness issue at merge, before the contract has passed, so
// "the fix did not hold" is a normal path and not an edge (#6470 study, merged fix).
export const REOPEN_WITHIN_MS = 14 * 24 * HOUR_MS;
const REOPEN_WITHIN_DAYS = REOPEN_WITHIN_MS / (24 * HOUR_MS);

export const ASSIGNED_MARKER = "<!-- fitness:owner-assigned -->";
export const REOPENED_MARKER = "<!-- fitness:reopened -->";
export const REOPEN_LINE = `The fix did not hold: this check failed again within ${REOPEN_WITHIN_DAYS} days of closing, so it reopened here and the attempts stay on one thread.`;

const assigned = (thread) => (thread.assignees ?? []).some((a) => a.login === OWNER);

// A bot's comment and nothing else: this repo is public, and a stranger's copy of a marker must not
// spend a budget or stop an email. Comments arrive in the REST shape's fields, read by fitness.mjs.
const marked = (comments, marker) =>
  comments.filter((c) => c.type === "Bot" && (c.body ?? "").includes(marker));

/** When this failure began: the thread's newest reopening by a bot, else its creation. */
function failingSinceMs(thread) {
  const reopenings = marked(thread.botComments ?? [], REOPENED_MARKER).map((c) => Date.parse(c.at));
  return Math.max(Date.parse(thread.createdAt), ...reopenings);
}

/** A rung that assigns the moment its issue exists. */
export const assignsAtOnce = (r) => Boolean(r.credential) || r.rung === "owner";

/**
 * Why the owner should be assigned on this tick, or null. `thread.botComments` undefined means the
 * comments could not be read: nothing can then show the rung changed, or that it has not already,
 * so it holds until a tick can read them.
 */
export function ownerDue(r, thread, nowMs) {
  if (assigned(thread) || !thread.botComments) return null;
  const sinceMs = failingSinceMs(thread);
  const askedAtOpen =
    (thread.body ?? "").includes(ASSIGNED_MARKER) && Date.parse(thread.createdAt) >= sinceMs;
  const asked = marked(thread.botComments, ASSIGNED_MARKER).some(
    (c) => Date.parse(c.at) >= sinceMs,
  );
  if (askedAtOpen || asked) return null;
  if (assignsAtOnce(r)) return "only the owner can fix this";
  if (r.attempts) {
    const windowMs = r.attempts.windowHours * HOUR_MS;
    const spent = marked(thread.botComments, r.attempts.marker).filter(
      (c) => nowMs - Date.parse(c.at) <= windowMs,
    ).length;
    if (spent >= r.attempts.max) {
      return `the automatic fix ran ${spent} times in ${r.attempts.windowHours} hours and this still fails`;
    }
  }
  return nowMs - sinceMs >= OWNER_AFTER_MS
    ? `it has not cleared on its own in ${OWNER_AFTER_HOURS} hours`
    : null;
}

/** The newest thread with this title closed recently enough to reopen, or undefined. */
export function reopenable(closedIssues, title, nowMs) {
  const closedAt = (i) => Date.parse(i.closedAt ?? "");
  return closedIssues
    .filter((i) => i.title === title && nowMs - closedAt(i) <= REOPEN_WITHIN_MS)
    .sort((a, b) => closedAt(b) - closedAt(a))[0];
}

/** What the issue tells whoever reads it about the order of things. Says what happens, not how. */
export function whatHappensNext(r) {
  if (assignsAtOnce(r)) return "Only the owner can fix this, so they are assigned now.";
  const limit = `${OWNER_AFTER_HOURS} hours`;
  if (r.attempts) {
    return `${r.corrector} acts first, up to ${r.attempts.max} times in ${r.attempts.windowHours} hours. The owner is assigned only once those are spent, or if this still fails after ${limit}.`;
  }
  return `The owner is assigned if this still fails after ${limit}.`;
}

/** The same order, for a source nobody could read. */
export const whoHearsBlind = (credential) =>
  credential
    ? "the owner now, because a credential looks dead and only they can set one."
    : `the owner, once these have been blind for ${OWNER_AFTER_HOURS} hours.`;
