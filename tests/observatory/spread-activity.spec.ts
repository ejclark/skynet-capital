import type { OptionOrderLeg } from "../../src/autonomous/decision-db-leg-orders.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { deskActivityView } from "../../src/observatory/desk-json-view.js";
import { spreadLookup } from "../../src/observatory/spread-activity.js";
import { anOptionIntent } from "../support/builders.js";

/** A bot's spread on Activity (#4650): the account reports its fills one per leg, under each leg's
 *  own order id. The legs fold into one row for the spread — the decision's order id, the spread in
 *  words, its net once — with each leg's own fill beneath it. Anything else renders as before. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});

const record: DecisionRecord = {
  at: 1,
  personaId: "sauron",
  mode: "live",
  rawIntents: [spread],
  guardedIntents: [spread],
  outcomes: [
    {
      intent: spread,
      action: "placed",
      result: {
        intent: spread,
        status: "filled",
        orderId: "mleg-1",
        filledQuantity: 1,
        filledPrice: 3.35,
        legFills: [
          { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1, orderId: "leg-low" },
          { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75, orderId: "leg-high" },
        ],
      },
    },
  ],
};

const LEGS: Record<string, OptionOrderLeg> = {
  "leg-low": {
    legOrderId: "leg-low",
    parentOrderId: "mleg-1",
    occSymbol: LOW,
    side: "buy",
    ratio: 1,
  },
  "leg-high": {
    legOrderId: "leg-high",
    parentOrderId: "mleg-1",
    occSymbol: HIGH,
    side: "sell",
    ratio: 1,
  },
};

const findByOrderId = (orderId: string) =>
  orderId === "mleg-1" ? { record, intent: spread as OrderIntent } : undefined;
const spreadOf = () => spreadLookup({ findSpreadLeg: (id) => LEGS[id], findByOrderId });

const line = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "x",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  status: "filled",
  at: "2026-10-27T15:00:00.000Z",
  source: "stream",
  ...over,
});

const lowFill = line({ orderId: "leg-low", symbol: LOW, side: "buy", price: 5.1 });
const highFill = line({
  orderId: "leg-high",
  symbol: HIGH,
  side: "sell",
  price: 1.75,
  at: "2026-10-27T15:00:01.000Z",
});
const shares = line({ orderId: "shr-1", price: 181.4, at: "2026-10-26T15:00:00.000Z" });

describe("deskActivityView — a spread's legs beneath one row", () => {
  it("folds both leg fills into the spread's row: its order id, its name, its net once, each leg beneath", () => {
    const { activity } = deskActivityView([lowFill, highFill, shares], undefined, {
      spreadOf: spreadOf(),
    });
    expect(activity.map((row) => row.orderId)).toEqual(["mleg-1", "shr-1"]);
    expect(activity[0]).toMatchObject({
      symbol: "NVDA",
      display: "NVDA $185/$200 CALL SPREAD · 13 NOV 26",
      side: "buy",
      quantity: 1,
      filled: 1,
      price: "$3.35",
      net: "$335.00 paid",
      status: "filled",
      // The newest leg's moment, so the row sorts where the spread finished filling.
      at: "2026-10-27T15:00:01.000Z",
    });
    expect(activity[0]?.legs).toEqual([
      {
        orderId: "leg-low",
        symbol: LOW,
        display: "NVDA $185 CALL · 13 NOV 26",
        side: "buy",
        quantity: 1,
        filled: 1,
        price: "$5.10",
        cost: "$510.00 paid — 1 contract × 100 shares × $5.10",
        status: "filled",
        at: "2026-10-27T15:00:00.000Z",
      },
      {
        orderId: "leg-high",
        symbol: HIGH,
        display: "NVDA $200 CALL · 13 NOV 26",
        side: "sell",
        quantity: 1,
        filled: 1,
        price: "$1.75",
        cost: "$175.00 received — 1 contract × 100 shares × $1.75",
        status: "filled",
        at: "2026-10-27T15:00:01.000Z",
      },
    ]);
    // Net dollars once — on the spread, never on a leg.
    expect(JSON.stringify(activity).match(/\$335\.00/g)).toHaveLength(1);
  });

  it("renders every fill that is neither a decision's nor a recorded leg's exactly as before", () => {
    const put = line({
      orderId: "put-1",
      symbol: "CRWV261113P00085000",
      side: "sell",
      price: 2.12,
    });
    const unmapped = line({ orderId: "leg-elsewhere", symbol: HIGH, side: "sell", price: 1.7 });
    const records = [shares, put, unmapped];
    expect(deskActivityView(records, undefined, { spreadOf: spreadOf() })).toEqual(
      deskActivityView(records),
    );
  });

  it("never joins a leg to its spread on another contract or the other side", () => {
    // The store says leg-low is the $185 BUY; a fill under that id on the $200, or a sell, is not it.
    const wrongContract = line({ orderId: "leg-low", symbol: HIGH, side: "buy", price: 1.75 });
    const wrongSide = line({
      orderId: "leg-high",
      symbol: HIGH,
      side: "buy",
      price: 1.75,
      at: "2026-10-27T14:00:00.000Z",
    });
    const { activity } = deskActivityView([wrongContract, wrongSide], undefined, {
      spreadOf: spreadOf(),
    });
    expect(activity.map((row) => row.orderId)).toEqual(["leg-low", "leg-high"]);
    expect(activity.some((row) => row.legs)).toBe(false);
  });

  it("lists the spread once even when the ledger also holds a line under the spread's own id", () => {
    const parentLine = line({ orderId: "mleg-1", symbol: "", at: "2026-10-27T15:00:02.000Z" });
    const { activity } = deskActivityView([lowFill, parentLine, highFill], undefined, {
      spreadOf: spreadOf(),
    });
    expect(activity.map((row) => row.orderId)).toEqual(["mleg-1"]);
    expect(activity[0]?.legs?.map((leg) => leg.orderId)).toEqual(["leg-low", "leg-high"]);
  });

  it("keeps a spread whole across pages: one row, never a leg left on the next page", () => {
    const first = deskActivityView([shares, lowFill, highFill], undefined, {
      spreadOf: spreadOf(),
      limit: 1,
    });
    expect(first.activity.map((row) => row.orderId)).toEqual(["mleg-1"]);
    const next = deskActivityView([shares, lowFill, highFill], undefined, {
      spreadOf: spreadOf(),
      limit: 1,
      ...(first.nextCursor ? { before: first.nextCursor } : {}),
    });
    expect(next.activity.map((row) => row.orderId)).toEqual(["shr-1"]);
  });

  it("sums the legs' realized P/L onto the spread only once every leg closed something", () => {
    const both = new Map([
      ["leg-low", { realized: 290, returnPct: 56.9 }],
      ["leg-high", { realized: -125, returnPct: -71.4 }],
    ]);
    const closed = deskActivityView([lowFill, highFill], undefined, {
      spreadOf: spreadOf(),
      realizedByOrder: both,
    });
    // (290 − 125): the spread's result, the same number the desk shows any closing fill in.
    expect(closed.activity[0]).toMatchObject({ realizedPl: "+$165", realizedTone: "pos" });
    expect(closed.activity[0]).not.toHaveProperty("returnPct");

    const half = deskActivityView([lowFill, highFill], undefined, {
      spreadOf: spreadOf(),
      realizedByOrder: new Map([["leg-low", { realized: 290, returnPct: 56.9 }]]),
    });
    expect(half.activity[0]).not.toHaveProperty("realizedPl");
  });

  it("asks the decision store once per spread, however many legs it has", () => {
    let reads = 0;
    const lookup = spreadLookup({
      findSpreadLeg: (id) => LEGS[id],
      findByOrderId: (id) => {
        reads += 1;
        return findByOrderId(id);
      },
    });
    deskActivityView([lowFill, highFill], undefined, { spreadOf: lookup });
    expect(reads).toBe(1);
  });
});
