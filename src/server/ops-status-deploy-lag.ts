import { fetchJson } from "../http/fetch-json.js";
import { githubHeaders } from "./github-api.js";
import {
  appDeploySignal,
  botsDeployLag,
  botsDeploySignal,
  degradedFromFailure,
  deployLag,
  type StrandedCommit,
} from "./ops-status-deploy-verdict.js";
import type { OpsSignal, OpsSignalLink } from "./ops-status-types.js";

/**
 * THE IMPURE HALF OF THE DEPLOY-LAG SIGNAL — "is `main` actually deployed?", read
 * live through the GitHub REST API the app already reaches for feedback filing
 * (`SKYNET_FEEDBACK_GITHUB_TOKEN`, see `feedback-service.ts`/`feedback-status.ts`). No new
 * credential: the panel's constraint ("read-only credentials only... an honest smaller panel beats
 * a credentialed bigger one") is about the Fly machines API for bots-machine-state/GIT_SHA — that
 * fork is left for slice 2. This file answers a narrower, already-affordable question.
 *
 * The verdict logic this fetches into (`deployLag`/`botsDeployLag`, ported from
 * `scripts/deploy-lag.mjs`/`scripts/bot-relevant.mjs`) lives in `ops-status-deploy-verdict.ts` —
 * see that file's header for why they're ported rather than imported from the `.mjs` originals.
 */

export type DoFetch = typeof fetchJson;

interface GhRun {
  readonly id: number;
  readonly head_sha: string;
}
interface GhJobStep {
  readonly name: string;
  readonly conclusion: string | null;
}
interface GhJob {
  readonly name: string;
  readonly conclusion: string | null;
  readonly steps?: readonly GhJobStep[];
}

/** GET + parse, folding a non-2xx status or a network failure into `undefined` — every caller
 *  here degrades to an honest "unknown" signal, never an error page. */
async function ghGet<T>(doFetch: DoFetch, token: string, url: string): Promise<T | undefined> {
  try {
    const res = await doFetch("GET", url, githubHeaders(token));
    if (res.status < 200 || res.status >= 300) return undefined;
    return res.body as T;
  } catch {
    return undefined;
  }
}

const RUNS_SCANNED = 20;

/** Mirrors `scanRunBaselines()`: walk recent `pipeline.yml` push-to-main runs, newest first,
 *  reading each run's JOB conclusions (not the run's own) until both baselines are found —
 *  `deploy-lag.mjs`'s header explains why the run-level status is the wrong signal after the
 *  deploy split. Returns `undefined` only when the run LIST itself couldn't be read. */
async function scanBaselines(
  repo: string,
  token: string,
  doFetch: DoFetch,
): Promise<{ released: string; botsReleased: string } | undefined> {
  const runsBody = await ghGet<{ workflow_runs?: GhRun[] }>(
    doFetch,
    token,
    `https://api.github.com/repos/${repo}/actions/workflows/pipeline.yml/runs?event=push&branch=main&per_page=${RUNS_SCANNED}`,
  );
  if (!runsBody) return undefined;
  const runs = runsBody.workflow_runs ?? [];
  let released = "";
  let botsReleased: string | undefined;
  for (const run of runs) {
    if (released && botsReleased !== undefined) break;
    const jobsBody = await ghGet<{ jobs?: GhJob[] }>(
      doFetch,
      token,
      `https://api.github.com/repos/${repo}/actions/runs/${run.id}/jobs?per_page=30`,
    );
    const jobs = jobsBody?.jobs ?? [];
    if (!released && jobs.find((j) => j.name === "release · deploy")?.conclusion === "success") {
      released = run.head_sha;
    }
    if (botsReleased === undefined) {
      const step = jobs
        .find((j) => j.name === "release · deploy bots")
        ?.steps?.find((s) => s.name === "Deploy bots");
      if (step?.conclusion === "success") botsReleased = run.head_sha;
    }
  }
  if (!released) {
    const fallback = await ghGet<{ workflow_runs?: GhRun[] }>(
      doFetch,
      token,
      `https://api.github.com/repos/${repo}/actions/workflows/pipeline.yml/runs?event=push&branch=main&status=success&per_page=1`,
    );
    released = fallback?.workflow_runs?.[0]?.head_sha ?? "";
  }
  return { released, botsReleased: botsReleased ?? "" };
}

