import {
  isQuestId,
  type QuestBaseRate,
  type QuestMoveKind,
  type QuestSource,
} from "../domain/quest.js";
import type { TakenQuest } from "../domain/quest-score.js";
import { conditionsBaseRate } from "../options/conditions-quests.js";
import { STUDIED_INDEXES, type StudiedIndex } from "../options/drawdown-base-rates.js";
import { POSITION_UNTESTED } from "../options/position-quests.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { EVENT_UNTESTED } from "./event-quest-rate.js";
import type { DeskOptionRequest } from "./option-trade-service.js";
import { parseJsonRecord } from "./page-shell.js";

/**
 * A QUEST TAKEN, RECORDED AT THE ORDER (#7028 slice 6). A quest's ticket link carries `?quest=<id>`
 * (`withQuest`, `src/domain/quest.ts`); the Trade form sends it with the order; once the broker
 * accepts that order, this records the quest as taken against the order's id, with the base rate
 * the quest carried — so `quest-score.ts` can later score the member's own trades against it.
 *
 * THE ORDER MUST BE THE QUEST'S MOVE. The id names its move (`position:<occ>:take-profit`,
 * `conditions:<index>:buy-shares`, `event:<event>:<symbol>:sell-cash-secured-put`), and an order
 * that is not that move on that symbol records nothing — a link left in the URL while the member
 * trades something else never turns that trade into a quest. A roll quest is recorded only when its
 * call is closed on the single-leg ticket: the Roll row sends one multi-leg order
 * (`draft-order-route.ts`), whose fills carry each leg's own id, not the order's — scoring one needs
 * the spread-leg join (`DecisionDb.findSpreadLeg`) first, so that door records nothing yet.
 *
 * THE RATE IS THE HOUSE'S, never the request's: it is read from the same source the quest was built
 * from (`conditionsBaseRate`, the position and event `untested` notes). Nothing else from the
 * request is trusted. Recording never changes the order's answer: a refused write is silent here,
 * since the order already went and the quest's score is the only thing lost.
 */

/** What the id says the quest's move is. */
interface QuestKey {
  readonly source: QuestSource;
  readonly moveKind: QuestMoveKind;
  readonly symbol: string;
  readonly occ?: string;
}

const POSITION_MOVES: Readonly<Record<string, QuestMoveKind>> = {
  "take-profit": "sell-to-close",
  "time-stop": "sell-to-close",
  "buy-back": "buy-to-close",
  roll: "roll",
};

const isStudied = (s: string): s is StudiedIndex =>
  (STUDIED_INDEXES as readonly string[]).includes(s);

/** The move an id names, or undefined when it is not one this repo builds. */
export function parseQuestId(id: string): QuestKey | undefined {
  if (!isQuestId(id)) return undefined;
  const parts = id.split(":");
  const [source, a, b] = parts;
  if (source === "position" && parts.length === 3 && a && b) {
    const occ = parseOccSymbol(a);
    const moveKind = POSITION_MOVES[b];
    return occ?.type === "call" && moveKind
      ? { source, moveKind, symbol: occ.underlying, occ: a }
      : undefined;
  }
  if (source === "conditions" && parts.length === 3 && a && isStudied(a)) {
    if (b === "buy-shares" || b === "sell-cash-secured-put") {
      return { source, moveKind: b, symbol: a };
    }
    return undefined;
  }
  if (source === "event" && parts.length >= 4) {
    const symbol = parts[parts.length - 2];
    const kind = parts[parts.length - 1];
    if (symbol && /^[A-Z][A-Z.]{0,9}$/.test(symbol) && kind === "sell-cash-secured-put") {
      return { source, moveKind: kind, symbol };
    }
  }
  return undefined;
}

/** The order as the quest matcher sees it — one shape per door the Trade form submits through. */
export type QuestOrder =
  | { readonly kind: "shares"; readonly action: "buy" | "sell"; readonly symbol: string }
  | { readonly kind: "option-open"; readonly code: string; readonly underlying: string }
  | { readonly kind: "option-close"; readonly occSymbol: string };

/** An options order as the matcher sees it. */
export function questOrderOf(request: DeskOptionRequest): QuestOrder {
  return request.kind === "close"
    ? { kind: "option-close", occSymbol: request.occSymbol }
    : { kind: "option-open", code: request.code, underlying: request.underlying };
}

/** True when this order is the move the quest drafted. */
function isTheMove(key: QuestKey, order: QuestOrder): boolean {
  switch (key.moveKind) {
    case "buy-shares":
      return order.kind === "shares" && order.action === "buy" && order.symbol === key.symbol;
    case "sell-cash-secured-put":
      return (
        order.kind === "option-open" && order.code === "201" && order.underlying === key.symbol
      );
    case "sell-to-close":
    case "buy-to-close":
    case "roll":
      return order.kind === "option-close" && order.occSymbol === key.occ;
    default:
      return false;
  }
}

function baseRateFor(key: QuestKey): QuestBaseRate | undefined {
  if (key.source === "position") return POSITION_UNTESTED;
  if (key.source === "event") return EVENT_UNTESTED;
  if (!isStudied(key.symbol)) return undefined;
  if (key.moveKind === "buy-shares") return conditionsBaseRate(key.symbol, "shares");
  if (key.moveKind === "sell-cash-secured-put") return conditionsBaseRate(key.symbol, "put");
  return undefined;
}

/** The taken-quest record for an accepted order, or undefined when the order is not the quest's move. */
export function takenQuest(
  questId: string,
  order: QuestOrder,
  orderId: string,
  at: Date,
): TakenQuest | undefined {
  const key = parseQuestId(questId);
  if (!(key && orderId && isTheMove(key, order))) return undefined;
  const baseRate = baseRateFor(key);
  if (!baseRate) return undefined;
  return {
    questId,
    source: key.source,
    moveKind: key.moveKind,
    symbol: key.symbol,
    ...(key.occ ? { occ: key.occ } : {}),
    orderId,
    takenAt: at.toISOString(),
    baseRate,
  };
}

/** The `quest` field of an order body, when it is a quest id — anything else is no quest. */
export function questIdOf(raw: string): string | undefined {
  const quest = parseJsonRecord(raw)?.quest;
  return isQuestId(quest) ? quest : undefined;
}

/** After an order answer: record the quest it took, when it was accepted and is the quest's move. */
export function settleTakenQuest(
  questId: string | undefined,
  deskId: string,
  order: QuestOrder,
  result: { readonly ok: boolean; readonly orderId?: string },
  config: Pick<DashboardServerConfig, "takenQuests" | "now">,
): void {
  if (!(questId && result.ok && result.orderId && config.takenQuests)) return;
  const taken = takenQuest(questId, order, result.orderId, config.now?.() ?? new Date());
  if (taken) config.takenQuests.record(deskId, taken);
}
