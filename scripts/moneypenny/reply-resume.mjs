// THE REPLY-RESUME DECISION (#3959 slice 1, sub-issue #4299) — does an authorized comment restart a
// build that stopped to ask a question? Until this existed, `needs-info` was a one-way door: the
// lane asked the member something, labelled the issue, and nothing read the answer. The only way
// back was for somebody to notice the reply and hand-remove the label (the `unlabeled` unpark path
// in plan-claim.mjs), or for a future session to find it cold. The reply itself — the one moment
// the answer is known — triggered nothing.
//
// SPLIT OUT, not added to plan-claim.mjs, for the reason that file's own header gives: this is a
// DIFFERENT question (is a blocked lane being answered?) from that one's (is a ready-flip being
// said?), and slice 2 generalises this one to every parking label while that one stays about
// `ready`. Same doctrine either way — pure, fixture-drivable, no network and no clock.
//
// WHO MAY RESUME is the WORKFLOW's job, never this file's: `moneypenny-events.yml`'s `if:` requires
// `github.event.comment.author_association` ∈ [OWNER, MEMBER, COLLABORATOR], the exact gate
// `claude.yml` and the plan lane already use. A stranger on this public repo can comment; they
// cannot spend a session. Re-deciding authorization here would be a second, weaker copy of a check
// the platform already makes correctly — see plan-claim.mjs's header for the full argument.
//
// THE LOOP GUARD IS LOAD-BEARING. Criterion 3 of the brief requires a resumed lane's FIRST visible
// act to be a comment — so the lane posts a comment on the very issue whose comments wake it. A
// comment carrying the lane FOOTER therefore never resumes anything, checked here rather than left
// to the label race: clearing `needs-info` would also stop the second fire, but only after it had
// already been dispatched.
import { LABELS, labelNames, notPullableReason } from "./labels.mjs";
import { isClaudeComment } from "./plan-claim.mjs";

/**
 * The issue as it will stand once the reply is honoured: the answered question's label gone, and
 * `ready` on (a `needs-info` issue usually still carries it, but a hand-triaged one may not, and
 * the reply IS the flip for this path). Asked of `notPullableReason` — the one pull rule (#4393) —
 * so a resume cannot start work the board would not show in Ready: a second parking label
 * (`needs-eric`, `needs-design`, `hold-merge`) still refuses, and so does a live `in-progress`.
 */
/**
 * The parking labels a REPLY can answer, in the order they are looked for. A reply cannot answer the
 * other two (`needs-design`, `hold-merge`) — see the header — and `notPullableReason` still refuses
 * a resume while either is on.
 */
export const ANSWERABLE = [LABELS.needsInfo.name, LABELS.needsEric.name];

/** The lane that owns an issue, derived from its labels (`feedback` wins a dual-labelled one). */
export const laneOf = (issue) => {
  const names = labelNames(issue?.labels);
  if (names.includes(LABELS.feedback.name)) return "feedback";
  if (names.includes(LABELS.plan.name)) return "plan";
  return null;
};

const asResumed = (issue, answered) => ({
  ...issue,
  labels: [
    ...new Set([...labelNames(issue?.labels).filter((n) => n !== answered), LABELS.ready.name]),
  ],
});

const no = (reason) => ({ resume: false, reason });

/**
 * A FOLLOW-UP THE APP RELAYED (#7286 slice 8). The app's feedback token comments under the owner's
 * login, so GitHub reports a member's relayed follow-up as OWNER and the workflow's gate cannot tell
 * it from Eric. `src/server/feedback-followup.ts` appends a trailer that opens with this text to
 * every follow-up it posts, and that trailer is the tell. A relayed reply may answer the question
 * the build lane asked the member (`needs-info`) on a filing already through the backlog gate; it
 * never answers `needs-eric` (that decision is Eric's own) and never adds `ready` to a filing that
 * was never readied (a member cannot skip the backlog gate by replying). Matching anywhere in the
 * body fails closed: a member who types the words themselves only stops their own reply resuming.
 */
