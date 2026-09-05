import { fetchJson } from "../http/fetch-json.js";
import {
  CONTROLS_BRIDGE_PATH,
  type ControlsState,
  EMPTY_CONTROLS,
  parseControlsState,
  suspendedReason,
} from "./bot-controls.js";
import { controlsPollHeaders } from "./controls-poll-wire.js";
import {
  BRIDGE_REQUEST_TIMEOUT_MS,
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "./insight-record.js";

/**
 * The `bots` process's view of the owner's Mission Control (`/controls` on the internal bridge —
 * same origin as the insight relay, `SKYNET_INSIGHTS_BRIDGE_URL`, so prod needs zero new config).
 *
 * Failure semantics are deliberate and **fail-open to last-known**: an unreachable bridge keeps
 * the last snapshot (or, before any fetch succeeds, the empty state = env defaults). A network
 * blip must never suspend the fleet by accident — the halt file and the circuit breakers remain
 * the hard stops; this client is the owner's convenience channel, not the safety system.
 */
export interface BotControlsClient {
  /** One blocking fetch (bounded) — used at boot to apply mode/hardcore overrides. */
  fetchOnce(): Promise<ControlsState | null>;
  /** Begin background polling (unref'd). Safe to call when disabled (no-op). */
  start(): void;
  stop(): void;
  /** The dynamic check for the `blockedReason` seam. Non-null = do not trade this bot. */
  suspendedReason(botId: string): string | null;
  /** True when a bridge URL is configured (used only for honest boot logging). */
  readonly enabled: boolean;
}

const POLL_MS = 30_000;

const DISABLED_CLIENT: BotControlsClient = {
  fetchOnce: async () => null,
  start: () => undefined,
  stop: () => undefined,
  suspendedReason: () => null,
  enabled: false,
};

export function resolveBotControls(
  env: NodeJS.ProcessEnv = process.env,
  /** Fires after every AUTHENTICATED poll that returns a parsed state — the credential-sync
   *  client's hook (`bot-credentials-client.ts`), so a rotation reaches the running process within
   *  one poll interval without this file needing to know that client exists. */
  onFetched?: (state: ControlsState) => void,
): BotControlsClient {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  if (!url) return DISABLED_CLIENT;
  const endpoint = `${url.replace(/\/+$/, "")}${CONTROLS_BRIDGE_PATH}`;
  // This process's own word about which commit it is running, stamped onto every poll so the
  // owner's ops-status panel can answer "on what commit?" without a Fly credential (#666).
  const selfReport = controlsPollHeaders(env.GIT_SHA);

  let snapshot: ControlsState = EMPTY_CONTROLS;
  let timer: ReturnType<typeof setInterval> | undefined;

  const fetchOnce = async (): Promise<ControlsState | null> => {
    try {
      const controller = new AbortController();
      const abort = setTimeout(() => controller.abort(), BRIDGE_REQUEST_TIMEOUT_MS);
      try {
        const response = await fetchJson(
          "GET",
          endpoint,
          { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET, ...selfReport },
          undefined,
          controller.signal,
        );
        if (response.status < 200 || response.status >= 300) return null;
        const parsed = parseControlsState(response.body);
        if (parsed) {
          snapshot = parsed;
          try {
            onFetched?.(parsed);
          } catch {
            /* never let a downstream hook fail the poll it rides on */
          }
        }
        return parsed;
      } finally {
        clearTimeout(abort);
      }
    } catch {
      return null; // unreachable bridge = keep last-known; never throw into the trade loop
    }
  };

  return {
    enabled: true,
    fetchOnce,
    start: () => {
      if (timer) return;
      timer = setInterval(() => void fetchOnce(), POLL_MS);
      if (typeof timer.unref === "function") timer.unref();
    },
    stop: () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    },
    suspendedReason: (botId) => suspendedReason(snapshot, botId),
  };
}
