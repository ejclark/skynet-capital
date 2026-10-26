/**
 * Follow-up on a filed feedback issue — a member adding more detail after the fact ("actually,
 * here's a screenshot" / "still happening", or correcting something they got wrong) needed a way
 * back into the loop that doesn't require them to leave the app or have a GitHub account.
 *
 * Deliberately a COMMENT, never an edit to the original issue body: the body carries structured
 * content the build lane parses (the `skynet-spec` block, the labels, the attribution footer —
 * feedback-issue.ts) and a member-editable PATCH risks corrupting that. A comment is the native
 * GitHub way to add or correct information on a thread without disturbing the original post, and
 * it keeps the audit trail (what was said, when) instead of overwriting it.
 *
 * On a filing that is already `ready`, the follow-up ALSO restarts its build, by removing then
 * re-adding `ready` — the label whose `labeled` event starts the build claim
 * (`--claim-feedback` in .github/workflows/moneypenny-events.yml; the claim lease makes a re-label a
 * safe retry, not a second build). Until #3912 (2026-09-27) the build started on `feedback`, and
 * this file cycled that; afterwards a `feedback` event only runs triage, so the follow-up promised
 * a restart it no longer caused (#5848). A filing still in Backlog gets the comment and nothing
 * else: re-adding `ready` there would let a member skip the backlog gate (docs/FEEDBACK.md → What
 * the lane will build). So does any `ready` filing the claim's pull rule refuses (closed, parked,
 * in-progress, `needs-session`, blocked — `notPullableReason`, asked here directly), and the result
 * names which, so the screen never promises a restart that won't happen.
 *
 * This deliberately reuses the EXISTING, curated, envelope-bound build-feedback lane
 * rather than the separate, higher-trust claude.yml comment-steering lane: that lane grants an
 * unrestricted Bash/Write/Edit session to any comment from a recognized OWNER/MEMBER/COLLABORATOR,
 * gated on GitHub's own `author_association` — a comment posted by this bot's own identity would
 * not (and should not) carry that trust. Routing follow-ups through it would let a member's raw
 * text steer an unenveloped session merely because the app relayed it; the label-based path keeps
 * every follow-up bound by the same `envelope.json` scan as the original submission.
 */
import { notPullableReason, type PullableIssue } from "../../scripts/moneypenny/labels.mjs";
import { fetchJson, type JsonResponse } from "../http/fetch-json.js";
import { submitterFor } from "./feedback-attribution.js";
import { githubErrorMessage, githubHeaders } from "./github-api.js";

type DoFetch = typeof fetchJson;

interface FeedbackFollowupInput {
  readonly issueNumber: number;
  readonly body: string;
  readonly submitterEmail?: string;
  readonly submitterName?: string;
}

/** What the follow-up did to the build (#5848), so the screen can say it honestly:
 *  - `restarted` — the filing was in Ready and `ready` was cycled, so the build claim runs again;
 *  - `backlog` — open but not `ready`: the comment waits with it for the queue;
 *  - `held` — parked on a person (a parking label, or `needs-session`): it waits on them first;
 *  - `building` — already `in-progress`: a build is running now;
 *  - `blocked` — an open `blocked-by` issue: it starts when that closes;
 *  - `closed` — the issue is closed (shipped or not built): nothing picks it up again;
 *  - `stranded` — `ready` came off and would not go back on: the build did NOT restart, and the
 *    server logged the issue number for an operator;
 *  - `unchanged` — the labels could not be read, a label write failed before anything moved, or
 *    the pull rule refused it for a reason not named above: no promise either way. */
export type FollowupOutcome =
  | "restarted"
  | "backlog"
  | "held"
  | "building"
  | "blocked"
  | "closed"
  | "stranded"
  | "unchanged";

type FollowupResult =
  | { readonly ok: true; readonly url: string; readonly outcome: FollowupOutcome }
  | { readonly ok: false; readonly error: string };

export type SubmitFollowup = (input: FeedbackFollowupInput) => Promise<FollowupResult>;

interface FollowupConfig {
  readonly token: string;
  readonly repo: string;
}

/** Where an operator-facing line goes — the server log at boot (src/scripts/dashboard-feedback.ts),
 *  silent by default so specs stay quiet. */
type Warn = (line: string) => void;

const ok2xx = (res: JsonResponse): boolean => res.status >= 200 && res.status < 300;

