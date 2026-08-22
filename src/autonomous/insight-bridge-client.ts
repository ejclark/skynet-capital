import { fetchJson } from "../http/fetch-json.js";
import {
  BRIDGE_REQUEST_TIMEOUT_MS,
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
  type InsightRecord,
} from "./insight-record.js";

/** The `bots` process's whole surface for the interim insight bridge — one narrow function, so
 * swapping the backing store later (slice 4, SQLite) touches only `insights-listener.ts`. */
export interface InsightBridgeClient {
  recordInsight(entry: InsightRecord): Promise<void>;
}

/** A client that never sends anything and never fails — the resolved shape when the bridge is
 * unconfigured, so every call site can call `recordInsight` unconditionally. */
const NOOP_CLIENT: InsightBridgeClient = {
  recordInsight: async () => {
    /* disabled — SKYNET_INSIGHTS_BRIDGE_URL unset */
  },
};

/**
 * Resolves the `bots` process's insight-bridge client from the environment
 * (`docs/plans/trade-insights-loop.md`, slice 2). **Defaults to unset/disabled** — a complete
 * no-op with zero behavior change — unless `SKYNET_INSIGHTS_BRIDGE_URL` is explicitly set to the
 * `app` process's internal insight-listener origin (e.g.
 * `http://app.process.<app-name>.internal:8788`, reached over Fly's private 6PN network).
 *
 * `recordInsight` NEVER throws and NEVER blocks the trade loop on the bridge being reachable —
 * worst case on any failure (network error, timeout, non-2xx response) is a dropped log line and
 * a console warning, never a crashed cycle.
 */
export function resolveInsightBridge(env: NodeJS.ProcessEnv = process.env): InsightBridgeClient {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  if (!url) {
    return NOOP_CLIENT;
  }
  const endpoint = `${url.replace(/\/+$/, "")}/insights`;
  return {
    recordInsight: async (entry) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), BRIDGE_REQUEST_TIMEOUT_MS);
        try {
          const response = await fetchJson(
            "POST",
            endpoint,
            { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET },
            entry,
            controller.signal,
          );
          if (response.status < 200 || response.status >= 300) {
            process.emitWarning(`[insights-bridge] rejected (${response.status})`);
          }
        } finally {
          clearTimeout(timer);
        }
      } catch (error) {
        // Unreachable bridge, timeout, DNS failure, whatever — a dropped insight is fine; a
        // crashed trade loop is not. This function must never throw. `process.emitWarning`, not
        // `console` — this is library code (the repo reserves console for scripts).
        process.emitWarning(`[insights-bridge] unreachable — dropping insight: ${String(error)}`);
      }
    },
  };
}