interface CompareBody {
  readonly commits?: ReadonlyArray<{
    readonly sha: string;
    readonly commit?: { readonly message?: string };
    readonly author?: { readonly login?: string };
    readonly committer?: { readonly login?: string };
  }>;
  readonly files?: ReadonlyArray<{ readonly filename: string }>;
}

/** `base === ""` (no confirmed baseline) or `base === head` (already current) both mean "nothing
 *  to diff" — resolved locally rather than spending a GitHub call proving what's already known. */
function fetchCompare(
  repo: string,
  token: string,
  doFetch: DoFetch,
  base: string,
  head: string,
): Promise<CompareBody | undefined> {
  if (!base || base === head) return Promise.resolve({ commits: [], files: [] });
  return ghGet<CompareBody>(
    doFetch,
    token,
    `https://api.github.com/repos/${repo}/compare/${base}...${head}`,
  );
}

export interface DeployLagConfig {
  /** GitHub token with at least read access to Actions runs/jobs on `repo` — the same
   *  `SKYNET_FEEDBACK_GITHUB_TOKEN` the feedback surface already holds. */
  readonly token: string;
  /** `owner/repo`, e.g. `ejclark/skynet-capital`. */
  readonly repo: string;
}

/** The impure boundary: read main's head, the two deploy baselines, and (when either is stale)
 *  the diff since — then fold through the pure verdict functions in `ops-status-deploy-verdict.ts`.
 *  Every failure degrades to an "unknown" signal with the Actions deep link, never a thrown error. */
export async function computeDeploySignals(
  config: DeployLagConfig,
  actionsLink: OpsSignalLink,
  doFetch: DoFetch = fetchJson,
): Promise<{ app: OpsSignal; bots: OpsSignal }> {
  const headBody = await ghGet<{ sha?: string }>(
    doFetch,
    config.token,
    `https://api.github.com/repos/${config.repo}/commits/main`,
  );
  const head = headBody?.sha;
  const baselines = head ? await scanBaselines(config.repo, config.token, doFetch) : undefined;
  if (!(head && baselines)) return degradedFromFailure(actionsLink);

  const strandedBody = await fetchCompare(
    config.repo,
    config.token,
    doFetch,
    baselines.released,
    head,
  );
  const stranded: StrandedCommit[] | undefined = strandedBody?.commits?.map((c) => ({
    sha: c.sha,
    subject: (c.commit?.message ?? "").split("\n")[0] ?? "",
    mergedBy: c.author?.login ?? c.committer?.login ?? "",
  }));
  const app = appDeploySignal(
    deployLag(head, baselines.released, stranded ?? []),
    head,
    baselines.released,
    actionsLink,
  );

  const changedBody = await fetchCompare(
    config.repo,
    config.token,
    doFetch,
    baselines.botsReleased,
    head,
  );
  const changed = changedBody?.files?.map((f) => f.filename);
  const bots = botsDeploySignal(botsDeployLag(head, baselines.botsReleased, changed), actionsLink);

  return { app, bots };
}

/** Build the deploy-signal fetcher with its own short-TTL cache — the panel may render on every
 *  SSE tick, and each render costs up to ~20 Actions job calls; a 60s cache keeps that bounded to
 *  what a phone-glance cadence actually needs (mirrors the cache in `feedback-status.ts`). */
export function createDeployLagFetcher(
  config: DeployLagConfig,
  doFetch: DoFetch = fetchJson,
): (now: Date) => Promise<{ app: OpsSignal; bots: OpsSignal }> {
  const actionsLink: OpsSignalLink = {
    href: `https://github.com/${config.repo}/actions/workflows/pipeline.yml`,
    label: "Open Actions",
  };
  let cached:
    | { readonly at: number; readonly app: OpsSignal; readonly bots: OpsSignal }
    | undefined;
  const TTL_MS = 60_000;
  return async (now: Date) => {
    if (cached && now.getTime() - cached.at < TTL_MS) return { app: cached.app, bots: cached.bots };
    const result = await computeDeploySignals(config, actionsLink, doFetch);
    cached = { at: now.getTime(), ...result };
    return result;
  };
}

/** Env factory — `undefined` (degraded mode) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set, the
 *  same token+repo `feedback-service.ts`/`feedback-status.ts` already resolve; this panel reuses
 *  it read-only rather than provisioning anything new. */
export function resolveDeployLagFetcher(
  env: Readonly<Record<string, string | undefined>>,
): ((now: Date) => Promise<{ app: OpsSignal; bots: OpsSignal }>) | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return createDeployLagFetcher({ token, repo });
}
