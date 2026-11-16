import type { QuestBaseRate } from "../../src/domain/quest.js";
import {
  HOLD_NOTE,
  MIN_CLOSED,
  type QuestScore,
  questScoreboard,
  type ScoredLedger,
  scoreTakenQuest,
  scoreTakenQuests,
  type TakenQuest,
} from "../../src/domain/quest-score.js";
import { deskLedger } from "../../src/observatory/desk-data.js";
import { lifecycleLedgerRecord } from "../../src/observatory/option-lifecycle-activity.js";
import type {
  ActivityView,
  ParticipantSnapshot,
} from "../../src/observatory/participant-snapshot.js";
import { parseLifecycleActivity } from "../../src/trading/option-lifecycle.js";

/**
 * #7028 slice 6: a taken quest is scored from the member's OWN trades for its order, never a model
 * of them, and a quest type's rows compare against the carried base rate only once enough have
 * closed. An order with no fill is unseen, not a loss.
 */

const UNTESTED: QuestBaseRate = { kind: "untested", note: "No study yet." };
const measured = (rate: number): QuestBaseRate => ({
  kind: "measured",
  rate,
  sample: 73,
  episodes: 18,
  episodesNeeded: 32,
  mean: 0.0451,
  worstDecile: -0.0685,
  worstSingle: -0.2572,
  source: "docs/research/drawdown-quests-2026-11.md",
  note: "Edge untested.",
});

function taken(over: Partial<TakenQuest> = {}): TakenQuest {
  return {
    questId: "conditions:QQQ:buy-shares",
    source: "conditions",
    moveKind: "buy-shares",
    symbol: "QQQ",
    orderId: "o-1",
    takenAt: "2026-11-10T15:00:00.000Z",
    baseRate: measured(0.632),
    ...over,
  };
}

const trip = (over: Partial<ScoredLedger["trips"][number]>): ScoredLedger["trips"][number] => ({
  realized: 0,
  entryPrice: 100,
  quantity: 1,
  ...over,
});

describe("scoreTakenQuest — a move that opens a position", () => {
  it("is closed and paid when every trade the order opened closed in profit", () => {
    const ledger: ScoredLedger = {
      trips: [trip({ entryOrderId: "o-1", orderId: "o-9", realized: 50, entryPrice: 500 })],
      open: [],
    };
    expect(scoreTakenQuest(taken(), ledger)).toEqual({
      taken: taken(),
      state: "closed",
      realized: 50,
      returnPct: 10,
      paid: true,
    });
  });

  it("is open, and judged not at all, while part of what it opened is still held", () => {
    const ledger: ScoredLedger = {
      trips: [trip({ entryOrderId: "o-1", realized: -20 })],
      open: [{ entryOrderId: "o-1" }],
    };
    const score = scoreTakenQuest(taken(), ledger);
    expect(score.state).toBe("open");
    expect(score.realized).toBe(-20);
    expect(score.paid).toBeUndefined();
  });

  it("is open with nothing realized while the whole position is still held", () => {
    expect(scoreTakenQuest(taken(), { trips: [], open: [{ entryOrderId: "o-1" }] })).toEqual({
      taken: taken(),
      state: "open",
    });
  });

  it("is unseen — never a loss — when no fill for the order is on the ledger", () => {
    const ledger: ScoredLedger = {
      trips: [trip({ entryOrderId: "someone-else", realized: -500 })],
      open: [{ entryOrderId: "another" }],
    };
    expect(scoreTakenQuest(taken(), ledger)).toEqual({ taken: taken(), state: "unseen" });
  });

  it("does not count a trade the order only CLOSED as one it opened", () => {
    const ledger: ScoredLedger = { trips: [trip({ orderId: "o-1", realized: 90 })], open: [] };
    expect(scoreTakenQuest(taken(), ledger).state).toBe("unseen");
  });
});

