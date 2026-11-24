// Fitness's issue filing: what the issues should do for a set of results (reportActions, pure), and
// the gh commands each action needs (ghWrites). Split out of scripts/fitness.mjs, which probes and
// prints; this decides what to file and how, and touches no machine, clock or network (#6470).
import {
  ASSIGNED_MARKER,
  assignsAtOnce,
  OWNER,
  ownerDue,
  REOPEN_LINE,
  REOPENED_MARKER,
  reopenable,
  whatHappensNext,
  whoHearsBlind,
} from "./fitness-rungs.mjs";

// The `reaches` values report() understands. Any other value files nothing.
export const ISSUE_TO_OWNER = "an issue assigned to the owner";

export const issueTitle = (id) => `[fitness] ${id}`;
const blindTitle = (source) => `[fitness] cannot read ${source}`;
export const filesIssue = (r) => r.reaches === ISSUE_TO_OWNER;
// Details carry running numbers (minutes ago, a streak), so the compare drops them: a standing
// failure is one state, not a new one every tick. A real-tick replay of the 10-22 outage posted 70
// comments before this. The detail is matched whole, from the label's colon to the full stop the body
// and the comments all put after it, so a cause that narrows (either app still undeployed of the two
// reported) is a change and not a substring of the old one: a leading space alone also matches after
// the comma that joins them.
const shape = (text) => String(text ?? "").replace(/\d+/g, "N");
const said = (text, detail) => {
  const shaped = shape(text);
  const whole = shape(detail);
  return shaped.includes(`:** ${whole}.`) || shaped.includes(`: ${whole}.`);
};
const seen = (issue, detail) => said(issue.body, detail) || said(issue.lastComment, detail);

const assignAction = (number, title, why, detail) => ({
  kind: "assign",
  number,
  title,
  why,
  detail,
});

/** A failure with no open issue: reopen its recent thread if there is one, else open a new one. */
function firstFailureActions(r, closedIssues, nowMs) {
  const closed = reopenable(closedIssues, issueTitle(r.id), nowMs);
  if (!closed) return [{ kind: "open", result: r, assign: assignsAtOnce(r) }];
  const heldByOwner = (closed.assignees ?? []).some((a) => a.login === OWNER);
  const actions = [{ kind: "reopen", number: closed.number, result: r, removeOwner: heldByOwner }];
  // This reopening starts a new failure, and the assignment below is judged on that basis.
  const reopened = closed.botComments && {
    ...closed,
    assignees: [],
    botComments: [
      ...closed.botComments,
      { type: "Bot", body: REOPENED_MARKER, at: new Date(nowMs).toISOString() },
    ],
  };
  const why = reopened && ownerDue(r, reopened, nowMs);
  if (why) actions.push(assignAction(closed.number, issueTitle(r.id), why, r.detail));
  return actions;
}

/** A failure with an open issue. The assignment's comment carries the detail, so one comment says both. */
function standingFailureActions(r, issue, nowMs) {
  const why = ownerDue(r, issue, nowMs);
  if (why) return [assignAction(issue.number, issueTitle(r.id), why, r.detail)];
  return seen(issue, r.detail) ? [] : [{ kind: "comment", number: issue.number, result: r }];
}

/** One issue per source nobody at home could read, on the same order as a failure with no script. */
function blindActions(source, filing, issue, nowMs) {
  const blind = filing.filter((r) => r.reads === source && r.status === "unknown");
  const read = filing.some(
    (r) => r.reads === source && (r.status === "pass" || r.status === "fail"),
  );
  const credential = blind.some((r) => r.credential);
  if (blind.length && !issue) {
    return [{ kind: "open-blind", source, results: blind, assign: credential }];
  }
  if (blind.length) {
    const why = ownerDue({ rung: credential ? "owner" : "wait" }, issue, nowMs);
    return why
      ? [assignAction(issue.number, blindTitle(source), why, `cannot read ${source}`)]
      : [];
  }
  return read && issue ? [{ kind: "close-blind", number: issue.number, source }] : [];
}

/**
 * What the issues should do, given results and the open fitness issues. Pure. A failure opens one
 * issue, reopening a thread closed in the last 14 days rather than starting another, and comments
 * only when its cause changed, so a standing failure does not pile up comments. The owner is
 * assigned when its rung says so (scripts/fitness-rungs.mjs), and that assignment is the one comment
 * for moving up. A pass closes the issue. Unknown, quiet and not-here touch a contract's own issue
 * not at all: they prove neither health nor failure. Instead, a source nobody at home could read
 * gets one issue, closed once any contract reads it again. Only a contract whose `reaches` is an
 * issue takes part.
 *
 * `botComments` on a thread are its comments in the REST shape's fields, or undefined when they
 * could not be read, which holds the assignment for a tick that can.
 */