/** Which rule the pull rule refused on, read off `notPullableReason`'s first failing rule. A
 *  wording change there lands on `unchanged` (no promise), and the spec walks the real rule for
 *  each case, so it fails until this list catches up. */
const REFUSED: readonly (readonly [RegExp, FollowupOutcome])[] = [
  [/ is not open$/, "closed"],
  [/does not carry `ready`/, "backlog"],
  [/ is parked by /, "held"],
  [/already `in-progress`/, "building"],
  [/carries `needs-session`/, "held"],
  [/ is blocked by /, "blocked"],
];
const refusedAs = (reason: string): FollowupOutcome =>
  REFUSED.find(([rule]) => rule.test(reason))?.[1] ?? "unchanged";

/** A label write that may throw (network) reads as a failed one. */
async function write(attempt: () => Promise<JsonResponse>): Promise<boolean> {
  try {
    return ok2xx(await attempt());
  } catch {
    return false;
  }
}

/** Best-effort, after the comment posted: one GET for the issue as it stands (never anything the
 *  app cached), then remove + re-add `ready` only when the claim's own pull rule
 *  (`notPullableReason`, the one the claim re-asks after the `labeled` event) would take it — so
 *  the screen never promises a restart the claim then refuses. Any failure answers an outcome and
 *  never fails the comment — the member's words matter more than the restart. */
async function restartReadyBuild(
  issueNumber: number,
  config: FollowupConfig,
  doFetch: DoFetch,
  warn: Warn,
): Promise<FollowupOutcome> {
  const issueUrl = `https://api.github.com/repos/${config.repo}/issues/${issueNumber}`;
  const headers = githubHeaders(config.token);
  let issue: PullableIssue;
  try {
    const res = await doFetch("GET", issueUrl, headers);
    if (!(ok2xx(res) && res.body) || typeof res.body !== "object") return "unchanged";
    issue = res.body as PullableIssue;
  } catch {
    return "unchanged";
  }
  if (!Array.isArray(issue.labels)) return "unchanged";
  const refused = notPullableReason({ ...issue, number: issueNumber });
  if (refused !== null) return refusedAs(refused);

  if (!(await write(() => doFetch("DELETE", `${issueUrl}/labels/ready`, headers)))) {
    return "unchanged"; // `ready` is still on and nothing moved
  }
  const readd = () => doFetch("POST", `${issueUrl}/labels`, headers, { labels: ["ready"] });
  // `ready` is off now: a filing already through the backlog gate would drop out of the Ready
  // column and the retry sweep, and the stall audit only pings ready filings — so one retry, then
  // say so where an operator will see it.
  if ((await write(readd)) || (await write(readd))) return "restarted";
  warn(
    `[feedback-followup] #${issueNumber} lost \`ready\` — removed for a follow-up restart, and ` +
      "re-adding it failed twice; re-add `ready` by hand so the filing returns to the Ready column",
  );
  return "stranded";
}

/** Build the bound follow-up function. Live path (uses global fetch); `doFetch` is injectable so
 *  tests never hit the network, same discipline as `uploadFeedbackImages` / `createStatusFetcher`. */
export function createFollowup(
  config: FollowupConfig,
  doFetch: DoFetch = fetchJson,
  warn: Warn = () => undefined,
): SubmitFollowup {
  return async (input) => {
    const body = input.body.trim();
    if (!body) return { ok: false, error: "Add a few words so there's something to follow up on." };
    const commentBody = `${body}\n\n---\n_Follow-up from ${submitterFor(input)}._`;
    try {
      const res = await doFetch(
        "POST",
        `https://api.github.com/repos/${config.repo}/issues/${input.issueNumber}/comments`,
        githubHeaders(config.token),
        { body: commentBody },
      );
      if (res.status !== 201) return { ok: false, error: githubErrorMessage(res) };
      const outcome = await restartReadyBuild(input.issueNumber, config, doFetch, warn);
      return {
        ok: true,
        url: `https://github.com/${config.repo}/issues/${input.issueNumber}`,
        outcome,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Couldn't reach GitHub.",
      };
    }
  };
}

/** Env factory — `undefined` (inert) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set, mirroring
 *  `resolveFeedback` in feedback-service.ts (same token, same repo default). */
export function resolveFeedbackFollowup(
  env: Readonly<Record<string, string | undefined>>,
  warn?: Warn,
): SubmitFollowup | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return createFollowup({ token, repo }, fetchJson, warn);
}
