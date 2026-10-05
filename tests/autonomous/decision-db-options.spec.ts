import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord, IntentOutcome } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/** The decision store holding a bot's option orders: the side tables round-trip every field the
 *  wire carries, outcomes never trade places with a share order on the same ticker, and an option
 *  fill never enters the share ledger the retrospectives are computed from. */

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
    band: { low: 3.2, high: 3.6, at: "2026-10-27T15:00:00.000Z" },
    selection: { rule: "long ~0.45 delta, short +$15", spot: 181.4, dte: 17, candidates: 9 },
  },
});

const coveredCall = anOptionIntent({
  option: {
    structure: "covered-call",
    legs: [{ occSymbol: "CRWV261106C00100000", side: "sell", ratio: 1 }],
    limitPrice: 1.5,
  },
});

const shares = (side: OrderIntent["side"], quantity: number): OrderIntent => ({
  symbol: "CRWV",
  side,
  quantity,
  type: "market",
  reason: "shares",
});

const placed = (intent: OrderIntent, result: Omit<OrderResult, "intent">): IntentOutcome => ({
  intent,
  action: "placed",
  result: { intent, ...result },
});

describe("DecisionDb — option orders", () => {
  let dir: string;
  let dbPath: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-options-"));
    dbPath = join(dir, "decisions.db");
    db = openDecisionDb(dbPath);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips an option order whole: legs, band, selection, the client id on the outcome only, leg fills", () => {
    const guarded = { ...spread };
    const submitted = { ...guarded, clientOrderId: "sk1-sauron-NVDA-k9x2-0" };
    const record: DecisionRecord = {
      at: 1_761_577_200_000,
      personaId: "sauron",
      mode: "live",
      rawIntents: [spread],
      guardedIntents: [guarded],
      outcomes: [
        placed(submitted, {
          status: "filled",
          orderId: "ord-9",
          filledQuantity: 1,
          filledPrice: 3.35,
          legFills: [
            { occSymbol: LOW, filledQuantity: 1, filledPrice: 6.1 },
            { occSymbol: HIGH, filledQuantity: 1, filledPrice: 2.75 },
          ],
        }),
      ],
    };

    db.record(record);
    db.close();
    db = openDecisionDb(dbPath);

    expect(db.listByPersona("sauron")).toEqual([record]);
    expect(db.listSince("sauron", 0)).toEqual([record]);
    expect(db.findByOrderId("ord-9")).toEqual({ record, intent: submitted });
    expect(db.listByPersona("sauron")[0]?.guardedIntents[0]).not.toHaveProperty("clientOrderId");
  });

  it("round-trips a refused option order, and a limit that ended unfilled", () => {
    const record: DecisionRecord = {
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [coveredCall, spread],
      guardedIntents: [spread],
      outcomes: [placed(spread, { status: "unfilled", orderId: "ord-1" })],
      refusals: [{ intent: coveredCall, reason: "call-not-covered" }],
    };

    db.record(record);

    expect(db.listByPersona("sauron")).toEqual([record]);
  });

  it("never lets a share sell and a covered call on one ticker trade outcomes", () => {
    const shareSell = shares("sell", 100);
    // The outcomes arrive in the opposite order to the raw intents: a symbol+side match alone
    // would hand the call the share fill and the shares the call's unfilled limit.
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [coveredCall, shareSell],
      guardedIntents: [coveredCall, shareSell],
      outcomes: [
        placed(shareSell, { status: "filled", orderId: "s-1", filledQuantity: 100 }),
        placed(coveredCall, { status: "unfilled", orderId: "c-1" }),
      ],
    });

    const outcomes = db.listByPersona("sauron")[0]?.outcomes ?? [];
    expect(
      outcomes.map((o) => [o.intent.option?.structure ?? "shares", o.result?.orderId]),
    ).toEqual([
      ["covered-call", "c-1"],
      ["shares", "s-1"],
    ]);
  });

  it("keeps an option fill out of the share ledger — a covered call closes no share lot", () => {
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [shares("buy", 100)],
      guardedIntents: [shares("buy", 100)],
      outcomes: [
        placed(shares("buy", 100), {
          status: "filled",
          orderId: "o-1",
          filledQuantity: 100,
          filledPrice: 90,
        }),
      ],
    });
    db.record({
      at: 2,
      personaId: "sauron",
      mode: "live",
      rawIntents: [coveredCall],
      guardedIntents: [coveredCall],
      outcomes: [
        placed(coveredCall, {
          status: "filled",
          orderId: "o-2",
          filledQuantity: 1,
          filledPrice: 1.5,
        }),
      ],
    });
    expect(db.listRetrospectives("sauron")).toEqual([]);

    db.record({
      at: 3,
      personaId: "sauron",
      mode: "live",
      rawIntents: [shares("sell", 100)],
      guardedIntents: [shares("sell", 100)],
      outcomes: [
        placed(shares("sell", 100), {
          status: "filled",
          orderId: "o-3",
          filledQuantity: 100,
          filledPrice: 95,
        }),
      ],
    });
    // The whole 100-share lot closes on the share sale — the call took none of it.
    expect(db.listRetrospectives("sauron").map((r) => r.realized)).toEqual([500]);
  });

  it("reaches a database created before the option tables existed", () => {
    db.close();
    const raw = new DatabaseSync(dbPath);
    raw.exec("DROP TABLE intent_option_legs; DROP TABLE intent_options;");
    raw.close();
    db = openDecisionDb(dbPath);

    db.record({
      at: 1,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [spread],
      guardedIntents: [spread],
      outcomes: [{ intent: spread, action: "observed" }],
    });

    expect(db.listByPersona("sauron")[0]?.rawIntents).toEqual([spread]);
  });

  it("stores a non-finite limit without throwing, and reads it back as not-a-number", () => {
    const broken = anOptionIntent({ option: { limitPrice: Number.NaN } });
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [broken],
      guardedIntents: [],
      outcomes: [],
      refusals: [{ intent: broken, reason: "option-shape" }],
    });

    const [row] = db.listByPersona("sauron");
    expect(row?.refusals?.[0]?.reason).toBe("option-shape");
    expect(row?.rawIntents[0]?.option?.limitPrice).toBeNaN();
  });

  it("stores a malformed option AS an option, never read back as a share order", () => {
    const broken = {
      ...coveredCall,
      option: { ...coveredCall.option, effect: undefined, legs: "not-an-array" },
    } as unknown as OrderIntent;
    db.record({
      at: 7,
      personaId: "sauron",
      mode: "live",
      rawIntents: [broken],
      guardedIntents: [],
      outcomes: [],
      refusals: [{ intent: broken, reason: "option-shape" }],
    });
    const [read] = db.listByPersona("sauron");
    const stored = read?.refusals?.[0]?.intent;
    expect(stored?.option).toBeDefined();
    expect(stored?.type).toBe("limit");
    expect(stored?.option?.legs).toEqual([]);
  });

  it("drops a corrupt stored selection, never the whole read", () => {
    db.record({
      at: 8,
      personaId: "sauron",
      mode: "live",
      rawIntents: [spread],
      guardedIntents: [],
      outcomes: [],
      refusals: [{ intent: spread, reason: "options-level" }],
    });
    db.close();
    const raw = new DatabaseSync(dbPath);
    raw.exec("UPDATE intent_options SET selection_json = '{not json'");
    raw.close();
    db = openDecisionDb(dbPath);
    const stored = db.listByPersona("sauron")[0]?.refusals?.[0]?.intent;
    expect(stored?.option?.legs).toHaveLength(2);
    expect(stored?.option).not.toHaveProperty("selection");
  });
});
