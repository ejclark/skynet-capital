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
import { createHash } from "node:crypto";

import { fetchJson } from "../http/fetch-json.js";

export type FeedbackKind = "bug" | "feature" | "idea";

export interface FeedbackInput {
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly submitterEmail?: string;
}

export type FeedbackResult =
  | { readonly ok: true; readonly url: string; readonly number: number }
  | { readonly ok: false; readonly error: string };

export type SubmitFeedback = (input: FeedbackInput) => Promise<FeedbackResult>;

// Labels match the .github/ISSUE_TEMPLATE forms so app + GitHub submissions triage the same way.
const LABELS: Record<FeedbackKind, readonly string[]> = {
  bug: ["bug", "feedback"],
  feature: ["enhancement", "feedback"],
  idea: ["idea", "feedback"],
};
const FEEDBACK_KIND_LABEL: Record<FeedbackKind, string> = {
  bug: "🐞 Bug",
  feature: "✨ Feature",
  idea: "🗺️ Side quest",
};
const TITLE_TAG: Record<FeedbackKind, string> = {
  bug: "[bug]",
  feature: "[enhancement]",
  idea: "[idea]",
};

/**
 * Opaque, stable member marker for public issues. The repo is public, so the issue body must never
 * carry a name or email (Eric's attribution ruling, 2026-08-19: opaque id only — who-filed-what is
 * visible only inside the app). Truncated salted sha256: stable per member so their items
 * correlate, pseudonymous to readers. Not cryptographically unlinkable for a tiny guest list —
 * treated as pseudonymity, not secrecy.
 */
export function opaqueMemberId(email: string): string {
  return createHash("sha256")
    .update(`skynet-feedback:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 10);
}

/**
 * The filed issue's body: the member's words first (the ask is what a human reads first), then the
 * metadata as a small table rather than a run of `**Key:** value` lines — repeated key/value facts
 * are scanned in a table and skipped as prose (docs/ISSUES.md). The pseudonymous footer is last
 * and unchanged.
 */
export function issueBody(input: FeedbackInput): string {
  const lines: string[] = [input.details.trim() || "_(no details provided)_", ""];
  const meta: [string, string][] = [["Kind", FEEDBACK_KIND_LABEL[input.kind]]];
  if (input.area) meta.push(["Where", input.area]);
  lines.push("| | |", "|---|---|", ...meta.map(([k, v]) => `| **${k}** | ${v} |`));
  const who = input.submitterEmail?.trim()
    ? `member \`${opaqueMemberId(input.submitterEmail)}\``
    : "a league member";
  lines.push("", "---", `_Submitted from the app by ${who}._`);
  return lines.join("\n");
}

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
          title: `${TITLE_TAG[input.kind]} ${title}`,
          body: issueBody(input),
          labels: LABELS[input.kind],
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
