// ONE TAP ON THE DIAL (#6470). A person on a phone adds one `work-mode:*` label to #4153 and is done.
//
// WHAT WAS STOPPING. A tap alone could not work. The other position's label stayed on, and two labels
// read as `conserve` whatever was tapped. Nothing wrote an end date either, and a `conserve` or `surge`
// with none reads `normal` with a warning. So the phone control took two labels' worth of care and a
// typed comment with a date in it, and a surge's end date cannot land on the weekly reset at all.
//
// WHAT A TAP DOES NOW, on the `labeled` event, under the App token the label event already runs with
// (the same "ride the router, not the workflow" call wake.mjs records):
//   - clears the other dial labels, so exactly one remains;
//   - for `conserve` and his own `surge`, writes one footed comment with the end time at the next
//     weekly reset, unless this setting already carries one (a session's /surge writes its own from
//     get_usage). `halt` never gets one: a brake does not release itself. `normal` has nothing to end.
//
// WHY SURGE IS THE EXCEPTION. A surge with no end date reads `normal`, and that is the only thing that
// stops a session or lane label from going live, since surge is his alone (ACTOR_RULES). A comment
// under the App token counts as trusted, so writing it for any surge label would switch on what the
// rule forbids. So it is written only when the label event's actor is his login and the event carries
// no app, and for anyone else's surge this file writes nothing at all: the label keeps reading as it
// reads today. The limit of that check, stated plainly: a session running `gh` under his own login
// shows the same actor and no app (10-15's conserve did), so GitHub cannot tell that session from his
// thumb. The rule still rests on /surge running only on his words. A phone tap's event has never been
// observed, so the notice below prints its actor and app; if his first tap reads as refused, that
// line says why, and the failure is a surge that did not start, never one that did.
//
// A tap that a newer tap has already overtaken does nothing: GitHub runs each label's event on its
// own, and two runs each clearing "the others" would leave no label at all.

import { sh } from "./gh.mjs";
import { FOOTER } from "./labels.mjs";
import {
  isoUntil,
  jsonLines,
  loadWorkModeConfig,
  mayActorSet,
  nextWeeklyReset,
  POSITIONS,
  readWorkMode,
  writtenEndDate,
} from "./work-mode.mjs";

const NEEDS_END_DATE = new Set(["conserve", "surge"]);

/** Pure: one intent when a dial label goes on. A label coming off, or any other label, is nothing. */
export function routeDial(ctx) {
  if (ctx?.eventName !== "issues" || ctx?.action !== "labeled") return [];
  const label = ctx?.payload?.label?.name;
  const issueNumber = ctx?.payload?.issue?.number;
  if (!(issueNumber && label?.startsWith("work-mode:"))) return [];
  return [{ kind: "route-dial", issueNumber, label }];
}

/** The comment a tap leaves. The position sits beside the time, so the reader takes it for this
 *  position and no other, and nothing else in it may say the word the reader looks for. */
const endComment = (position, reset, actor) =>
  `${position} until ${isoUntil(reset)}\n\nSet by one tap on the dial by ${actor}. It ends at the next weekly reset (\`weeklyResetAnchor\` in work-mode.json). Tap \`work-mode:normal\` to end it sooner.\n\n${FOOTER}`;

/**
 * Pure: what one tap should write. `events` are the issue's `labeled` events
 * `{ label, createdAt, actor, app }`, oldest first; `labels` are the issue's labels now.
 * Returns `{ remove, comment, why }`; `remove` empty and `comment` null means write nothing.
 */
export function planDialTap({ label, labels = [], events = [], comments = [], config }) {
  const nothing = (why) => ({ remove: [], comment: null, why });
  const { labelPrefix } = config;
  const position = label.slice(labelPrefix.length);
  if (!POSITIONS.includes(position)) return nothing(`${label} is not a position`);

  const dialEvents = events.filter((e) => e.label?.startsWith(labelPrefix));
  const newest = dialEvents.reduce(
    (a, e) => (a && Date.parse(a.createdAt) > Date.parse(e.createdAt) ? a : e),
    null,
  );
  // GitHub lists a label event a moment after it fires; with none, nobody can say who tapped.
  if (!newest) return nothing("the label event is not listed yet");
  if (newest.label !== label) return nothing(`${newest.label} is the newer tap`);

  if (position === "surge" && !(mayActorSet("surge", newest.actor) && !newest.app))
    return nothing(`surge by ${newest.actor} (app ${newest.app ?? "none"}): only his own tap ends`);

  const remove = labels.filter((l) => l.startsWith(labelPrefix) && l !== label);
  if (!NEEDS_END_DATE.has(position)) return { remove, comment: null, why: `set to ${position}` };
  if (writtenEndDate({ position, comments, events, config }))
    return { remove, comment: null, why: `${position} already carries an end date` };
  const reset = nextWeeklyReset(config.weeklyResetAnchor, Date.parse(newest.createdAt));
  return {
    remove,
    comment: endComment(position, reset, newest.actor),
    why: `${position} until ${isoUntil(reset)}`,
  };
}