describe("scoreTakenQuest — a move that closes a position", () => {
  const takeProfit = taken({
    questId: "position:CRWV261120C00090000:take-profit",
    source: "position",
    moveKind: "sell-to-close",
    symbol: "CRWV",
    occ: "CRWV261120C00090000",
    baseRate: UNTESTED,
  });

  it("is closed once the close fills, scored on the trades it closed", () => {
    const ledger: ScoredLedger = {
      trips: [
        trip({ orderId: "o-1", entryOrderId: "o-0", realized: 1_200, entryPrice: 1_200 }),
        trip({ orderId: "o-1", entryOrderId: "o-00", realized: 300, entryPrice: 300 }),
      ],
      open: [{ entryOrderId: "o-1" }],
    };
    expect(scoreTakenQuest(takeProfit, ledger)).toMatchObject({
      state: "closed",
      realized: 1_500,
      returnPct: 100,
      paid: true,
    });
  });

  it("is unseen until the close fills", () => {
    expect(scoreTakenQuest(takeProfit, { trips: [], open: [] }).state).toBe("unseen");
  });
});

describe("scoreTakenQuests", () => {
  it("lists newest first", () => {
    const older = taken({ orderId: "a", takenAt: "2026-11-01T00:00:00.000Z" });
    const newer = taken({ orderId: "b", takenAt: "2026-11-09T00:00:00.000Z" });
    const scores = scoreTakenQuests([older, newer], { trips: [], open: [] });
    expect(scores.map((s) => s.taken.orderId)).toEqual(["b", "a"]);
  });
});

function closed(paid: boolean, baseRate: QuestBaseRate = measured(0.5)): QuestScore {
  return {
    taken: taken({ baseRate }),
    state: "closed",
    realized: paid ? 10 : -10,
    returnPct: paid ? 1 : -1,
    paid,
  };
}

const many = (n: number, paid: boolean, rate = 0.5) =>
  Array.from({ length: n }, () => closed(paid, measured(rate)));

describe("questScoreboard", () => {
  it("counts each state per quest type, and says untested when no closed quest carried a rate", () => {
    const tp = taken({ source: "position", moveKind: "sell-to-close", baseRate: UNTESTED });
    const rows = questScoreboard([
      { taken: tp, state: "closed", realized: 5, returnPct: 5, paid: true },
      { taken: tp, state: "unseen" },
      { taken: taken(), state: "open" },
    ]);
    expect(rows).toEqual([
      {
        source: "position",
        moveKind: "sell-to-close",
        taken: 2,
        open: 0,
        closed: 1,
        unseen: 1,
        paid: 1,
        assigned: 0,
        rated: 0,
        ratedPaid: 0,
        expectedPaid: 0,
        verdict: "untested",
      },
      {
        source: "conditions",
        moveKind: "buy-shares",
        taken: 1,
        open: 1,
        closed: 0,
        unseen: 0,
        paid: 0,
        assigned: 0,
        rated: 0,
        ratedPaid: 0,
        expectedPaid: 0,
        verdict: "untested",
      },
    ]);
  });

  it(`says too few until ${MIN_CLOSED} rated quests of a type have closed, whatever they show`, () => {
    const [row] = questScoreboard(many(MIN_CLOSED - 1, true));
    expect(row?.verdict).toBe("too-few");
    expect(row?.ratedPaid).toBe(MIN_CLOSED - 1);
  });

  it("is in line inside two standard deviations of what the carried rates expect", () => {
    // 20 closed at 0.5: expect 10, spread 2·√5 ≈ 4.47 — 13 paid is inside the band.
    const [row] = questScoreboard([...many(13, true), ...many(7, false)]);
    expect(row).toMatchObject({ rated: 20, ratedPaid: 13, expectedPaid: 10, verdict: "in-line" });
  });

  it("is above or below only outside that band", () => {
    expect(questScoreboard([...many(16, true), ...many(4, false)])[0]?.verdict).toBe("above");
    expect(questScoreboard([...many(4, true), ...many(16, false)])[0]?.verdict).toBe("below");
  });

  it("expects each quest at its own carried rate, so SPY and QQQ rows mix honestly", () => {
    const [row] = questScoreboard([...many(10, true, 0.9), ...many(10, false, 0.1)]);
    expect(row?.expectedPaid).toBe(10);
    expect(row?.verdict).toBe("in-line");
  });

  it("leaves untested quests out of the comparison but in the counts", () => {
    const [row] = questScoreboard([...many(MIN_CLOSED, true), closed(false, UNTESTED)]);
    expect(row).toMatchObject({ closed: MIN_CLOSED + 1, paid: MIN_CLOSED, rated: MIN_CLOSED });
  });

  it("says, on a row compared against a measured rate, that the study's hold is not the member's", () => {
    expect(questScoreboard(many(MIN_CLOSED, true))[0]?.note).toBe(HOLD_NOTE);
    const tested: QuestBaseRate = {
      kind: "tested",
      rate: 0.6,
      sample: 100,
      worstDecile: -0.1,
      source: "docs/research/x.md",
    };
    expect(questScoreboard([closed(true, tested)])[0]?.note).toBeUndefined();
  });
});

