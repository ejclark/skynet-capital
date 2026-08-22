import { fetchJson } from "../http/fetch-json.js";
import {
  CONTROLS_BRIDGE_PATH,
  type ControlsState,
  EMPTY_CONTROLS,
  parseControlsState,
  suspendedReason,
} from "./bot-controls.js";
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

export function resolveBotControls(env: NodeJS.ProcessEnv = process.env): BotControlsClient {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  if (!url) return DISABLED_CLIENT;
  const endpoint = `${url.replace(/\/+$/, "")}${CONTROLS_BRIDGE_PATH}`;

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
          { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET },
          undefined,
          controller.signal,
        );
        if (response.status < 200 || response.status >= 300) return null;
        const parsed = parseControlsState(response.body);
        if (parsed) snapshot = parsed;
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
