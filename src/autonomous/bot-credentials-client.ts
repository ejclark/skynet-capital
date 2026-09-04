import type { AlpacaCredentials } from "../alpaca/credentials.js";
import { fetchJson } from "../http/fetch-json.js";
import type { ControlsState } from "./bot-controls.js";
import {
  BOT_CREDENTIALS_ID_PARAM,
  BOT_CREDENTIALS_PATH,
  BOT_CREDENTIALS_SECRET_HEADER,
} from "./bot-credentials-wire.js";
import { BRIDGE_REQUEST_TIMEOUT_MS } from "./insight-record.js";

export interface BotCredentialsClient {
  /**
   * Given the latest `/controls` poll result, pull and apply fresh credentials for every bot
   * whose `credentialsVersion` changed since the last sync. Never throws — a pull failure for one
   * bot is logged and skipped, never allowed to stall the poll loop or affect any other bot.
   */
  reconcile(state: ControlsState): Promise<void>;
  /**
   * Boot-time priming: pull every bot's current credential from the bridge BEFORE any broker or
   * shared connection exists, handing each pair to `apply` and marking that version synced so the
   * first `reconcile` afterwards is a no-op. Confirmed live 2026-09-04: without this, every boot
   * built the market clock, news poller, and daily-loss seed on the (dead) env credential, printed
   * a screen of expected 401s, and only then swapped in the store credential — a boot log that
   * reads as "still broken" to anyone skimming it. Same never-throws posture as `reconcile`: a
   * bot whose pull fails simply boots on env and self-heals on the next poll.
   */
  prime(
    state: ControlsState,
    apply: (personaId: string, credentials: AlpacaCredentials) => void,
  ): Promise<void>;
}

/**
 * `onRotated` returns whether it actually applied the credential (e.g. `false` if the caller has
 * no broker for that persona id yet). A version is only marked synced on `true` — this is what
 * makes boot-time ordering safe without a separate code path: the very first poll can fire before
 * the caller's broker map is populated, `onRotated` returns `false`, nothing is marked synced, and
 * the next poll (≤30s later, map now populated) retries and succeeds. Self-healing, not sequenced.
 */
export type OnCredentialsRotated = (personaId: string, credentials: AlpacaCredentials) => boolean;

/** True when a bridge URL + the bot-credentials secret are both configured — absent either one,
 *  the client is a permanent no-op (never guesses a secret, never half-authenticates). */
export function resolveBotCredentialsClient(
  onRotated: OnCredentialsRotated,
  env: NodeJS.ProcessEnv = process.env,
): BotCredentialsClient {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  const secret = env.SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET;
  if (!(url && secret)) {
    return { reconcile: async () => undefined, prime: async () => undefined };
  }
  const endpoint = `${url.replace(/\/+$/, "")}${BOT_CREDENTIALS_PATH}`;
  const lastSynced = new Map<string, string>();

  /** One fetch from the bridge, or undefined on any refusal/malformation/network failure — every
   *  branch is logged here so the two callers below stay about WHAT to do with a pair, not how to
   *  get one. Never throws: a credential-pull failure must never stall the poll loop it rides on. */
  const fetchOne = async (personaId: string): Promise<AlpacaCredentials | undefined> => {
    try {
      const controller = new AbortController();
      const abort = setTimeout(() => controller.abort(), BRIDGE_REQUEST_TIMEOUT_MS);
      try {
        const target = new URL(endpoint);
        target.searchParams.set(BOT_CREDENTIALS_ID_PARAM, personaId);
        const response = await fetchJson(
          "GET",
          target.toString(),
          { [BOT_CREDENTIALS_SECRET_HEADER]: secret },
          undefined,
          controller.signal,
        );
        if (response.status < 200 || response.status >= 300) {
          process.emitWarning(
            `[creds] ${personaId}: bridge refused the credential pull (${response.status})`,
          );
          return undefined;
        }
        const body = response.body;
        if (
          !body ||
          typeof body !== "object" ||
          typeof (body as { apiKey?: unknown }).apiKey !== "string" ||
          typeof (body as { apiSecret?: unknown }).apiSecret !== "string"
        ) {
          process.emitWarning(
            `[creds] ${personaId}: bridge returned a malformed credential — ignored`,
          );
          return undefined;
        }
        const { apiKey, apiSecret, baseUrl } = body as {
          apiKey: string;
          apiSecret: string;
          baseUrl?: string;
        };
        return { apiKey, apiSecret, ...(baseUrl ? { baseUrl } : {}) };
      } finally {
        clearTimeout(abort);
      }
    } catch (error) {
      // The bot just keeps trading on whatever credential it already has until the next pull.
      process.emitWarning(`[creds] ${personaId}: credential pull failed: ${String(error)}`);
      return undefined;
    }
  };

  /** Returns true only when the credential was fetched AND `onRotated` applied it — either half
   *  failing leaves `lastSynced` untouched, so the next poll (≤30s) retries. A rotation is rare
   *  and important enough that indefinite retry is the right default; the extra log line every
   *  30s on a genuinely stuck bridge is cheap next to an unrotated key. */
  const pullOne = async (personaId: string): Promise<boolean> => {
    const next = await fetchOne(personaId);
    if (!next) return false;
    const applied = onRotated(personaId, next);
    if (!applied) {
      process.emitWarning(
        `[creds] ${personaId}: fetched a rotated credential but had no broker to apply it to yet`,
      );
    }
    return applied;
  };

  /** The ids whose bridge version differs from what this process last synced. */
  const pending = (state: ControlsState): [string, string][] =>
    Object.entries(state.bots).flatMap(([id, controls]) => {
      const version = controls.credentialsVersion;
      return version === undefined || lastSynced.get(id) === version ? [] : [[id, version]];
    });

  return {
    reconcile: async (state) => {
      for (const [id, version] of pending(state)) {
        if (await pullOne(id)) lastSynced.set(id, version);
      }
    },
    prime: async (state, apply) => {
      for (const [id, version] of pending(state)) {
        const next = await fetchOne(id);
        if (!next) continue;
        apply(id, next);
        lastSynced.set(id, version);
      }
    },
  };
}
