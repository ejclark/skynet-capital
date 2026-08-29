import { degradedDeploySignals } from "./ops-status-deploy-verdict.js";
import type { OpsSignal, OpsSignalLink, OpsStatus } from "./ops-status-types.js";

// Re-exported so every existing consumer (`ops-status-routes.ts`, `ops-status-view.ts`,
// `dashboard-ops-status.ts`) keeps one import site — this module is still the composition root
// for the shape, even though the shape itself lives in `ops-status-types.ts` (a dependency-free
// leaf, so it can't reintroduce the import cycle `scripts/dep-graph-scan.mjs` caught here once).
export type { OpsSignal, OpsSignalLink, OpsStatus } from "./ops-status-types.js";

/**
 * THE OPS-STATUS SERVICE (#666 slice 1) — "bots up? on what commit? deploy lag?" answered from
 * what this process can already see, with no new credential. Eric was on his phone while the bots
 * were dark with no surface that said so; this is that surface's read side.
 *
 * Four signals, each honest about what it actually proves:
 *  - `deploy-app` / `deploy-bots` — is `main` deployed? (`ops-status-deploy-lag.ts`, via the
 *    GitHub Actions API the app already reaches for feedback filing).
 *  - `bridge` — has the bots process polled Mission Control recently? The closest credential-free
 *    proxy for "is the bots app alive" this process has: it doesn't watch Fly machine state (that's
 *    slice 2's fork), but the poll IS the bots process reaching this one, every ~30s
 *    (`bot-controls-client.ts`'s `POLL_MS`), so its absence is real signal.
 *  - `activity` — when did a bot last place an order? A slower, second-order corroboration of the
 *    bridge signal — deliberately never alarms on its own (markets close; bots go quiet on
 *    weekends), only flagged `unknown` rather than `attention`.
 *
 * Slice 2 (deferred, per the issue's own slicing sketch): bots machine state + GIT_SHA via a Fly
 * read token, if that fork settles in favor of the richer, credentialed version.
 */

/** The bots process polls this app's internal bridge every 30s (`bot-controls-client.ts`'s
 *  `POLL_MS`); three missed ticks' worth of margin absorbs an ordinary jitter/GC pause without
 *  crying wolf. */
const BRIDGE_POLL_INTERVAL_MS = 30_000;
const BRIDGE_STALE_AFTER_MS = BRIDGE_POLL_INTERVAL_MS * 3;

/** A day with zero bot orders is unremarkable (a quiet market, a weekend) — this signal never
 *  alarms on its own; it only ever reads `unknown`, worded to point at the bridge signal instead
 *  of raising a second, possibly-false alarm. */
const ACTIVITY_QUIET_AFTER_MS = 24 * 60 * 60 * 1000;

const secondsAgo = (iso: string, now: Date): number =>
  Math.round((now.getTime() - Date.parse(iso)) / 1000);

/** `bridgeLastPollAt` is `undefined` when this app process has recorded no poll yet — either the
 *  bots process hasn't started, or it started before (or long after) this app did; that reads as
 *  `unknown`, not `attention`, since it says nothing about whether the bots app is actually down. */
export function bridgeSignal(
  bridgeLastPollAt: string | undefined,
  now: Date,
  link: OpsSignalLink,
): OpsSignal {
  if (!bridgeLastPollAt) {
    return {
      id: "bridge",
      label: "Controls bridge",
      verdict: "unknown",
      detail:
        "No poll recorded from the bots process yet this app run — either it hasn't started, or this app restarted more recently than its last poll.",
      link,
    };
  }
  const ageS = secondsAgo(bridgeLastPollAt, now);
  if (ageS * 1000 <= BRIDGE_STALE_AFTER_MS) {
    return {
      id: "bridge",
      label: "Controls bridge",
      verdict: "ok",
      detail: `Bots process polled Mission Control ${ageS}s ago — armed, suspend toggles reach it within ~30s.`,
    };
  }
  return {
    id: "bridge",
    label: "Controls bridge",
    verdict: "attention",
    detail: `No poll from the bots process in ${ageS}s (expected every ~30s) — it may be down, restarting, or unreachable.`,
    link,
  };
}

export function activitySignal(
  lastBotActivityAt: string | undefined,
  now: Date,
  link: OpsSignalLink,
): OpsSignal {
  if (!lastBotActivityAt) {
    return {
      id: "activity",
      label: "Bot activity",
      verdict: "unknown",
      detail: "No bot order activity recorded yet.",
      link,
    };
  }
  const ageMs = now.getTime() - Date.parse(lastBotActivityAt);
  if (ageMs <= ACTIVITY_QUIET_AFTER_MS) {
    const ageH = Math.round(ageMs / 3_600_000);
    return {
      id: "activity",
      label: "Bot activity",
      verdict: "ok",
      detail: `Last bot order ${ageH < 1 ? "under an hour" : `${ageH}h`} ago.`,
    };
  }
  const ageD = Math.round(ageMs / 86_400_000);
  return {
    id: "activity",
    label: "Bot activity",
    verdict: "unknown",
    detail: `No bot order in ${ageD}d — could be a quiet market or a weekend, not necessarily a problem. Cross-check the controls bridge signal above.`,
    link,
  };
}

export interface OpsStatusInputs {
  readonly now: () => Date;
  /** Reads the bridge poll tracker (`dashboard-insights-bridge.ts`) — undefined until the bots
   *  process has polled at least once this app run. */
  readonly bridgeLastPollAt: () => string | undefined;
  /** Latest `at` among bot-owned trade-activity records; undefined when none exist. Never throws
   *  — a read failure should read as "unknown", not crash the panel. */
  readonly lastBotActivityAt: () => Promise<string | undefined>;
  /** Present only when a GitHub token is configured (`resolveDeployLagFetcher`); absent = the
   *  panel's credential-free degraded mode for the two deploy signals. */
  readonly fetchDeploySignals?: (now: Date) => Promise<{ app: OpsSignal; bots: OpsSignal }>;
  /** `owner/repo` — used only to build the "Open Actions" deep link on every signal. */
  readonly repo: string;
}

function actionsLinkFor(repo: string): OpsSignalLink {
  return {
    href: `https://github.com/${repo}/actions/workflows/pipeline.yml`,
    label: "Open Actions",
  };
}

/** `owner/repo` this app is deployed from — the same default `feedback-service.ts`/
 *  `feedback-status.ts` use, so the panel needs no env var of its own. */
export function resolveOpsStatusRepo(env: Readonly<Record<string, string | undefined>>): string {
  return env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
}

export async function buildOpsStatus(inputs: OpsStatusInputs): Promise<OpsStatus> {
  const now = inputs.now();
  const link = actionsLinkFor(inputs.repo);
  const [activityAt, deploy] = await Promise.all([
    inputs.lastBotActivityAt().catch(() => undefined),
    inputs.fetchDeploySignals
      ? inputs.fetchDeploySignals(now).catch(() => degradedDeploySignals(link))
      : Promise.resolve(degradedDeploySignals(link)),
  ]);
  return {
    generatedAt: now.toISOString(),
    degraded: !inputs.fetchDeploySignals,
    signals: [
      deploy.app,
      deploy.bots,
      bridgeSignal(inputs.bridgeLastPollAt(), now, link),
      activitySignal(activityAt, now, link),
    ],
  };
}
