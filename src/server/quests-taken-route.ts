import type { IncomingMessage, ServerResponse } from "node:http";
import { questScoreboard, scoreTakenQuests } from "../domain/quest-score.js";
import { deskLedger } from "../observatory/desk-data.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";
import { questsAccount } from "./quests-route.js";

/**
 * GET /api/quests/taken[?participantId=…] — the quests a member took, scored (#7028 slice 6).
 *
 * Each quest the member fired (`taken-quest-store.ts`) is joined onto the account's own round trips
 * by its order's broker id and scored against the base rate it carried (`quest-score.ts`): one row
 * per quest, newest first, and one per quest type with the comparison the in-game feedback loop
 * (#7029) reads. No market read, no model tokens: the ledger is the one the account's trade history
 * already builds.
 *
 * Privacy: the same owned-set rule as `GET /api/quests` — a member's taken quests answer to that
 * member alone, and anyone else is told the account does not exist.
 */

export const QUESTS_TAKEN_PATH = "/api/quests/taken";

async function serveTaken(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const id = questsAccount(params, config, session);
  const desk = id ? config.hub.getState().participants.find((p) => p.id === id) : undefined;
  if (!(id && desk)) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  const taken = config.takenQuests?.taken(id) ?? [];
  if (taken.length === 0) {
    sendJson(res, 200, { taken: [], byType: [] });
    return;
  }
  const records = await config.readTradeActivity?.(id).catch(() => undefined);
  const scores = scoreTakenQuests(taken, deskLedger(desk, records));
  sendJson(res, 200, { taken: scores, byType: questScoreboard(scores) });
}

/** Handle `/api/quests/taken`. Returns true when answered. */
export async function serveQuestsTakenApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== QUESTS_TAKEN_PATH) return false;
  if (requireGet(req, res)) await serveTaken(req, res, config, session);
  return true;
}
