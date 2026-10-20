import { fetchJson } from "../http/fetch-json.js";
import {
  BRIDGE_REQUEST_TIMEOUT_MS,
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "./insight-record.js";

/**
 * Sends one whole snapshot to the app over the private insights bridge — the pattern COND-SCOUT's
 * ledger (`cond-scout-replication-client.ts`, #3651) and the shadow tests of members' playbooks
 * (`authored-shadow-wire.ts`, #5457) share. Whole every time, so a dropped send is healed by the next
 * and there is no cursor to drift. Never throws; dark without a bridge URL or while the getter has
 * nothing to send (the feature itself is dark).
 */
export interface SnapshotReplication {
  send(): Promise<void>;
}

export function resolveSnapshotReplication(
  env: NodeJS.ProcessEnv,
  /** The listener route, e.g. `/cond-scout`. */
  route: string,
  /** What a warning calls this snapshot, e.g. `cond-scout`. */
  label: string,
  getSnapshot: () => unknown,
  /** The per-POST budget; prod always takes the shared `BRIDGE_REQUEST_TIMEOUT_MS`. A spec that
   *  runs a real listener on the same event loop as a loaded full suite passes a generous one, so
   *  a starved loop is not mistaken for an unreachable bridge (#4978, #5823). */
  options: { readonly timeoutMs?: number } = {},
): SnapshotReplication {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  if (!url) return { send: () => Promise.resolve() };
  const endpoint = `${url.replace(/\/+$/, "")}${route}`;
  const timeoutMs = options.timeoutMs ?? BRIDGE_REQUEST_TIMEOUT_MS;
  return {
    send: async () => {
      const snapshot = getSnapshot();
      if (!snapshot) return;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchJson(
          "POST",
          endpoint,
          { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET },
          snapshot,
          controller.signal,
        );
        if (response.status < 200 || response.status >= 300) {
          process.emitWarning(`[${label}] snapshot rejected (${response.status}) — will resend`);
        }
      } catch (error) {
        process.emitWarning(`[${label}] snapshot send failed: ${String(error)}`);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
