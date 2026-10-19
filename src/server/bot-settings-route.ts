import type { IncomingMessage, ServerResponse } from "node:http";
import { type BotControls, MAX_BETA_PICKS } from "../autonomous/bot-controls.js";
import { hasHardcoreBuild } from "../personas/registry.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { ENV_SEED_AUTHOR } from "./env-settings-seed.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";
import {
  controlsChanges,
  recordControlsChange,
  type SettingsChange,
} from "./settings-change-log.js";

/**
 * A BOT'S OWN SETTINGS, CHANGED BY ITS OWNER (#4535 slice 3b) — the hardcore build and the forced
 * daily pick's count, which slices 2b/2c made the bots app read at every `/controls` poll. Until now
 * only an ops workflow run (`set-hardcore`, `set-beta-forcing`) could change either, and each run
 * restarted the bots.
 *
 *   POST /api/settings/bot-settings
 *     { id, hardcore?: boolean | null, betaPicks?: number | null, betaStage?: boolean | null }
 *
 * `null` clears the stored value, so the bots app's own setting (`SKYNET_HARDCORE_BOTS`,
 * `SKYNET_BETA_FORCING`) stands again. The one gate is ownership (#928: nobody changes an account
 * that is not theirs) — the same tier as the own-bot suspend switch beside it, deliberately not
 * Mission Control's env allowlist. Two refusals keep a stored value from saying something false:
 *
 *  - hardcore only on a persona that HAS a hardcore build — the bots refuse anything else loudly,
 *    so storing it would show a switch that does nothing;
 *  - the forced-pick count and its after-close staging switch (slice 4b) only on the scout's host,
 *    the first bot the bots app reported running (the house-roster report's order is `bots`',
 *    `run-autonomous.ts`) — no other bot reads them.
 *
 * Every change lands in the settings change log (`settings-change-log.ts`), suspend/resume included.
 */

const BODY_CAP_BYTES = 1_024;

interface BotSettingsBody {
  readonly id: string;
  readonly hardcore?: boolean | null;
  readonly betaPicks?: number | null;
  readonly betaStage?: boolean | null;
}

const isFlag = (value: unknown): value is boolean | null | undefined =>
  value === undefined || value === null || typeof value === "boolean";

const isPickCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_BETA_PICKS;

/** Strict shape gate: an id and at least one setting, each of its own type or `null`. */
export function parseBotSettingsBody(raw: string): BotSettingsBody | undefined {
  const body = parseJsonRecord(raw);
  const id = body ? boundedString(body.id, 100) : undefined;
  if (!(body && id)) return undefined;
  const { hardcore, betaPicks, betaStage } = body;
  if (!(isFlag(hardcore) && isFlag(betaStage))) return undefined;
  if (betaPicks !== undefined && betaPicks !== null && !isPickCount(betaPicks)) return undefined;
  if (hardcore === undefined && betaPicks === undefined && betaStage === undefined) {
    return undefined;
  }
  return {
    id,
    ...(hardcore !== undefined ? { hardcore } : {}),
    ...(betaPicks !== undefined ? { betaPicks } : {}),
    ...(betaStage !== undefined ? { betaStage } : {}),
  };
}

/** The bot the forced daily pick runs on, as the bots app last reported — undefined until it has. */
export function scoutHostId(config: DashboardServerConfig): string | undefined {
  return config.readHouseRoster?.()?.accounts[0];
}

/** The settings this write may touch on this bot, refused in words when it may not. */
function settingsRefusal(body: BotSettingsBody, config: DashboardServerConfig): string | undefined {
  if (body.hardcore !== undefined && !hasHardcoreBuild(body.id)) {
    return "This bot has no hardcore build to switch to.";
  }
  const scoutSetting = body.betaPicks !== undefined || body.betaStage !== undefined;
  if (scoutSetting && scoutHostId(config) !== body.id) {
    return scoutHostId(config) === undefined
      ? "The bots app hasn't said which bot runs the forced daily pick yet — try again in a minute."
      : "The forced daily pick runs on one bot only, and this isn't it.";
  }
  return undefined;
}

