import type { IncomingMessage, ServerResponse } from "node:http";
import { type Quest, rankQuests } from "../domain/quest.js";
import { accountStake } from "../options/account-stake.js";
import { positionGuidance } from "../options/position-guidance.js";
import { positionQuests } from "../options/position-quests.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { type GuidanceDeps, guidanceMarketFor } from "./guidance-route.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * GET /api/quests[?participantId=…][&refresh=1] — a member's quests (#7028).
 *
 * Slice 1 serves one source, the member's own positions: every call they hold or have sold is
 * judged by position guidance (the same engine and market read the Guidance tab uses), and only the
 * verdicts that ask for an order come back, best first (`src/options/position-quests.ts`). Later
 * slices add cash × conditions and market events to the same list.
 *
 * Privacy: a member's quests answer to that member alone — the target must be in the session's
 * owned set, or it does not exist for this caller (the alerts route's rule). The stake is read from
 * the account the server already holds, never from the request, and nothing about it is logged.
 *
 * Cost: an account holding no calls costs no market read at all. Otherwise one guidance read per
 * underlying, through the member's own connected account, at most `MAX_SYMBOLS` of them (the
 * largest first), each shared with the Guidance tab through the 15-second coalesce.
 */

export const QUESTS_PATH = "/api/quests";
/** A guidance read is ~30 broker calls; past this many names the rest are named, not read. */
const MAX_SYMBOLS = 6;

type QuestsAnswer =
  | { readonly kind: "missing" }
  | { readonly kind: "unlinked" }
  | {
      readonly kind: "ok";
      readonly asOf: Date;
      readonly quests: readonly Quest[];
      /** Underlyings whose positions were not judged this read: past the cap, or no market read. */
      readonly unread: readonly string[];
    };

/** The underlyings with a call on them, the most money first. */
function callUnderlyings(
  positions: readonly { readonly symbol: string; readonly marketValue: number }[],
): string[] {
  const money = new Map<string, number>();
  for (const p of positions) {
    const parts = parseOccSymbol(p.symbol);
    if (parts?.type !== "call") continue;
    money.set(parts.underlying, (money.get(parts.underlying) ?? 0) + Math.abs(p.marketValue));
  }
  return [...money].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([u]) => u);
}

/** One account's position quests, ranked. Pure apart from the broker reads it is handed. */
export async function questsFor(
  id: string,
  config: DashboardServerConfig,
  deps?: GuidanceDeps,
  refresh = false,
): Promise<QuestsAnswer> {
  const desk = config.hub.getState().participants.find((p) => p.id === id);
  if (!desk) return { kind: "missing" };
  const client = config.optionsClientFor?.(id);
  if (!client) return { kind: "unlinked" };
  const asOf = config.now?.() ?? new Date();
  const underlyings = callUnderlyings(desk.positions);
  if (underlyings.length === 0) return { kind: "ok", asOf, quests: [], unread: [] };
  const read = underlyings.slice(0, MAX_SYMBOLS);
  const calls = desk.positions.filter((p) => {
    const u = parseOccSymbol(p.symbol)?.underlying;
    return u !== undefined && read.includes(u);
  });
  const [quotes, markets] = await Promise.all([
    client.getContractSnapshots(calls.map((p) => p.symbol)).catch(() => new Map()),
    Promise.all(
      read.map((u) =>
        guidanceMarketFor(client, config, id, u, deps, refresh).catch(() => undefined),
      ),
    ),
  ]);
  const carried = config.exitPlans?.carried(id) ?? new Set<string>();
  const quests: Quest[] = [];
  const unread = underlyings.slice(MAX_SYMBOLS);
  read.forEach((symbol, i) => {
    const market = markets[i];
    if (!market || "reason" in market) {
      unread.push(symbol);
      return;
    }
    // One name the engine can't judge costs that name its quests, never the member the list.
    try {
      const stake = accountStake(desk.positions, symbol, quotes, carried);
      quests.push(...positionQuests(id, positionGuidance({ ...market, stake })));
    } catch {
      unread.push(symbol);
    }
  });
  return { kind: "ok", asOf, quests: rankQuests(quests), unread: unread.sort() };
}

async function serveList(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
  deps?: GuidanceDeps,
): Promise<void> {
  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const asked = params.get("participantId") ?? "";
  const id = asked || (config.auth ? (resolveCurrentId(session, config.resolveOwnerId) ?? "") : "");
  const owned = config.auth ? resolveOwnedIds(session, config) : [id];
  if (!(id && owned.includes(id))) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  const answer = await questsFor(id, config, deps, params.get("refresh") === "1");
  if (answer.kind === "missing") {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  if (answer.kind === "unlinked") {
    sendJson(res, 200, { available: false, reason: "unlinked", quests: [] });
    return;
  }
  sendJson(res, 200, {
    available: true,
    asOf: answer.asOf.toISOString(),
    quests: answer.quests,
    unread: answer.unread,
  });
}

/** Handle `/api/quests`. Returns true when answered. */
export async function serveQuestsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  deps?: GuidanceDeps,
): Promise<boolean> {
  if (path !== QUESTS_PATH) return false;
  if (requireGet(req, res)) await serveList(req, res, config, session, deps);
  return true;
}