const COMMENTS_JQ =
  ".[] | {body, createdAt: .created_at, author_association, user: {type: .user.type}}";
const EVENTS_JQ =
  '.[] | select(.event == "labeled") | {label: .label.name, createdAt: .created_at, actor: .actor.login, app: .performed_via_github_app.slug}';

/** Reads the issue as it is now, plans, writes. A failed write throws, so `runIntents` reports it. */
export function executeDialTap(intent, { exec = sh, config = loadWorkModeConfig() } = {}) {
  const { issueNumber, label } = intent;
  if (issueNumber !== config.trackingIssue)
    return `🎚️ ignored ${label} on #${issueNumber}: the dial lives on #${config.trackingIssue}`;
  const path = `repos/{owner}/{repo}/issues/${issueNumber}`;
  const issue = JSON.parse(exec("gh", ["api", path, "--jq", "{labels: [.labels[].name]}"]));
  const list = (suffix, jq) =>
    jsonLines(exec("gh", ["api", "--paginate", `${path}/${suffix}?per_page=100`, "--jq", jq]));
  const events = list("events", EVENTS_JQ);
  const comments = list("comments", COMMENTS_JQ);

  const plan = planDialTap({ label, labels: issue.labels, events, comments, config });
  const tap = events.findLast((e) => e.label === label);
  console.log(
    `::notice::dial tap ${label} by ${tap?.actor ?? "unknown"} (app ${tap?.app ?? "none"}): ${plan.why}`,
  );
  for (const name of plan.remove)
    exec("gh", ["api", "-X", "DELETE", `${path}/labels/${encodeURIComponent(name)}`]);
  if (plan.comment)
    exec("gh", ["api", "-X", "POST", `${path}/comments`, "-f", `body=${plan.comment}`]);
  return `🎚️ dial tap ${label} on #${issueNumber} — ${plan.why}`;
}

/** No "until" anywhere in it: the reader takes that word and a date as an end date. */
const tidyComment = (label, reason) =>
  `**\`${label}\` came off the dial and \`work-mode:normal\` went on.** Its end date had passed (${reason}), so every lane already read normal. Left on, the next tap on it would have taken it off, and no label at all reads as conserve.\n\n${FOOTER}`;

/**
 * Takes an ended label off the dial, the push tick's half of `endedDialTidy`. Reads the issue again
 * first: the audit decided a moment ago, and a brake tapped on since must not lose to that. Normal goes
 * on first because that order heals. If the removal fails, the new label's own event runs a tap, which
 * clears the other one, and this write is not repeated, since two labels carry no `endedLabel`. The
 * comment goes last so a failure before it cannot post it twice.
 */
export function executeDialTidy(
  intent,
  { exec = sh, config = loadWorkModeConfig(), now = Date.now() } = {},
) {
  const { issueNumber, label } = intent;
  const mode = readWorkMode(exec, config, now);
  if (mode.endedLabel !== label)
    return `🎚️ left ${label} on #${issueNumber}: the dial reads ${mode.position} (${mode.reason})`;
  const path = `repos/{owner}/{repo}/issues/${issueNumber}`;
  exec("gh", ["api", "-X", "POST", `${path}/labels`, "-f", `labels[]=${config.labelPrefix}normal`]);
  exec("gh", ["api", "-X", "DELETE", `${path}/labels/${encodeURIComponent(label)}`]);
  exec("gh", [
    "api",
    "-X",
    "POST",
    `${path}/comments`,
    "-f",
    `body=${tidyComment(label, mode.reason)}`,
  ]);
  console.log(`::notice::dial tidied: ${label} → ${config.labelPrefix}normal (${mode.reason})`);
  return `🎚️ tidied the dial on #${issueNumber} — ${label} → ${config.labelPrefix}normal`;
}