export function reportActions(results, openIssues, { nowMs = Date.now(), closedIssues = [] } = {}) {
  const actions = [];
  const find = (title) => openIssues.find((i) => i.title === title);
  const filing = results.filter(filesIssue);
  for (const r of filing) {
    const issue = find(issueTitle(r.id));
    if (r.status === "fail" && !issue) {
      actions.push(...firstFailureActions(r, closedIssues, nowMs));
    } else if (r.status === "fail") {
      actions.push(...standingFailureActions(r, issue, nowMs));
    } else if (r.status === "pass" && issue)
      actions.push({ kind: "close", number: issue.number, result: r });
    for (const number of r.reassign ?? []) actions.push({ kind: "reassign", number });
  }
  for (const source of new Set(filing.map((r) => r.reads))) {
    actions.push(...blindActions(source, filing, find(blindTitle(source)), nowMs));
  }
  return actions;
}

function issueBody(r) {
  return [
    `**This must stay true:** ${r.mustBeTrue}.`,
    `**What failed:** ${r.detail}.`,
    `**What fixes it:** ${r.corrector ?? "nothing automatic yet"} (budget: ${r.budget}).`,
    `**What happens next:** ${whatHappensNext(r)}`,
    ...(r.gap ? [`**What this cannot see:** ${r.gap}.`] : []),
    "",
    "This issue closes itself once the check passes, and reopens if it fails again within 14 days. Contract: `scripts/fitness.mjs`.",
    ...(assignsAtOnce(r) ? ["", ASSIGNED_MARKER] : []),
  ].join("\n");
}

function blindBody(source, results) {
  const credential = results.some((r) => r.credential);
  return [
    `**These checks are blind:** ${results.map((r) => r.id).join(", ")} cannot read ${source}.`,
    `**What the probes said:** ${[...new Set(results.map((r) => r.detail))].join(" · ")}.`,
    `**Who hears:** ${whoHearsBlind(credential)} This issue's age is how long the checks have been blind.`,
    "",
    `This issue closes itself once ${source} can be read again. Contract: \`scripts/fitness.mjs\`.`,
    ...(credential ? ["", ASSIGNED_MARKER] : []),
  ].join("\n");
}

// The REST route the assignment lane uses, so the write is the one already on record under a bot.
const ownerOn = (method, number) => [
  "api",
  "--method",
  method,
  `repos/{owner}/{repo}/issues/${number}/assignees`,
  "-f",
  `assignees[]=${OWNER}`,
];
const addOwner = (number) => ownerOn("POST", number);
const removeOwner = (number) => ownerOn("DELETE", number);

/**
 * The gh commands one action needs, run in order and stopping at the first refusal, and the name the
 * log prints. The order carries meaning. An assignment comes before the comment marking it made, so
 * a refused assignment leaves no marker and the next tick tries again. The owner comes off before a
 * reopen, because reopening mails an assignee and this failure has not reached that rung yet.
 */
export function ghWrites(a) {
  switch (a.kind) {
    case "open":
      return {
        name: issueTitle(a.result.id),
        commands: [
          [
            "issue",
            "create",
            "--title",
            issueTitle(a.result.id),
            "--label",
            "bug",
            ...(a.assign ? ["--assignee", OWNER] : []),
            "--body",
            issueBody(a.result),
          ],
        ],
      };
    case "reopen":
      return {
        name: issueTitle(a.result.id),
        commands: [
          ...(a.removeOwner ? [removeOwner(a.number)] : []),
          [
            "issue",
            "reopen",
            String(a.number),
            "--comment",
            `${REOPEN_LINE} What failed: ${a.result.detail}.\n\n${REOPENED_MARKER}`,
          ],
        ],
      };
    case "assign":
      return {
        name: a.title,
        commands: [
          addOwner(a.number),
          [
            "issue",
            "comment",
            String(a.number),
            "--body",
            `Assigned to the owner: ${a.why}. Still failing: ${a.detail}.\n\n${ASSIGNED_MARKER}`,
          ],
        ],
      };
    case "reassign":
      // He already holds it, so a plain add changes nothing and sends nothing: off first, then on.
      return {
        name: `#${a.number}`,
        commands: [
          removeOwner(a.number),
          addOwner(a.number),
          [
            "issue",
            "comment",
            String(a.number),
            "--body",
            `Re-assigned under the bot: an assignment made under the owner's own login sends no notice.\n\n${ASSIGNED_MARKER}`,
          ],
        ],
      };
    case "comment":
      return {
        name: issueTitle(a.result.id),
        commands: [
          [
            "issue",
            "comment",
            String(a.number),
            "--body",
            `Still failing, and it changed: ${a.result.detail}.`,
          ],
        ],
      };
    case "close":
      return {
        name: issueTitle(a.result.id),
        commands: [
          ["issue", "close", String(a.number), "--comment", `Passing again: ${a.result.detail}.`],
        ],
      };
    case "open-blind":
      return {
        name: blindTitle(a.source),
        commands: [
          [
            "issue",
            "create",
            "--title",
            blindTitle(a.source),
            "--label",
            "bug",
            ...(a.assign ? ["--assignee", OWNER] : []),
            "--body",
            blindBody(a.source, a.results),
          ],
        ],
      };
    case "close-blind":
      return {
        name: blindTitle(a.source),
        commands: [
          ["issue", "close", String(a.number), "--comment", `${a.source} can be read again.`],
        ],
      };
    default:
      throw new Error(`no gh command for ${a.kind}`);
  }
}