/** `prev` with each named setting set, or removed when `null`. */
function applySettings(prev: BotControls, body: BotSettingsBody): BotControls {
  const { hardcore: _h, betaPicks: _b, betaStage: _s, ...rest } = prev;
  const hardcore = body.hardcore === undefined ? prev.hardcore : body.hardcore;
  const betaPicks = body.betaPicks === undefined ? prev.betaPicks : body.betaPicks;
  const betaStage = body.betaStage === undefined ? prev.betaStage : body.betaStage;
  return {
    ...rest,
    ...(typeof hardcore === "boolean" ? { hardcore } : {}),
    ...(typeof betaPicks === "number" ? { betaPicks } : {}),
    ...(typeof betaStage === "boolean" ? { betaStage } : {}),
  };
}

export async function serveBotSettings(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseBotSettingsBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed bot-settings body" });
    return;
  }
  const ownedIds = config.auth ? resolveOwnedIds(session, config) : [];
  if (!(config.controls && ownedIds.includes(body.id))) {
    sendJson(res, 200, { ok: false, error: "You can only change your own bot's settings." });
    return;
  }
  const refusal = settingsRefusal(body, config);
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  const editor = session?.email ?? "unknown";
  const at = config.now?.() ?? new Date();
  const { store, changes } = config.controls;
  const prev = store.load().bots[body.id] ?? {};
  const next = applySettings(prev, body);
  store.replaceBot(body.id, next, editor, at);
  recordControlsChange(changes, body.id, controlsChanges(prev, next, editor, at), () =>
    store.replaceBot(body.id, prev, editor, at),
  );
  sendJson(res, 200, { ok: true });
}

/** Who made a change, as the browser may see it: the viewer, someone else who owns the bot, or the
 *  one-time copy of the bots app's own setting (#4535 slice 4c, `env-settings-seed.ts`). */
type ChangeAuthor = "you" | "another owner" | "the operations setting, copied once";

export interface BotSettingsView {
  /** Present exactly when the bot has a hardcore build; `null` = not set here (the ops setting stands). */
  readonly hardcore?: boolean | null;
  /** Present exactly when this bot runs the forced daily pick; `null` = not set here. */
  readonly betaPicks?: number | null;
  /** Present exactly when this bot runs the forced daily pick; `null` = not set here. */
  readonly betaStage?: boolean | null;
  readonly maxBetaPicks: number;
  /** The latest changes to this bot's settings, newest first — never an email. */
  readonly changes: ReadonlyArray<
    Omit<SettingsChange, "proposedBy" | "approvedBy"> & {
      readonly proposedBy: ChangeAuthor;
      readonly approvedBy: ChangeAuthor;
    }
  >;
}

/** How many changes the settings card lists. */
const CHANGES_SHOWN = 10;

/** One owned bot's settings and recent changes, for `GET /api/settings` (ownership is the caller's). */
export function botSettingsView(
  config: DashboardServerConfig,
  botId: string,
  viewerEmail: string | undefined,
): BotSettingsView | undefined {
  if (!config.controls) return undefined;
  const stored = config.controls.store.load().bots[botId] ?? {};
  const author = (who: string): ChangeAuthor => {
    if (who === ENV_SEED_AUTHOR) return "the operations setting, copied once";
    return viewerEmail !== undefined && who.toLowerCase() === viewerEmail.toLowerCase()
      ? "you"
      : "another owner";
  };
  return {
    ...(hasHardcoreBuild(botId) ? { hardcore: stored.hardcore ?? null } : {}),
    ...(scoutHostId(config) === botId
      ? { betaPicks: stored.betaPicks ?? null, betaStage: stored.betaStage ?? null }
      : {}),
    maxBetaPicks: MAX_BETA_PICKS,
    changes: (config.controls.changes?.list(botId, CHANGES_SHOWN) ?? []).map((c) => ({
      ...c,
      proposedBy: author(c.proposedBy),
      approvedBy: author(c.approvedBy),
    })),
  };
}
