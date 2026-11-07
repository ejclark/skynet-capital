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
 *  - **Forced picks** (`betaPicks`, #4535 slice 2b) is DYNAMIC too: the scout reads the host bot's
 *    count at every scan, so a change applies on the next check — no restart.
 *  - **After-close staging** (`betaStage`, #4535 slice 4b) is DYNAMIC: the staging poll reads the
 *    host bot's flag at every pass, so a change applies from the next close — no restart.
 *  - **Hardcore** (#4535 slice 2c) is DYNAMIC: the poll swaps the bot's persona, its order cooldown
 *    and the mode its readiness gate allows in one step, re-running that gate on the build being
 *    swapped in — no restart.
 *  - **Watch only** (the stored `mode`, #6954 slice 5b) is DYNAMIC: each cycle reads it, so a bot
 *    set to watch records what it would do and places nothing from the next poll. A stored mode
 *    only ever NARROWS the house mode (#6954 slice 1): `observe` pins one bot to watching, and a
 *    stored `live` never widens an observe process — placing paper orders at all is the house's
 *    single switch (#4535).
 *  - **Stop opening, keep exits** (`holdOpens`, #6954 slice 5b) is DYNAMIC: each cycle refuses the
 *    bot's opens `opens-held` and still places its exits — the breaker's shape (`opensHalted`),
 *    chosen by the owner instead of tripped by a loss. The forced pick on the bot obeys it too.
 *
 * The behaviour settings (hardcore, forced picks, staging) are the OWNER'S alone since #4535 slice
 * 4c-2: a bot with no stored value is off, whatever the env says — the dashboard copied each env
 * value into the bot's stored settings once (slice 4c-1), so nothing running today changes, and a
 * lost volume or unreachable bridge leaves a bot dark rather than on a server value nobody can see.
 * Only the boot-applied mode still falls back to its env (`SKYNET_AUTONOMOUS_MODE`): live/observe is
 * house-wide infrastructure, not one bot's behaviour.
 *
 * ONE NON-FLEET FIELD RIDES ALONG: `companionModel` (#1672 slice 4) — Moneypenny's rail isn't a
 * bot, but Mission Control is already the owner-only switchboard this app has, and the model dial
 * needs the same one-click, no-redeploy shape the suspend switches already have. Widening the
 * ALLOWED set (`COMPANION_MODELS`) stays a protected-file change; picking within it does not.
 */

import { COMPANION_MODELS, type CompanionModelId } from "../companion/companion-model.js";
import { isRecord } from "../storage/parse-guards.js";
import { credentialFingerprint } from "./bot-credential-fingerprint.js";

/** Per-bot overrides. Every field optional: absent = fall back to the env default. */
export interface BotControls {
  /** True = the owner suspended this bot's trading (dynamic — applies within one poll). */
  readonly suspended?: boolean;
  /** The owner's "watch only" (dynamic — read every cycle, #6954 slice 5b). Narrow-only: `observe`
   *  holds this bot to watching, `live` defers to the house mode and can never widen it
   *  (`effectiveMode`). */
  readonly mode?: "observe" | "live";
  /** The owner's "stop opening, keep exits" (dynamic — read every cycle, #6954 slice 5b): every
   *  order that adds risk is refused `opens-held`; exits still run. Absent = off. */
  readonly holdOpens?: boolean;
  /** Run the bot's hardcore research build (dynamic — applies on the next poll; only bots with a
   *  hardcore build). Absent = off. */
  readonly hardcore?: boolean;
  /**
   * How many forced picks the beta scout may place per day on this bot (dynamic — applies on the
   * next scan). Only the scout's host bot reads it. Absent = 0 (off). Whether the bot opens any is
   * still its BETA-SCOUT subscription's.
   */
  readonly betaPicks?: number;
  /**
   * Whether the beta scout may stage its picks after the close for Alpaca's next open (dynamic —
   * read at every staging pass). Only the scout's host bot reads it. Absent = off. Stages nothing
   * while the effective pick count is 0.
   */
  readonly betaStage?: boolean;
  /** A fingerprint of the bot's CURRENT stored Alpaca credentials — never the credential itself.
   *  The bots process compares this against its own boot-time credential's fingerprint and, on a
   *  mismatch, pulls the real pair from the separate `/bot-credentials` endpoint. */
  readonly credentialsVersion?: string;
}

export interface ControlsState {
  /** Master switch: true = suspend ALL autonomous trading, the beta scout included (dynamic). */
  readonly allSuspended?: boolean;
  readonly bots: Readonly<Record<string, BotControls>>;
  /** Moneypenny's model override — absent falls back to `companion-model.ts`'s own default.
   *  Dynamic: `dashboard-companion.ts` reads it fresh per turn, no restart. */
  readonly companionModel?: CompanionModelId;
  /** ISO time an owner last pressed "reset breaker" (#6954 slice 3b). Dynamic: the bots re-arm their
   *  tripped breakers on the first poll that carries a stamp newer than the last they honoured, and
   *  never for one older than their own boot (a restart already cleared it). Never touches the kill
   *  switch or any suspend. */
  readonly breakerResetAt?: string;
  /** ISO time of the last edit — the page's audit line. */
  readonly updatedAt?: string;
  /** Who edited (owner email) — same audit-trail principle as the allowlist store. */
  readonly updatedBy?: string;
}

export const EMPTY_CONTROLS: ControlsState = { bots: {} };

/** The internal bridge path the `bots` process polls (same listener as the insight relay). */
export const CONTROLS_BRIDGE_PATH = "/controls";

/** Ceiling on `betaPicks`: the scout's "2-3 small picks" has no use for more than a handful, so a
 *  larger stored number is a typo or a hostile body and is read as unset (the env count stands). */
export const MAX_BETA_PICKS = 10;

/** Bounded — a fingerprint is 16 hex chars; generous headroom for a future longer digest. */
const MAX_CREDENTIALS_VERSION_LENGTH = 64;

/** A stored instant: an ISO string that parses, else absent (a hostile or torn value reads as unset). */
function isoStamp(raw: unknown): string | undefined {
  return typeof raw === "string" && raw.length <= 40 && !Number.isNaN(Date.parse(raw))
    ? raw
    : undefined;
}

function parseBot(raw: unknown): BotControls | null {
  if (!isRecord(raw)) return null;
  const mode = raw.mode === "observe" || raw.mode === "live" ? raw.mode : undefined;
  const credentialsVersion =
    typeof raw.credentialsVersion === "string" &&
    raw.credentialsVersion.length > 0 &&
    raw.credentialsVersion.length <= MAX_CREDENTIALS_VERSION_LENGTH
      ? raw.credentialsVersion
      : undefined;
  const betaPicks =
    typeof raw.betaPicks === "number" &&
    Number.isInteger(raw.betaPicks) &&
    raw.betaPicks >= 0 &&
    raw.betaPicks <= MAX_BETA_PICKS
      ? raw.betaPicks
      : undefined;
  return {
    ...(typeof raw.suspended === "boolean" ? { suspended: raw.suspended } : {}),
    ...(mode ? { mode } : {}),
    ...(typeof raw.holdOpens === "boolean" ? { holdOpens: raw.holdOpens } : {}),
    ...(typeof raw.hardcore === "boolean" ? { hardcore: raw.hardcore } : {}),
    ...(betaPicks !== undefined ? { betaPicks } : {}),
    ...(typeof raw.betaStage === "boolean" ? { betaStage: raw.betaStage } : {}),
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
  const companionModel = COMPANION_MODELS.find((m) => m === raw.companionModel);
  const breakerResetAt = isoStamp(raw.breakerResetAt);
  return {
    bots,
    ...(breakerResetAt ? { breakerResetAt } : {}),
    ...(typeof raw.allSuspended === "boolean" ? { allSuspended: raw.allSuspended } : {}),
    ...(companionModel ? { companionModel } : {}),
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

/** The owner's "stop opening, keep exits" for one bot, shaped for the trader's open gate: non-null
 *  holds that bot's opens and lands on its decision record (#6954 slice 5b). */
export const OPENS_HELD_REASON = "opens held by owner (exits still run)";

export function opensHeldReason(state: ControlsState, botId: string): string | null {
  return state.bots[botId]?.holdOpens ? OPENS_HELD_REASON : null;
}

/**
 * The mode one bot runs this cycle: the mode it may run in (the house mode, after its readiness
 * gate), narrowed by the store and never widened by it (#6954 slices 1, 5b). A stored `observe`
 * holds this bot to watching under a live house; a stored `live` under an observe house still
 * watches, because "do the bots place paper orders at all" is the house's one switch
 * (`SKYNET_AUTONOMOUS_MODE`, #4535). The owner's "watch only" on the Settings card writes it.
 */
export function effectiveMode(
  state: ControlsState,
  botId: string,
  houseMode: "observe" | "live",
): "observe" | "live" {
  return state.bots[botId]?.mode === "observe" ? "observe" : houseMode;
}

/**
 * Is the owner's reset stamp newer than the last one this process honoured? Compared as instants,
 * never as strings, so a stamp written with a different offset still orders correctly.
 */
export function breakerResetDue(state: ControlsState, honouredAt: string): boolean {
  if (!state.breakerResetAt) return false;
  return Date.parse(state.breakerResetAt) > Date.parse(honouredAt);
}

/**
 * The hardcore roster, at boot and at every poll after: the bots whose stored boolean is true. A
 * bot with no stored value is not hardcore — the env roster no longer decides (#4535 slice 4c-2).
 */
export function effectiveHardcoreIds(
  personaIds: readonly string[],
  state: ControlsState,
): Set<string> {
  const out = new Set<string>();
  for (const id of personaIds) {
    if (state.bots[id]?.hardcore) out.add(id);
  }
  return out;
}

/**
 * The beta scout's forced-pick count: the owner's stored number for the host bot, else 0 — dark, so
 * an unreachable bridge or a lost volume never leaves forced picks running on a value nobody can
 * see (#4535 slice 4c-2).
 */
export function effectiveBetaPicks(stored: number | undefined): number {
  return stored ?? 0;
}

/**
 * Whether the scout stages after the close: the owner's stored flag for the host bot, else off —
 * and never with no picks to stage, the rule `parseBetaForcing` held for the env string (#4535
 * slice 4b, 4c-2).
 */
export function effectiveBetaStage(stored: boolean | undefined, picks: number): boolean {
  return picks > 0 && (stored ?? false);
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
