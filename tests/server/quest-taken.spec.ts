import { conditionsBaseRate } from "../../src/options/conditions-quests.js";
import { POSITION_UNTESTED } from "../../src/options/position-quests.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { EVENT_UNTESTED } from "../../src/server/event-quest-rate.js";
import {
  parseQuestId,
  type QuestOrder,
  questIdOf,
  questOrderOf,
  settleTakenQuest,
  takenQuest,
} from "../../src/server/quest-taken.js";
import type { TakenQuestStore } from "../../src/server/taken-quest-store.js";

/**
 * #7028 slice 6: an accepted order is recorded as a quest taken only when it IS the quest's move on
 * the quest's symbol, and the rate recorded is the house's own, never anything the request said.
 */

const AT = new Date("2026-11-10T15:00:00Z");
const OCC = "CRWV261120C00090000";

describe("parseQuestId", () => {
  it("reads every id the three sources build", () => {
    expect(parseQuestId(`position:${OCC}:take-profit`)).toEqual({
      source: "position",
      moveKind: "sell-to-close",
      symbol: "CRWV",
      occ: OCC,
    });
    expect(parseQuestId(`position:${OCC}:time-stop`)?.moveKind).toBe("sell-to-close");
    expect(parseQuestId(`position:${OCC}:buy-back`)?.moveKind).toBe("buy-to-close");
    expect(parseQuestId(`position:${OCC}:roll`)?.moveKind).toBe("roll");
    expect(parseQuestId("conditions:QQQ:buy-shares")).toEqual({
      source: "conditions",
      moveKind: "buy-shares",
      symbol: "QQQ",
    });
    expect(parseQuestId("event:crwv-2026-11-10-print:CRWV:sell-cash-secured-put")).toEqual({
      source: "event",
      moveKind: "sell-cash-secured-put",
      symbol: "CRWV",
    });
  });

  it("refuses anything else", () => {
    for (const id of [
      "",
      "position:NOTANOCC:take-profit",
      `position:${OCC}:moon`,
      "conditions:TSLA:buy-shares",
      "conditions:QQQ:buy-call",
      "event:x:CRWV:buy-shares",
      "event:x:crwv:sell-cash-secured-put",
      "bounty:QQQ:buy-shares",
      "conditions:QQQ:buy-shares<script>",
    ]) {
      expect(parseQuestId(id)).toBeUndefined();
    }
  });
});

describe("takenQuest", () => {
  const shares = (action: "buy" | "sell", symbol = "QQQ"): QuestOrder => ({
    kind: "shares",
    action,
    symbol,
  });

  it("records a conditions quest with the study's own rate for that index and move", () => {
    expect(takenQuest("conditions:QQQ:buy-shares", shares("buy"), "o-1", AT)).toEqual({
      questId: "conditions:QQQ:buy-shares",
      source: "conditions",
      moveKind: "buy-shares",
      symbol: "QQQ",
      orderId: "o-1",
      takenAt: "2026-11-10T15:00:00.000Z",
      baseRate: conditionsBaseRate("QQQ", "shares"),
    });
    const put = { kind: "option-open", code: "201", underlying: "SPY" } as const;
    expect(takenQuest("conditions:SPY:sell-cash-secured-put", put, "o-2", AT)?.baseRate).toEqual(
      conditionsBaseRate("SPY", "put"),
    );
  });

  it("records a position quest at its close, untested in words", () => {
    const close = { kind: "option-close", occSymbol: OCC } as const;
    for (const move of ["take-profit", "time-stop", "buy-back", "roll"]) {
      const t = takenQuest(`position:${OCC}:${move}`, close, "o-3", AT);
      expect(t).toMatchObject({ source: "position", occ: OCC, baseRate: POSITION_UNTESTED });
    }
  });

  it("records an event quest's put, untested in words", () => {
    const put = { kind: "option-open", code: "201", underlying: "CRWV" } as const;
    const id = "event:crwv-2026-11-10-print:CRWV:sell-cash-secured-put";
    expect(takenQuest(id, put, "o-4", AT)?.baseRate).toEqual(EVENT_UNTESTED);
  });

  it("records nothing when the order is not the quest's move on the quest's symbol", () => {
    expect(takenQuest("conditions:QQQ:buy-shares", shares("sell"), "o", AT)).toBeUndefined();
    expect(takenQuest("conditions:QQQ:buy-shares", shares("buy", "SPY"), "o", AT)).toBeUndefined();
    const callBuy = { kind: "option-open", code: "302", underlying: "QQQ" } as const;
    expect(takenQuest("conditions:QQQ:sell-cash-secured-put", callBuy, "o", AT)).toBeUndefined();
    const otherClose = { kind: "option-close", occSymbol: "CRWV261120C00100000" } as const;
    expect(takenQuest(`position:${OCC}:take-profit`, otherClose, "o", AT)).toBeUndefined();
    expect(takenQuest(`position:${OCC}:take-profit`, shares("sell", "CRWV"), "o", AT)).toBe(
      undefined,
    );
  });

  it("records nothing without the broker's order id", () => {
    expect(takenQuest("conditions:QQQ:buy-shares", shares("buy"), "", AT)).toBeUndefined();
  });
});