export const RELAY_TRAILER_OPENER = "_Follow-up from ";
export const isRelayedFollowup = (body) => String(body ?? "").includes(RELAY_TRAILER_OPENER);

/**
 * HELD FOR THE FILING CHECK (#7548). On a `ready` filing no build has claimed yet, the app takes
 * `ready` off BEFORE it posts the follow-up and ends the trailer with this sentence, so the filing
 * check (`assessIntent` in triage-assess.mjs) re-judges the filing with the follow-up in it and
 * puts `ready` back only if it is still clear. Without the hold, a small ask that readied itself
 * could carry a large one past every check in a follow-up the build then read unchecked.
 * Checked at the END of the body: the app writes the trailer last, so a member's own words can
 * never end with it, and a follow-up on a Backlog filing (never held) never re-runs the check.
 */
export const RECHECK_MARK = "Held from the build for the filing check.";
export const isHeldForRecheck = (body) =>
  isRelayedFollowup(body) &&
  String(body ?? "")
    .trimEnd()
    .endsWith(`${RECHECK_MARK}_`);

/**
 * The pure decision: given an `issue_comment: created` payload the workflow's authorization gate has
 * already let through, does this reply resume the lane that is blocked on it?
 *
 * Deliberately NOT a signal-shape match like `isReadySignal`. A ready-flip has to be recognised
 * among prose that merely uses the word; a reply to "which account did you mean?" is an answer
 * whatever its wording, and demanding a shape would re-create the dead end this slice exists to
 * remove. Any non-empty reply from an authorized human counts; if it turns out to answer nothing,
 * the resumed build asks again and lands back on `needs-info` — human-paced, no loop.
 *
 * @returns {{ resume: boolean, reason: string, issue?: object, answered?: string, lane?: "feedback" | "plan" }}
 */
export function replyResumeIntent(ctx) {
  const issue = ctx.payload?.issue;
  const comment = ctx.payload?.comment;
  if (!issue) return no("no issue in the payload");
  if (!comment) return no("no comment in the payload");
  // `issue_comment` fires for PULL REQUEST comments too, under the same `issue` key — a PR carries
  // `pull_request` there and nothing else distinguishes the two payloads. A labelled PR is not a
  // member's ask, and resuming a build "on" one would claim a lease keyed to a PR number.
  if (issue.pull_request) return no(`#${issue.number} is a pull request, not an issue`);
  if (issue.state && String(issue.state).toLowerCase() !== "open") {
    return no(`issue #${issue.number} is not open`);
  }
  const names = labelNames(issue.labels);
  const lane = laneOf(issue);
  if (!lane) {
    return no(
      `#${issue.number} carries neither \`feedback\` nor \`plan\` — no lane is waiting on it`,
    );
  }
  const answered = ANSWERABLE.find((l) => names.includes(l));
  if (!answered) {
    return no(
      `#${issue.number} carries none of ${ANSWERABLE.map((l) => `\`${l}\``).join(" / ")} — no question of ours is waiting`,
    );
  }
  if (isClaudeComment(comment.body)) {
    return no(`#${issue.number} — the lane's own comment never resumes it (the loop guard)`);
  }
  if (!String(comment.body ?? "").trim()) {
    return no(`#${issue.number} — an empty reply answers nothing`);
  }
  if (isRelayedFollowup(comment.body)) {
    if (answered === LABELS.needsEric.name) {
      return no(
        `#${issue.number} — a follow-up the app relayed never answers \`needs-eric\`; that decision is Eric's own`,
      );
    }
    if (!names.includes(LABELS.ready.name)) {
      return no(
        `#${issue.number} — a follow-up the app relayed never readies a filing; it resumes only one already \`ready\``,
      );
    }
  }
  const notPullable = notPullableReason(asResumed(issue, answered));
  if (notPullable) return no(notPullable);
  return {
    resume: true,
    reason: `authorized reply on a \`${answered}\` ${lane} issue`,
    issue,
    answered,
    lane,
  };
}
