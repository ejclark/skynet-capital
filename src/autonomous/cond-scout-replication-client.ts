import { fetchJson } from "../http/fetch-json.js";
import type { CondScoutSnapshot } from "./cond-scout-wire.js";
import {
  BRIDGE_REQUEST_TIMEOUT_MS,
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "./insight-record.js";

/**
 * Sends COND-SCOUT's ledger snapshot (`cond-scout-wire.ts`) to the app on every `/controls` poll
 * — the `decision-replication-client.ts` donor pattern, minus the cursor: the snapshot is whole
 * every time, so a dropped send is healed by the next. Never throws; dark without a bridge URL or
 * while the scout itself is dark (the getter returns undefined).
 */
export interface CondScoutReplication {
  send(): Promise<void>;
}

export function resolveCondScoutReplication(
  env: NodeJS.ProcessEnv,
  getSnapshot: () => CondScoutSnapshot | undefined,
): CondScoutReplication {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  if (!url) return { send: () => Promise.resolve() };
  const endpoint = `${url.replace(/\/+$/, "")}/cond-scout`;
  return {
    send: async () => {
      const snapshot = getSnapshot();
      if (!snapshot) return;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), BRIDGE_REQUEST_TIMEOUT_MS);
      try {
        const response = await fetchJson(
          "POST",
          endpoint,
          { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET },
          snapshot,
          controller.signal,
        );
        if (response.status < 200 || response.status >= 300) {
          process.emitWarning(`[cond-scout] snapshot rejected (${response.status}) — will resend`);
        }
      } catch (error) {
        process.emitWarning(`[cond-scout] snapshot send failed: ${String(error)}`);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
