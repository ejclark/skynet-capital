/**
 * THE BOTS SCREEN, CLIENT SIDE (#8254) — the house bots, why each one last skipped, and the ones
 * this member follows. The wire shape is the server's `BotsRosterView` verbatim.
 *
 * Route contract (`src/server/bots-api-routes.ts`):
 *   GET  /api/bots            → BotsRosterView
 *   POST /api/bots/follow     { id } → { ok: true } | { ok: false, error }
 *   POST /api/bots/unfollow   { id } → { ok: true }
 * No member param: identity comes from the session alone. Following is a pin: it orders this list
 * and opens nothing — no ticket, no prefill, no order.
 */
import type {
  BotRowView,
  BotsRosterView,
  NotRunningView,
} from "../../../src/observatory/bots-roster-view";
import { agoText, heartbeatStateWords } from "./heartbeat";

import { postJson } from "./post";

export type { BotRowView, BotsRosterView, NotRunningView };

/** The loop as a glyph and its word — the Playbooks strip's own map, one source. */
export const loopWords = heartbeatStateWords;

export const botsKey = ["bots"] as const;

export async function fetchBots(): Promise<BotsRosterView> {
  const res = await fetch("/api/bots", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`bots ${res.status}`);
  return (await res.json()) as BotsRosterView;
}

export const followBot = (id: string, follow: boolean): Promise<{ readonly ok: boolean }> =>
  postJson(follow ? "/api/bots/follow" : "/api/bots/unfollow", { id });

/** The standing's glyph: ● placing paper orders · ◐ watching or exits only · ○ not reported. */
export function standingGlyph(standing: BotRowView["standing"]): string {
  if (!standing) return "○";
  return standing.placing ? "●" : "◐";
}

/** "last check 2 min ago", or "no check recorded". */
export function lastCheckText(loop: BotRowView["loop"]): string {
  if (!loop) return "its checks aren't recorded on this server";
  if (loop.sinceLastCheckMs === null) return "no check recorded";
  return `last check ${agoText(loop.sinceLastCheckMs)} ago`;
}

/** How long ago a skip was, from its own time. */
export function skipAgoText(at: string, now: Date = new Date()): string {
  return `${agoText(Math.max(0, now.getTime() - Date.parse(at)))} ago`;
}

export const NO_REASON_TEXT = "No reason was recorded for this check";
