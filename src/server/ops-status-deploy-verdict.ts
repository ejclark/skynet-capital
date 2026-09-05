import type { OpsSignal, OpsSignalLink } from "./ops-status-types.js";

/**
 * THE PURE HALF OF THE DEPLOY-LAG SIGNAL — verdict logic and the bot-relevance
 * classifier, PORTED from `scripts/deploy-lag.mjs` and `scripts/bot-relevant.mjs` rather than
 * imported (see `ops-status-deploy-lag.ts`'s header for why: `src/` type-checks under strict tsc
 * and those two files are plain `.mjs` outside `tsconfig.json`'s `include`). Split out of
 * `ops-status-deploy-lag.ts` — the GitHub-reaching half — to keep both files under the house file-
 * length budget; keep the two copies in sync by hand if the source scripts change.
 */

/** Merges attributed to these identities emit no `push` event, so they strand the deploy —
 *  mirrors `SILENT_MERGERS` in `scripts/deploy-lag.mjs`. */
const SILENT_MERGERS = new Set(["github-actions[bot]", "claude[bot]", "github-actions"]);

export interface StrandedCommit {
  readonly sha: string;
  readonly subject: string;
  readonly mergedBy: string;
}

export interface DeployLagVerdict {
  readonly lagging: boolean;
  readonly behind: number;
  readonly cause: "silent-merge" | "unknown" | null;
}

/** Ported from `deployLag()` in `scripts/deploy-lag.mjs`. */
export function deployLag(
  head: string,
  released: string,
  stranded: readonly StrandedCommit[],
): DeployLagVerdict {
  if (!released || head === released) return { lagging: false, behind: 0, cause: null };
  const silent = stranded.filter((c) => SILENT_MERGERS.has(c.mergedBy));
  return {
    lagging: true,
    behind: stranded.length,
    cause: stranded.length > 0 && silent.length === stranded.length ? "silent-merge" : "unknown",
  };
}

/** Ported from `botsIrrelevant()` in `scripts/bot-relevant.mjs`. */
function botsIrrelevant(path: string): boolean {
  return (
    path.startsWith("docs/") ||
    path.startsWith("tests/") ||
    path.startsWith(".github/") ||
    path.endsWith(".md")
  );
}

/** Ported from `classify()` in `scripts/bot-relevant.mjs`. */
export function classifyBotRelevant(paths: readonly string[]): { deploy: boolean; reason: string } {
  const relevant = paths.filter((p) => !botsIrrelevant(p));
  if (paths.length === 0) return { deploy: false, reason: "no changed paths" };
  if (relevant.length === 0) {
    return { deploy: false, reason: `all ${paths.length} path(s) are docs/tests/workflows` };
  }
  return {
    deploy: true,
    reason: `${relevant.length} bot-relevant path(s), e.g. ${relevant.slice(0, 3).join(", ")}`,
  };
}

export interface BotsDeployLagVerdict {
  readonly known: boolean;
  readonly baseline: boolean;
  readonly lagging: boolean;
  readonly reason?: string;
}

/** Ported from `botsDeployLag()` in `scripts/deploy-lag.mjs`. `botsReleased`/`botsChanged`
 *  `undefined` = the scan itself failed; `""`/`[]` = scanned clean, no baseline yet. */
export function botsDeployLag(
  head: string,
  botsReleased: string | undefined,
  botsChanged: readonly string[] | undefined,
): BotsDeployLagVerdict {
  if (botsReleased === undefined || botsChanged === undefined) {
    return { known: false, baseline: false, lagging: false };
  }
  if (!botsReleased) return { known: true, baseline: false, lagging: false };
  if (botsReleased === head || botsChanged.length === 0) {
    return { known: true, baseline: true, lagging: false };
  }
  const verdict = classifyBotRelevant(botsChanged);
  return {
    known: true,
    baseline: true,
    lagging: verdict.deploy,
    ...(verdict.reason ? { reason: verdict.reason } : {}),
  };
}

const short = (sha: string): string => sha.slice(0, 7) || "unknown";

/** Both deploy signals reading "unknown" with the same `detail`/link — the shape shared by the
 *  two honest-degrade paths below (no token configured, or a token but GitHub didn't answer).
 *  They read the SAME shape but different WORDING on purpose: one says "not configured", the
 *  other "couldn't reach it right now" — never conflated into one ambiguous message. */
function unknownDeploySignals(
  detail: string,
  actionsLink: OpsSignalLink,
): { app: OpsSignal; bots: OpsSignal } {
  return {
    app: { id: "deploy-app", label: "App deploy", verdict: "unknown", detail, link: actionsLink },
    bots: {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "unknown",
      detail,
      link: actionsLink,
    },
  };
}