describe("questIdOf", () => {
  it("reads a quest id from an order body, and nothing else", () => {
    expect(questIdOf(JSON.stringify({ quest: "conditions:QQQ:buy-shares" }))).toBe(
      "conditions:QQQ:buy-shares",
    );
    expect(questIdOf(JSON.stringify({ quest: 7 }))).toBeUndefined();
    expect(questIdOf(JSON.stringify({ quest: "x".repeat(400) }))).toBeUndefined();
    expect(questIdOf(JSON.stringify({}))).toBeUndefined();
    expect(questIdOf("not json")).toBeUndefined();
  });
});

describe("questOrderOf", () => {
  it("reads an options order as an open or a close", () => {
    expect(
      questOrderOf({
        kind: "open",
        participantId: "d",
        code: "201",
        underlying: "SPY",
        contracts: 1,
        strike: 500,
        expiration: "2026-12-18",
        orderType: "market",
      }),
    ).toEqual({ kind: "option-open", code: "201", underlying: "SPY" });
    expect(questOrderOf({ kind: "close", participantId: "d", occSymbol: OCC })).toEqual({
      kind: "option-close",
      occSymbol: OCC,
    });
  });
});

describe("settleTakenQuest", () => {
  function store() {
    const rows: { desk: string; orderId: string }[] = [];
    const takenQuests = {
      record: (desk: string, t: { orderId: string }) => {
        rows.push({ desk, orderId: t.orderId });
        return true;
      },
    } as unknown as TakenQuestStore;
    const config = { takenQuests, now: () => AT } as unknown as Pick<
      DashboardServerConfig,
      "takenQuests" | "now"
    >;
    return { rows, config };
  }
  const order: QuestOrder = { kind: "shares", action: "buy", symbol: "QQQ" };

  it("records the quest an accepted order took, against the order's desk", () => {
    const { rows, config } = store();
    settleTakenQuest(
      "conditions:QQQ:buy-shares",
      "ann-1",
      order,
      { ok: true, orderId: "o-1" },
      config,
    );
    expect(rows).toEqual([{ desk: "ann-1", orderId: "o-1" }]);
  });

  it("records nothing for a refused order, an order with no quest, or a store not wired", () => {
    const { rows, config } = store();
    settleTakenQuest("conditions:QQQ:buy-shares", "ann-1", order, { ok: false }, config);
    settleTakenQuest(undefined, "ann-1", order, { ok: true, orderId: "o-1" }, config);
    settleTakenQuest("conditions:QQQ:buy-shares", "ann-1", order, { ok: true, orderId: "o-1" }, {});
    expect(rows).toEqual([]);
  });
});
