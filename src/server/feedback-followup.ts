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
 * The follow-up ALSO re-triggers a build, by removing then re-adding the `feedback` label — the
 * same retry path postmaster.mjs already documents ("Re-apply the `feedback` label to retry the
 * build — the claim lease makes a re-label a safe retry, not a second build"). This deliberately
 * reuses the EXISTING, curated, envelope-bound build-feedback lane (.github/workflows/postmaster.yml)
 * rather than the separate, higher-trust claude.yml comment-steering lane: that lane grants an
 * unrestricted Bash/Write/Edit session to any comment from a recognized OWNER/MEMBER/COLLABORATOR,
 * gated on GitHub's own `author_association` — a comment posted by this bot's own identity would
 * not (and should not) carry that trust. Routing follow-ups through it would let a member's raw
 * text steer an unenveloped session merely because the app relayed it; the label-based path keeps
 * every follow-up bound by the same `envelope.json` scan as the original submission.
 */
import { fetchJson } from "../http/fetch-json.js";
import { submitterFor } from "./feedback-attribution.js";
import { githubErrorMessage, githubHeaders } from "./github-api.js";

type DoFetch = typeof fetchJson;

interface FeedbackFollowupInput {
  readonly issueNumber: number;
  readonly body: string;
  readonly submitterEmail?: string;
  readonly submitterName?: string;
}

export type FollowupResult =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly error: string };

export type SubmitFollowup = (input: FeedbackFollowupInput) => Promise<FollowupResult>;

interface FollowupConfig {
  readonly token: string;
  readonly repo: string;
}

/** Best-effort: an issue this app filed always carries `feedback` (labelsFor always includes it),
 *  but a 404 here (already removed, e.g. by a concurrent follow-up) must never fail the comment
 *  that already posted — the member's words matter more than the retrigger. */
async function retriggerBuild(
  issueNumber: number,
  config: FollowupConfig,
  doFetch: DoFetch,
): Promise<void> {
  await doFetch(
    "DELETE",
    `https://api.github.com/repos/${config.repo}/issues/${issueNumber}/labels/feedback`,
    githubHeaders(config.token),
  ).catch(() => undefined);
  await doFetch(
    "POST",
    `https://api.github.com/repos/${config.repo}/issues/${issueNumber}/labels`,
    githubHeaders(config.token),
    { labels: ["feedback"] },
  ).catch(() => undefined);
}

/** Build the bound follow-up function. Live path (uses global fetch); `doFetch` is injectable so
 *  tests never hit the network, same discipline as `uploadFeedbackImages` / `createStatusFetcher`. */
export function createFollowup(
  config: FollowupConfig,
  doFetch: DoFetch = fetchJson,
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
      await retriggerBuild(input.issueNumber, config, doFetch);
      return { ok: true, url: `https://github.com/${config.repo}/issues/${input.issueNumber}` };
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
): SubmitFollowup | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return createFollowup({ token, repo });
}
