import type { OptionOrderLeg } from "../../src/autonomous/decision-db-leg-orders.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import {
  activityKeep,
  ledgerPlaybooks,
  requestedUnderlying,
} from "../../src/observatory/activity-filter.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { deskActivityView } from "../../src/observatory/desk-json-view.js";
import { foldSpreadLegs, spreadLookup } from "../../src/observatory/spread-activity.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * Narrowing an account's Activity (#4650, plan #4642): Eric watches the trades a bot makes through
 * each playbook it runs. The filter runs on the folded ledger BEFORE the page is cut, so the first
 * page is 30 MATCHING orders (not the matches among the newest 30), and the cursor continues the
 * narrowed list.
 */

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
      result: { intent: spread, status: "filled", orderId: "mleg-1", filledQuantity: 1 },
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
const spreadOf = () =>
  spreadLookup({
    findSpreadLeg: (id) => LEGS[id],
    findByOrderId: (id) =>
      id === "mleg-1" ? { record, intent: spread as OrderIntent } : undefined,
  });

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

/** `n` orders a minute apart, newest first once sorted, alternating NVDA and AMD shares. */
const minutes = (n: number): TradeActivityRecord[] =>
  Array.from({ length: n }, (_, i) =>
    line({
      orderId: `ord-${String(i).padStart(2, "0")}`,
      symbol: i % 2 === 0 ? "NVDA" : "AMD",
      at: new Date(Date.parse("2026-10-01T14:00:00.000Z") + i * 60_000).toISOString(),
    }),
  );

const byPlaybook: Record<string, string> = { "mleg-1": "NVDA-CALL-SPREAD", "shr-1": "S1-NVDA" };
const playbookOf = (orderId: string) => byPlaybook[orderId];

describe("narrowing Activity by stock", () => {
  it("filters before the page is cut: the first page holds matches the newest 30 orders did not", () => {
    // 40 orders, 20 of them NVDA: unfiltered, the newest 30 hold 15 NVDA; filtered, all 20.
    const keep = activityKeep({ underlying: "NVDA" }, playbookOf);
    const page = deskActivityView(minutes(40), undefined, { keep });
    expect(page.activity).toHaveLength(20);
    expect(page.activity.every((row) => row.symbol === "NVDA")).toBe(true);
    expect(page).not.toHaveProperty("nextCursor");
  });

  it("continues the filtered list from its cursor — every match once, in order, then no cursor", () => {
    const keep = activityKeep({ underlying: "AMD" }, playbookOf);
    const seen: string[] = [];
    let before: string | undefined;
    for (let pages = 0; pages < 10; pages++) {
      const page = deskActivityView(minutes(40), undefined, {
        limit: 6,
        keep,
        ...(before !== undefined ? { before } : {}),
      });
      seen.push(...page.activity.map((row) => row.orderId));
      // A page short of matches only at the end, and its cursor the oldest MATCHING row's moment —
      // never an unmatched row's, which is what filtering after the cut would hand back.
      if (page.nextCursor !== undefined) {
        expect(page.activity).toHaveLength(6);
        expect(page.nextCursor).toBe(page.activity.at(-1)?.at);
      }
      before = page.nextCursor;
      if (before === undefined) break;
    }
    const amd = minutes(40)
      .filter((r) => r.symbol === "AMD")
      .map((r) => r.orderId)
      .reverse();
    expect(seen).toEqual(amd);
  });

  it("matches an option fill by its contract's underlying", () => {
    const keep = activityKeep({ underlying: "CRWV" }, playbookOf);
    const put = line({ orderId: "put-1", symbol: "CRWV261113P00085000", side: "sell" });
    const page = deskActivityView([put, line({ orderId: "shr-2" })], undefined, { keep });
    expect(page.activity.map((row) => row.orderId)).toEqual(["put-1"]);
  });

  it("matches a folded spread — whose broker symbol is none — by the stock its decision named", () => {
    const legs = [
      line({ orderId: "leg-low", symbol: LOW, price: 5.1 }),
      line({ orderId: "leg-high", symbol: HIGH, side: "sell", price: 1.75 }),
    ];
    const amd = line({ orderId: "amd-1", symbol: "AMD", at: "2026-10-28T15:00:00.000Z" });
    const page = deskActivityView([...legs, amd], undefined, {
      spreadOf: spreadOf(),
      keep: activityKeep({ underlying: "NVDA" }, playbookOf),
    });
    expect(page.activity.map((row) => [row.orderId, row.symbol])).toEqual([["mleg-1", ""]]);
    expect(page.activity[0]?.legs?.map((leg) => leg.orderId)).toEqual(["leg-low", "leg-high"]);
  });

  it("reads ?symbol= as a stock: trimmed, upper-cased, a contract as its root, blank as no filter", () => {
    expect(requestedUnderlying(" nvda ")).toBe("NVDA");
    expect(requestedUnderlying("NVDA261113C00185000")).toBe("NVDA");
    expect(requestedUnderlying("   ")).toBeUndefined();
    expect(requestedUnderlying(null)).toBeUndefined();
    // Nothing traded under it: matched as typed, so it matches nothing rather than everything.
    expect(requestedUnderlying("not a ticker")).toBe("NOT A TICKER");
  });
});

describe("narrowing Activity by playbook", () => {
  const ledger = [
    line({ orderId: "leg-low", symbol: LOW, price: 5.1 }),
    line({ orderId: "leg-high", symbol: HIGH, side: "sell", price: 1.75 }),
    line({ orderId: "shr-1", at: "2026-10-26T15:00:00.000Z" }),
    line({ orderId: "shr-2", symbol: "AMD", at: "2026-10-25T15:00:00.000Z" }),
  ];

  it("keeps a spread by the playbook on the spread's own decision, never a leg's", () => {
    const page = deskActivityView(ledger, undefined, {
      spreadOf: spreadOf(),
      keep: activityKeep({ playbook: "NVDA-CALL-SPREAD" }, playbookOf),
    });
    expect(page.activity.map((row) => row.orderId)).toEqual(["mleg-1"]);
  });

  it("applies stock and playbook together", () => {
    const keep = activityKeep({ underlying: "NVDA", playbook: "S1-NVDA" }, playbookOf);
    const page = deskActivityView(ledger, undefined, { spreadOf: spreadOf(), keep });
    expect(page.activity.map((row) => row.orderId)).toEqual(["shr-1"]);
  });

  it("lists every playbook the whole ledger was placed under, sorted, whatever page or filter is up", () => {
    const page = deskActivityView(ledger, undefined, {
      limit: 1,
      spreadOf: spreadOf(),
      keep: activityKeep({ underlying: "AMD" }, playbookOf),
      playbookOf,
    });
    expect(page.playbooks).toEqual(["NVDA-CALL-SPREAD", "S1-NVDA"]);
    expect(ledgerPlaybooks(foldSpreadLegs(ledger), () => undefined)).toEqual([]);
  });

  it("narrows nothing when neither is asked for, and carries no chip list unless asked", () => {
    expect(activityKeep({}, playbookOf)).toBeUndefined();
    expect(deskActivityView(ledger)).not.toHaveProperty("playbooks");
  });
});
