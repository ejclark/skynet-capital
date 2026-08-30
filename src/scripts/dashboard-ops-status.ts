import type { ActivityStore } from "../observatory/activity-store.js";
import { ownerEmails } from "../server/auth/resolve-auth.js";
import type { BotControlsStore } from "../server/bot-controls-store.js";
import type { ObservatoryHub } from "../server/observatory-hub.js";
import { resolveDeployLagFetcher } from "../server/ops-status-deploy-lag.js";
import type { OpsStatusDeps } from "../server/ops-status-routes.js";
import { buildOpsStatus, resolveOpsStatusRepo } from "../server/ops-status-service.js";
import { type InsightsBridgeHandle, startInsightsBridge } from "./dashboard-insights-bridge.js";

/**
 * Boot-time wiring for the ops-status panel: folds the live hub, the durable
 * activity ledger, and the bridge-poll tracker into `OpsStatusDeps`, resolving the optional
 * GitHub deploy-lag fetcher from the environment. Pulled out of `serve-dashboard.ts` to keep that
 * file's own complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate), mirroring
 * `setupFeedback` in `dashboard-feedback.ts`.
 */
export interface OpsStatusSetupDeps {
  readonly env: NodeJS.ProcessEnv;
  readonly hub: ObservatoryHub;
  readonly activity: ActivityStore;
  readonly insightsBridge: InsightsBridgeHandle;
  /** OAuth-only, same reasoning as Mission Control — password mode has no signed-in owner to
   *  gate against, so there is no `/ops-status` to serve. */
  readonly authConfigured: boolean;
}

/** Latest `at` among trade-activity records belonging to a BOT participant — the panel's
 *  credential-free "when did a bot last trade" corroboration of the bridge-poll signal. */
async function lastBotActivityAt(
  hub: ObservatoryHub,
  activity: ActivityStore,
): Promise<string | undefined> {
  const botIds = new Set(
    hub
      .getState()
      .participants.filter((p) => p.kind === "bot")
      .map((p) => p.id),
  );
  const records = await activity.list();
  const times = records
    .filter((r) => botIds.has(r.participantId))
    .map((r) => r.at)
    .sort();
  return times.at(-1);
}

/**
 * Starts the internal insights bridge (always — the `bots` process depends on it regardless of
 * whether owner auth is configured) and, when it is, folds the tracker it returns into the
 * ops-status deps. One call so `serve-dashboard.ts` doesn't have to sequence the two by hand.
 */
export function wireOpsStatus(
  env: NodeJS.ProcessEnv,
  botControls: BotControlsStore,
  rest: Omit<OpsStatusSetupDeps, "env" | "insightsBridge">,
): OpsStatusDeps | undefined {
  const insightsBridge = startInsightsBridge(env, botControls);
  return setupOpsStatus({ env, insightsBridge, ...rest });
}

export function setupOpsStatus(deps: OpsStatusSetupDeps): OpsStatusDeps | undefined {
  if (!deps.authConfigured) return undefined;
  const fetchDeploySignals = resolveDeployLagFetcher(deps.env);
  if (!fetchDeploySignals) {
    console.warn(
      "ℹ️  Ops-status deploy signals are off (no SKYNET_FEEDBACK_GITHUB_TOKEN) — /ops-status still renders the bridge/activity signals and links out to Actions.",
    );
  }
  const repo = resolveOpsStatusRepo(deps.env);
  const owners = ownerEmails(deps.env);
  return {
    isOwner: (email) => owners.has(email),
    status: () =>
      buildOpsStatus({
        now: () => new Date(),
        bridgeLastPollAt: () => deps.insightsBridge.lastControlsPollAt(),
        lastBotActivityAt: () => lastBotActivityAt(deps.hub, deps.activity),
        ...(fetchDeploySignals ? { fetchDeploySignals } : {}),
        repo,
      }),
  };
}
