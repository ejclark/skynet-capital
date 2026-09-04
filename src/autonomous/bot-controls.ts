/**
 * BOT CONTROLS — the owner's switchboard for the autonomous fleet (Eric, 2026-08-21: "pushing
 * random environment variable keys to the server is a terrible experience").
 *
 * The state here is what the Mission Control page (`/controls`, owner-only) edits and what the
 * `bots` process reads over the internal bridge. Two latency classes, honestly separated:
 *
 *  - **Suspend** (per-bot and global) is DYNAMIC: the runner polls the bridge and composes the
 *    flag into the same `blockedReason` seam the kill switch uses, so a toggle stops a bot within
 *    one poll interval — no restart, no deploy, and the decision audit records the halt honestly.
 *  - **Mode** (observe/live) and **hardcore** swap the persona/trader construction, so they apply
 *    at the next `bots` boot. The page says so on the control; nothing pretends otherwise.
 *
 * Env vars remain as break-glass defaults: a control absent from the store falls back to the env
 * (`SKYNET_AUTONOMOUS_MODE`, `SKYNET_HARDCORE_BOTS`), so a lost volume or unreachable bridge can
 * never do worse than pre-GUI behavior.
 */

import { isRecord } from "../storage/parse-guards.js";
import { credentialFingerprint } from "./bot-credential-fingerprint.js";

/** Per-bot overrides. Every field optional: absent = fall back to the env default. */
export interface BotControls {
  /** True = the owner suspended this bot's trading (dynamic — applies within one poll). */
  readonly suspended?: boolean;
  /** Trading mode override (boot-applied). */
  readonly mode?: "observe" | "live";
  /** Run the bot's hardcore research build (boot-applied; only bots with a hardcore build). */
  readonly hardcore?: boolean;
  /** A fingerprint of the bot's CURRENT stored Alpaca credentials — never the credential itself.
   *  The bots process compares this against its own boot-time credential's fingerprint and, on a
   *  mismatch, pulls the real pair from the separate `/bot-credentials` endpoint. */
  readonly credentialsVersion?: string;
}

export interface ControlsState {
  /** Master switch: true = suspend ALL autonomous trading, the beta scout included (dynamic). */
  readonly allSuspended?: boolean;
  readonly bots: Readonly<Record<string, BotControls>>;
  /** ISO time of the last edit — the page's audit line. */
  readonly updatedAt?: string;
  /** Who edited (owner email) — same audit-trail principle as the allowlist store. */
  readonly updatedBy?: string;
}

export const EMPTY_CONTROLS: ControlsState = { bots: {} };

/** The internal bridge path the `bots` process polls (same listener as the insight relay). */
export const CONTROLS_BRIDGE_PATH = "/controls";

/** Bounded — a fingerprint is 16 hex chars; generous headroom for a future longer digest. */
const MAX_CREDENTIALS_VERSION_LENGTH = 64;

function parseBot(raw: unknown): BotControls | null {
  if (!isRecord(raw)) return null;
  const mode = raw.mode === "observe" || raw.mode === "live" ? raw.mode : undefined;
  const credentialsVersion =
    typeof raw.credentialsVersion === "string" &&
    raw.credentialsVersion.length > 0 &&
    raw.credentialsVersion.length <= MAX_CREDENTIALS_VERSION_LENGTH
      ? raw.credentialsVersion
      : undefined;
  return {
    ...(typeof raw.suspended === "boolean" ? { suspended: raw.suspended } : {}),
    ...(mode ? { mode } : {}),
    ...(typeof raw.hardcore === "boolean" ? { hardcore: raw.hardcore } : {}),
    ...(credentialsVersion ? { credentialsVersion } : {}),
  };
}

/**
 * Total, defensive parse — a torn file, an old schema, or a hostile body can only ever produce
 * `null` (caller falls back to EMPTY_CONTROLS / env defaults), never a throw.
 */
export function parseControlsState(raw: unknown): ControlsState | null {
  if (!isRecord(raw)) return null;
  const bots: Record<string, BotControls> = {};
  if (isRecord(raw.bots)) {
    for (const [id, value] of Object.entries(raw.bots)) {
      const bot = parseBot(value);
      if (bot) bots[id] = bot;
    }
  }
  return {
    bots,
    ...(typeof raw.allSuspended === "boolean" ? { allSuspended: raw.allSuspended } : {}),
    ...(typeof raw.updatedAt === "string" ? { updatedAt: raw.updatedAt } : {}),
    ...(typeof raw.updatedBy === "string" ? { updatedBy: raw.updatedBy } : {}),
  };
}

/**
 * The dynamic half, shaped for the `blockedReason` seam: a non-null string blocks the cycle and
 * lands verbatim in the decision record's `halted` field — so the audit trail says exactly why
 * nothing traded.
 */
export function suspendedReason(state: ControlsState, botId: string): string | null {
  if (state.allSuspended) return "suspended by owner (all bots)";
  if (state.bots[botId]?.suspended) return "suspended by owner";
  return null;
}

/** Boot-applied mode: the store's override when present, else the env-derived default. */
export function effectiveMode(
  state: ControlsState,
  botId: string,
  envDefault: "observe" | "live",
): "observe" | "live" {
  return state.bots[botId]?.mode ?? envDefault;
}

/**
 * Boot-applied hardcore roster: per bot, an explicit store boolean wins; absent falls back to the
 * env set — so the GUI can both arm AND disarm what an env var armed.
 */
export function effectiveHardcoreIds(
  personaIds: readonly string[],
  envIds: ReadonlySet<string>,
  state: ControlsState,
): Set<string> {
  const out = new Set<string>();
  for (const id of personaIds) {
    const override = state.bots[id]?.hardcore;
    if (override ?? envIds.has(id)) out.add(id);
  }
  return out;
}

/**
 * Folds a `credentialsVersion` fingerprint into every bot id this process can resolve a
 * participant's credentials for — called on every `/controls` GET, never persisted. A bot with no
 * resolvable participant (not yet added as a store row, or `resolve` throwing) is left untouched:
 * absent means "no credential-rotation signal available," never a false "nothing changed."
 */
export function stampCredentialVersions(
  state: ControlsState,
  personaIds: readonly string[],
  resolve: (id: string) => { apiKey: string; apiSecret: string } | undefined,
  salt: string,
): ControlsState {
  const bots: Record<string, BotControls> = { ...state.bots };
  for (const id of personaIds) {
    let credentials: { apiKey: string; apiSecret: string } | undefined;
    try {
      credentials = resolve(id);
    } catch {
      credentials = undefined; // a resolver failure must never break the poll it rides on
    }
    if (!credentials) continue;
    bots[id] = { ...bots[id], credentialsVersion: credentialFingerprint(credentials, salt) };
  }
  return { ...state, bots };
}
