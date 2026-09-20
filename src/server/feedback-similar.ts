/**
 * Advisory dedup for a drafted filing (#1867 slice 1) — before `draft_feedback` hands the rail a
 * draft, this looks for open `feedback`-labeled issues that already say roughly the same thing,
 * so a member sees "this might already be filed" before sending a duplicate. Slice 2 (rendering
 * the matches in the rail UI) is a separate PR; this module only produces the `{ number, title }`
 * list the tool result carries.
 *
 * SIMILARITY APPROACH — a plain lexical (Jaccard-over-tokens) heuristic, not embeddings. This repo
 * doesn't want a new spend surface beyond the search itself (CLAUDE.md), and a per-draft call to a
 * paid embeddings API would be exactly that: a new metered dependency triggered on every companion
 * turn that reaches `draft_feedback`, with no cap tied to member volume. Token overlap against
 * open issue titles/bodies is free, deterministic, and good enough for "does this look like an
 * existing bug report" — it does not need to understand paraphrase, just catch the common case of
 * two members describing the same broken thing in similar words. If that recall proves too low in
 * practice, swapping in a real embeddings index is a contained follow-up (this module's
 * `findSimilarIssues` is the one seam to change), not a rewrite.
 *
 * Reuses the SAME GitHub token/repo the filing lane already holds (`SKYNET_FEEDBACK_GITHUB_TOKEN`
 * / `SKYNET_FEEDBACK_REPO`, see feedback-service.ts) — no new credential, and the read-only
 * `GET .../issues` call this makes costs nothing beyond the existing token's rate limit.
 */
import { fetchJson } from "../http/fetch-json.js";
import { githubHeaders } from "./github-api.js";

type DoFetch = typeof fetchJson;

export interface SimilarIssue {
  readonly number: number;
  readonly title: string;
}

/** Open `feedback`-labeled issues, as read off GitHub — just enough to score against a draft. */
export interface OpenFeedbackIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string;
}

interface SimilarFeedbackConfig {
  readonly token: string;
  readonly repo: string;
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "it",
  "this",
  "that",
  "with",
  "as",
  "at",
  "by",
  "be",
  "are",
  "was",
  "were",
  "not",
  "no",
  "so",
  "if",
  "when",
  "then",
  "i",
  "we",
  "you",
  "my",
  "our",
  "your",
  "it's",
  "its",
  "app",
  "member",
  "members",
]);

/** Lowercase word tokens, stripped of punctuation and stopwords — cheap enough to run on every
 *  draft with no caching needed. */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

/** Jaccard similarity over token sets — |intersection| / |union|, 0 when either side is empty. */
export function tokenSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Below this, two issues are "probably unrelated" rather than "probably the same report" — tuned
 *  loose enough to catch same-topic reports phrased differently, tight enough that two short,
 *  generic titles don't false-match on stopword-stripped overlap alone. */
export const SIMILARITY_THRESHOLD = 0.12;

const MAX_MATCHES = 3;

/**
 * Score a draft against every open `feedback`-labeled issue and return up to `MAX_MATCHES` above
 * the threshold, best first. The title carries more of the weight than the body (a real title
 * match is a stronger signal than shared prose in a long details field), so the two are scored
 * separately and title similarity breaks ties.
 */
export function findSimilarIssues(
  draft: { readonly title: string; readonly details: string },
  issues: readonly OpenFeedbackIssue[],
): readonly SimilarIssue[] {
  const draftText = `${draft.title} ${draft.details}`;
  const scored = issues
    .map((issue) => ({
      issue,
      titleScore: tokenSimilarity(draft.title, issue.title),
      overallScore: tokenSimilarity(draftText, `${issue.title} ${issue.body}`),
    }))
    .map((s) => ({ issue: s.issue, score: Math.max(s.titleScore, s.overallScore) }))
    .filter((s) => s.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES);
  return scored.map((s) => ({ number: s.issue.number, title: s.issue.title }));
}

/** Read every currently-open `feedback`-labeled issue — capped at 100 (GitHub's max page size),
 *  which this friends-and-family desk's open-feedback queue is nowhere near approaching. Never
 *  throws: an unreachable GitHub or a bad token degrades to "no matches" rather than blocking the
 *  draft the member is waiting on. */
export async function fetchOpenFeedbackIssues(
  config: SimilarFeedbackConfig,
  doFetch: DoFetch = fetchJson,
): Promise<readonly OpenFeedbackIssue[]> {
  try {
    const url = `https://api.github.com/repos/${config.repo}/issues?state=open&labels=feedback&per_page=100`;
    const res = await doFetch("GET", url, githubHeaders(config.token));
    if (res.status !== 200 || !Array.isArray(res.body)) return [];
    return (res.body as readonly { number?: unknown; title?: unknown; body?: unknown }[])
      .filter((raw) => typeof raw.number === "number" && typeof raw.title === "string")
      .map((raw) => ({
        number: raw.number as number,
        title: raw.title as string,
        body: typeof raw.body === "string" ? raw.body : "",
      }));
  } catch {
    return [];
  }
}

export type FindSimilarFeedback = (draft: {
  readonly title: string;
  readonly details: string;
}) => Promise<readonly SimilarIssue[]>;

/** The bound search — fetch the open queue fresh, then score. Built once per boot; the queue is
 *  small enough (a friends-and-family desk) that no cache is worth the staleness risk. */
export function createSimilarFeedbackSearch(
  config: SimilarFeedbackConfig,
  doFetch: DoFetch = fetchJson,
): FindSimilarFeedback {
  return async (draft) => {
    const issues = await fetchOpenFeedbackIssues(config, doFetch);
    return findSimilarIssues(draft, issues);
  };
}

/** Env factory, same shape as `resolveFeedback` — `undefined` (inert) until the filing token is
 *  set, since there is nothing to search against without it. */
export function resolveSimilarFeedback(
  env: Readonly<Record<string, string | undefined>>,
): FindSimilarFeedback | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return createSimilarFeedbackSearch({ token, repo });
}
