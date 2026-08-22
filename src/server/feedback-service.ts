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
import {
  type FeedbackInput,
  type FeedbackKind,
  issueBody,
  labelsFor,
  titleFor,
} from "./feedback-issue.js";

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

/** Build the bound submit function that POSTs a GitHub issue. Live path (uses global fetch). */
function createFeedbackIssue(config: FeedbackConfig): SubmitFeedback {
  return async (input) => {
    const title = input.title.trim();
    if (!title) return { ok: false, error: "Please add a short title so we know what it's about." };
    try {
      const res = await fetchJson(
        "POST",
        `https://api.github.com/repos/${config.repo}/issues`,
        {
          Authorization: `Bearer ${config.token}`,
          "User-Agent": "skynet-capital",
          Accept: "application/vnd.github+json",
        },
        {
          title: titleFor({ ...input, title }),
          body: issueBody(input),
          labels: labelsFor(input),
        },
      );
      if (res.status === 201 && res.body && typeof res.body === "object") {
        const body = res.body as { html_url?: string; number?: number };
        return {
          ok: true,
          url: body.html_url ?? `https://github.com/${config.repo}/issues`,
          number: body.number ?? 0,
        };
      }
      const message =
        res.body && typeof res.body === "object"
          ? (res.body as { message?: string }).message
          : undefined;
      return {
        ok: false,
        error: `GitHub responded ${res.status}${message ? `: ${message}` : ""}.`,
      };
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
