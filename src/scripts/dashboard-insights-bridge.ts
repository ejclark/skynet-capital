/**
 * The interim insight bridge (docs/plans/trade-insights-loop.md, slice 2): an internal-only
 * listener so the `bots` process (no Fly Volume of its own) can persist retrospectives through
 * this process's mounted volume, and poll Mission Control state over the same private-net bridge.
 * Bound to a port deliberately NOT in fly.toml's [http_service]: unreachable from the public
 * internet, reachable only over Fly's private 6PN network. See `../server/insights-listener.ts`
 * for the full reasoning + what was verified. Pulled out of `serve-dashboard.ts` to keep that
 * file's own complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate).
 */
import { createInsightStore } from "../autonomous/jsonl-insight-store.js";
import type { createBotControlsStore } from "../server/bot-controls-store.js";
import { createInsightsListener, resolveInsightsBridgePort } from "../server/insights-listener.js";

export interface InsightsBridgeHandle {
  /** ISO time of the last authenticated `GET /controls` poll this app run, or `undefined` before
   *  the first one lands — the ops-status panel's credential-free "is the bots process alive"
   *  proxy (#666). */
  readonly lastControlsPollAt: () => string | undefined;
}

/** Start the internal insights listener; logs the port it bound once it's up. */
export function startInsightsBridge(
  env: NodeJS.ProcessEnv,
  botControls: ReturnType<typeof createBotControlsStore>,
): InsightsBridgeHandle {
  const insights = createInsightStore(env);
  const insightsPort = resolveInsightsBridgePort(env);
  let lastControlsPollAt: string | undefined;
  createInsightsListener({
    record: (entry) => insights.record(entry),
    // The bots process polls Mission Control state over the same private-net bridge.
    controls: () => botControls.load(),
    onControlsPoll: () => {
      lastControlsPollAt = new Date().toISOString();
    },
  }).listen(insightsPort, () => {
    console.log(`[insights-bridge] internal listener on port ${insightsPort} (private-net only)`);
  });
  return { lastControlsPollAt: () => lastControlsPollAt };
}
