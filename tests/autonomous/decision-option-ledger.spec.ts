import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import { openOptionLedger } from "../../src/autonomous/decision-option-ledger.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OptionLegFill, OrderIntent } from "../../src/domain/types.js";
import type { NormalizedLifecycleActivity } from "../../src/trading/option-lifecycle.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * #4642 slice 8 — the decision store scores a bot's option round trips, so a playbook's realized
 * P/L (and the compounding budget it feeds) sees what an option play made. Before this, option
 * fills were scored nowhere: the CRWV wheel read $0 however many puts it sold and kept.
 */

const PUT = "CRWV261106P00085000";
const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";

const soldPut = anOptionIntent();
const buyBack = anOptionIntent({
  side: "buy",
  option: {
    effect: "close",
    structure: "close",
    legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
    limitPrice: 0.4,
  },
});
const spread = (side: "buy" | "sell"): OrderIntent =>
  anOptionIntent({
    symbol: "NVDA",
    side,
    playbookId: "NVDA-CALL-SPREAD",
    option: {
      effect: side === "buy" ? "open" : "close",
      structure: side === "buy" ? "call-debit-spread" : "close",
      legs: [
        { occSymbol: LOW, side, ratio: 1 },
        { occSymbol: HIGH, side: side === "buy" ? "sell" : "buy", ratio: 1 },
      ],
      limitPrice: side === "buy" ? 3.4 : -4,
    },
  });

/** One live cycle that filled `intent` at `price` (per share), with its legs' own fills. */
const filledCycle = (
  at: number,
  intent: OrderIntent,
  orderId: string,
  price: number,
  legFills?: readonly OptionLegFill[],
): DecisionRecord => ({
  at,
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [
    {
      intent,
      action: "placed",
      result: {
        intent,
        status: "filled",
        orderId,
        filledQuantity: intent.quantity,
        filledPrice: price,
        ...(legFills ? { legFills } : {}),
      },
    },
  ],
});

const activity = (
  id: string,
  over: Partial<NormalizedLifecycleActivity> = {},
): NormalizedLifecycleActivity => ({
  id,
  type: "OPEXP",
  symbol: PUT,
  quantity: 1,
  at: "2026-11-06T23:59:59.999Z",
  ...over,
});

describe("DecisionDb — option round trips", () => {
  let dir: string;
  let dbPath: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-option-ledger-"));
    dbPath = join(dir, "decisions.db");
    db = openDecisionDb(dbPath);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("scores a sold put that expires worthless into its playbook's realized P/L, ×100", () => {
    db.record(filledCycle(1_000, soldPut, "o-1", 2.05));
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(0);

    expect(db.recordOptionLifecycle("sauron", [activity("exp-1")])).toBe(1);

    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);
    expect(db.listRetrospectives("sauron")).toMatchObject([
      { symbol: PUT, exitReason: "expired worthless", realized: 205, returnPct: 100 },
    ]);
  });

  it("records each broker report once — a re-read of the same page writes nothing twice", () => {
    db.record(filledCycle(1_000, soldPut, "o-1", 2.05));
    db.recordOptionLifecycle("sauron", [activity("exp-1")]);
    db.close();
    db = openDecisionDb(dbPath);

    expect(db.recordOptionLifecycle("sauron", [activity("exp-1")])).toBe(0);
    // A new report on the same underlying rescores it; the trip already written stays one row.
    expect(db.recordOptionLifecycle("sauron", [activity("trd-1", { type: "OPTRD" })])).toBe(1);
    expect(db.listRetrospectives("sauron")).toHaveLength(1);
  });

  it("scores a put bought back on the fill itself, no broker report needed", () => {
    db.record(filledCycle(1_000, soldPut, "o-1", 2.05));
    db.record(filledCycle(2_000, buyBack, "o-2", 0.35));
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(170);
    expect(db.listRetrospectives("sauron")[0]?.exitReason).toBe(buyBack.reason);
  });

  it("scores a spread's open and close as ONE trip on the playbook that opened it", () => {
    db.record(
      filledCycle(1_000, spread("buy"), "s-1", 3.35, [
        { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
        { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
      ]),
    );
    db.record(
      filledCycle(2_000, spread("sell"), "s-2", -4.1, [
        { occSymbol: LOW, filledQuantity: 1, filledPrice: 7 },
        { occSymbol: HIGH, filledQuantity: 1, filledPrice: 2.9 },
      ]),
    );
    const trips = db.listRetrospectives("sauron");
    expect(trips).toHaveLength(1);
    expect(trips[0]?.symbol).toBe(`${LOW}/${HIGH}`);
    expect(db.realizedPlForPlaybook("sauron", "NVDA-CALL-SPREAD")).toBe(75);
  });

  it("keeps a report on a contract the bot never traded, and scores nothing from it", () => {
    expect(db.recordOptionLifecycle("sauron", [activity("exp-9")])).toBe(1);
    expect(db.listRetrospectives("sauron")).toEqual([]);
  });

  it("hands each new trip to the store's own retrospective writer, filed under its underlying", () => {
    db.record(filledCycle(1_000, soldPut, "o-1", 2.05));
    db.close();
    const raw = new DatabaseSync(dbPath);
    const written: [string, string, number][] = [];
    const ledger = openOptionLedger(raw, (personaId, trip) =>
      written.push([personaId, trip.symbol, trip.realized]),
    );
    expect(ledger.recordLifecycle("sauron", [activity("exp-1")])).toBe(1);
    raw.close();
    db = openDecisionDb(dbPath);
    expect(written).toEqual([["sauron", PUT, 205]]);
  });

  it("reaches a database created before the lifecycle table existed", () => {
    db.close();
    const raw = new DatabaseSync(dbPath);
    raw.exec("DROP TABLE option_lifecycle;");
    raw.close();
    db = openDecisionDb(dbPath);
    db.record(filledCycle(1_000, soldPut, "o-1", 2.05));
    expect(db.recordOptionLifecycle("sauron", [activity("exp-1")])).toBe(1);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);
  });
});
