/**
 * Self-service feedback → GitHub issues. Signed-in league members submit feedback from inside the
 * app (see `/feedback` in dashboard-server); this files a labelled issue on the repo via a bot
 * token — so friends and family never need a GitHub account or repo access.
 *
 * The whole feature is token-gated: `resolveFeedback(env)` returns `undefined` when
 * `SKYNET_FEEDBACK_GITHUB_TOKEN` isn't set, so the app runs inert until the credential is provided.
 * Mirrors the `ParticipantService` shape: never throws for expected failures — returns a
 * discriminated `FeedbackResult`.
 */
import { fetchJson } from "../http/fetch-json.js";
import { uploadFeedbackImages } from "./feedback-images.js";
import {
  type FeedbackInput,
  type FeedbackKind,
  issueBody,
  labelsFor,
  opaqueMemberId,
  titleFor,
} from "./feedback-issue.js";
import { githubErrorMessage, githubHeaders } from "./github-api.js";

type DoFetch = typeof fetchJson;

// Re-exported so every existing consumer keeps one import site. The shapes live with the module
// that decides what an issue SAYS, which is also what breaks the import cycle between the two.
export type { FeedbackInput, FeedbackKind };

export type FeedbackResult =
  | { readonly ok: true; readonly url: string; readonly number: number }
  | { readonly ok: false; readonly error: string };

export type SubmitFeedback = (input: FeedbackInput) => Promise<FeedbackResult>;

interface FeedbackConfig {
  /** GitHub token with Issues: read & write on the repo. Never logged or echoed. */
  readonly token: string;
  /** `owner/repo`, e.g. `ejclark/skynet-capital`. */
  readonly repo: string;
}

/** Images upload first (never fatal on their own — see feedback-images.ts) so a partial or total
 *  attachment failure still files the member's words. Empty when the member attached nothing. */
function resolveImageUrls(
  input: FeedbackInput,
  config: FeedbackConfig,
): Promise<readonly string[]> {
  if (!input.images?.length) return Promise.resolve([]);
  const memberId = input.submitterEmail ? opaqueMemberId(input.submitterEmail) : "anon";
  return uploadFeedbackImages(input.images, config, memberId);
}

/**
 * Labels are applied in a SEPARATE call after the issue exists, never inline on the creating POST.
 * `postmaster.yml`'s feedback lane triggers only on the `issues.labeled` webhook event — GitHub
 * never emits that event for labels present at creation time, only `issues.opened`. An issue filed
 * with `labels` baked into the create call is claimed by nothing: it sits open, looking triaged,
 * while the build lane that's supposed to pick it up never even sees it fire (found on #674, which
 * carried `feedback` from the moment it was opened and was never claimed). Splitting the calls
 * restores the event the workflow is actually listening for.
 */
async function attachLabels(
  number: number,
  labels: readonly string[],
  config: FeedbackConfig,
  doFetch: DoFetch,
): Promise<void> {
  if (labels.length === 0) return;
  await doFetch(
    "POST",
    `https://api.github.com/repos/${config.repo}/issues/${number}/labels`,
    githubHeaders(config.token),
    { labels },
  ).catch(() => undefined);
}

/** Build the bound submit function that POSTs a GitHub issue. Live path (uses global fetch);
 *  `doFetch` is overridable so specs can assert the create-then-label call sequence directly. */
export function createFeedbackIssue(
  config: FeedbackConfig,
  doFetch: DoFetch = fetchJson,
): SubmitFeedback {
  return async (input) => {
    const title = input.title.trim();
    if (!title) return { ok: false, error: "Please add a short title so we know what it's about." };
    try {
      const imageUrls = await resolveImageUrls(input, config);
      const res = await doFetch(
        "POST",
        `https://api.github.com/repos/${config.repo}/issues`,
        githubHeaders(config.token),
        {
          title: titleFor({ ...input, title }),
          body: issueBody(input, imageUrls),
        },
      );
      if (res.status === 201 && res.body && typeof res.body === "object") {
        const body = res.body as { html_url?: string; number?: number };
        const number = body.number ?? 0;
        if (number) await attachLabels(number, labelsFor(input), config, doFetch);
        return {
          ok: true,
          url: body.html_url ?? `https://github.com/${config.repo}/issues`,
          number,
        };
      }
      return { ok: false, error: githubErrorMessage(res) };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Couldn't reach GitHub.",
      };
    }
  };
}

/** Env factory — `undefined` (inert) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set. */
export function resolveFeedback(
  env: Readonly<Record<string, string | undefined>>,
): SubmitFeedback | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return createFeedbackIssue({ token, repo });
}