/** The two deploy signals when no token is configured — the honest degraded mode this panel
 *  defaults to rather than provisioning anything new. The bots row still names the running commit
 *  when the process reported one: knowing WHAT is running never depended on the GitHub token, only
 *  judging whether it is current does. */
export function degradedDeploySignals(
  actionsLink: OpsSignalLink,
  botsRunningSha?: string,
): {
  app: OpsSignal;
  bots: OpsSignal;
} {
  const signals = unknownDeploySignals(
    "No GitHub token configured for this app (SKYNET_FEEDBACK_GITHUB_TOKEN) — deploy lag isn't computed here. Check Actions directly.",
    actionsLink,
  );
  if (!botsRunningSha) return signals;
  return {
    app: signals.app,
    bots: {
      ...signals.bots,
      detail: `Bots report running ${short(botsRunningSha)}. No GitHub token configured here, so whether that's current isn't computed — check Actions.`,
    },
  };
}

/** Same shape as `degradedDeploySignals`, worded for "we have a token but GitHub didn't answer"
 *  rather than "no token configured" — the two honest-degrade paths read differently on purpose. */
export function degradedFromFailure(
  actionsLink: OpsSignalLink,
  botsRunningSha?: string,
): {
  app: OpsSignal;
  bots: OpsSignal;
} {
  const signals = unknownDeploySignals(
    "Couldn't reach the GitHub Actions API just now — check Actions directly.",
    actionsLink,
  );
  if (!botsRunningSha) return signals;
  return {
    app: signals.app,
    bots: {
      ...signals.bots,
      detail: `Bots report running ${short(botsRunningSha)}. Couldn't reach the GitHub Actions API just now, so whether that's current isn't computed — check Actions.`,
    },
  };
}

export function appDeploySignal(
  lag: DeployLagVerdict,
  head: string,
  released: string,
  actionsLink: OpsSignalLink,
): OpsSignal {
  if (!released) {
    return {
      id: "deploy-app",
      label: "App deploy",
      verdict: "unknown",
      detail: "Couldn't determine the last deployed commit from Actions.",
      link: actionsLink,
    };
  }
  if (!lag.lagging) {
    return {
      id: "deploy-app",
      label: "App deploy",
      verdict: "ok",
      detail: `main (${short(head)}) is the deployed commit.`,
    };
  }
  const why =
    lag.cause === "silent-merge"
      ? "every stranding commit was merged by a token that emits no push, so the deploy never fired"
      : "cause unclear — check whether the deploy job failed rather than never starting";
  return {
    id: "deploy-app",
    label: "App deploy",
    verdict: "attention",
    detail: `main is ${lag.behind} commit(s) ahead of the deployed ${short(released)} — ${why}.`,
    link: actionsLink,
  };
}

/**
 * The bots row. `botsRunningSha` is the commit the bots PROCESS reported on its last controls poll
 * (`controls-poll-wire.ts`) — when present it is both the baseline the verdict was computed
 * against and the answer to #666's "on what commit?", so every branch below names it. It outranks
 * CI's deploy record on purpose: a machine whose deploy succeeded but whose process later rolled
 * back still reads "current" from the record, and reads honestly from its own word.
 */
export function botsDeploySignal(
  lag: BotsDeployLagVerdict,
  actionsLink: OpsSignalLink,
  botsRunningSha?: string,
): OpsSignal {
  const running = botsRunningSha ? short(botsRunningSha) : "";
  if (!lag.known) {
    return {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "unknown",
      detail: running
        ? `Bots report running ${running}, but GitHub couldn't say what has changed since — check Actions.`
        : "Couldn't scan Actions job history for the bots app.",
      link: actionsLink,
    };
  }
  if (!lag.baseline) {
    return {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "unknown",
      detail:
        "No confirmed bots deploy in the scanned window (pre-cutover, or deploy-bots hasn't run yet).",
      link: actionsLink,
    };
  }
  if (!lag.lagging) {
    return {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "ok",
      detail: running
        ? `Bots are running ${running} — current; nothing bot-relevant has merged since.`
        : "Bots app is current — nothing bot-relevant merged since its last deploy.",
    };
  }
  const since = running ? `Bots are running ${running}, STALE` : "Bots app is STALE";
  return {
    id: "deploy-bots",
    label: "Bots deploy",
    verdict: "attention",
    detail: `${since} — ${lag.reason ?? "bot-relevant commits pending"} since${running ? "" : " its last deploy"}. Recover via Pipeline → Run workflow → force_bots_deploy.`,
    link: actionsLink,
  };
}