describe("an assigned cash-secured put (#7306)", () => {
  // Sell 1 QQQ 400 put for $4.20; QQQ ends at 360 and the put is assigned. The ledger closes the
  // option at $0 (the premium kept), and drops the share purchase at the strike (OPTRD, #837).
  const occ = "QQQ261218P00400000";
  const put = (orderId: string) =>
    taken({
      questId: "conditions:QQQ:sell-cash-secured-put",
      moveKind: "sell-cash-secured-put",
      orderId,
      baseRate: measured(0.895),
    });
  const lifecycle = (raw: Record<string, string>): ActivityView => {
    const event = parseLifecycleActivity(raw);
    if (!event) throw new Error("fixture did not parse");
    return lifecycleLedgerRecord(event, "ann-1");
  };
  const assignedPut = (n: number): ActivityView[] => [
    {
      orderId: `o-${n}`,
      symbol: occ,
      side: "sell",
      quantity: 1,
      filledQuantity: 1,
      price: 4.2,
      status: "filled",
      at: `2026-11-${String(n + 1).padStart(2, "0")}T15:00:00.000Z`,
    },
    lifecycle({
      id: `asn-${n}`,
      activity_type: "OPASN",
      symbol: occ,
      qty: "1",
      transaction_time: `2026-11-${String(n + 1).padStart(2, "0")}T21:00:00.000Z`,
    }),
    lifecycle({
      id: `trd-${n}`,
      activity_type: "OPTRD",
      symbol: "QQQ",
      qty: "100",
      price: "400",
      side: "buy",
      transaction_time: `2026-11-${String(n + 1).padStart(2, "0")}T21:00:00.000Z`,
    }),
  ];
  const ledgerOf = (activity: ActivityView[]) =>
    deskLedger({ id: "ann-1", activity } as unknown as ParticipantSnapshot);

  it("is open and assigned, never closed and paid on the premium it kept", () => {
    const ledger = ledgerOf(assignedPut(1));
    expect(ledger.trips[0]).toMatchObject({ short: true, assigned: true, realized: 420 });
    expect(scoreTakenQuest(put("o-1"), ledger)).toEqual({
      taken: put("o-1"),
      state: "open",
      assigned: true,
    });
  });

  it("still scores a put that expired worthless as closed and paid", () => {
    const ledger = ledgerOf([
      assignedPut(1)[0] as ActivityView,
      lifecycle({ id: "exp", activity_type: "OPEXP", symbol: occ, qty: "1", date: "2026-12-18" }),
    ]);
    expect(scoreTakenQuest(put("o-1"), ledger)).toMatchObject({ state: "closed", paid: true });
  });

  it("counts ten assigned puts in the comparison as not paid, so the row reads below its rate", () => {
    const activity = Array.from({ length: 10 }, (_, i) => assignedPut(i + 1)).flat();
    const puts = Array.from({ length: 10 }, (_, i) => put(`o-${i + 1}`));
    const [row] = questScoreboard(scoreTakenQuests(puts, ledgerOf(activity)));
    expect(row?.ratedPaid).not.toBe(10);
    expect(row).toMatchObject({
      closed: 0,
      open: 10,
      assigned: 10,
      paid: 0,
      rated: 10,
      ratedPaid: 0,
      expectedPaid: 8.95,
      verdict: "below",
    });
  });

  it("leaves an assigned covered call out of the comparison: there assignment is not a loss", () => {
    const call = taken({ moveKind: "sell-covered-call", baseRate: measured(0.5) });
    const [row] = questScoreboard([{ taken: call, state: "open", assigned: true }]);
    expect(row).toMatchObject({ open: 1, assigned: 1, rated: 0, verdict: "untested" });
  });
});
