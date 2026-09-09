import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  type DecisionDb,
  decisionDbPathFrom,
  openDecisionDb,
} from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";

const intent = (over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
  ...over,
});

describe("decisionDbPathFrom", () => {
  it("derives a sibling decisions.db in the same directory — no new env var", () => {
    expect(decisionDbPathFrom("/data/bots-state.db")).toBe("/data/decisions.db");
  });

  it("handles a bare filename with no directory component", () => {
    expect(decisionDbPathFrom("bots-state.db")).toBe("decisions.db");
  });
});

describe("DecisionDb", () => {
  let dir: string;
  let dbPath: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-"));
    dbPath = join(dir, "decisions.db");
    db = openDecisionDb(dbPath);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips a simple observed cycle across a fresh open of the same file", () => {
    const entry: DecisionRecord = {
      at: 1_700_000_000_000,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [intent()],
      guardedIntents: [intent()],
      outcomes: [{ intent: intent(), action: "observed" }],
    };
    db.record(entry);
    db.close();

    const reopened = openDecisionDb(dbPath);
    const [row] = reopened.listByPersona("sauron");
    expect(row).toMatchObject({ at: 1_700_000_000_000, personaId: "sauron", mode: "observe" });
    expect(row?.outcomes[0]).toMatchObject({ action: "observed" });
    reopened.close();
    db = openDecisionDb(dbPath); // afterEach expects a live handle
  });

  it("captures the market context and structured strategy/forecast fields", () => {
    const raw = intent({
      strategy: "sauron-panic-claim",
      expectation: "Expect a bounce.",
      forecast: { direction: "up", invalidator: "sentiment deteriorates further" },
    });
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [raw],
      guardedIntents: [raw],
      outcomes: [{ intent: raw, action: "observed" }],
      context: {
        asOf: "2026-09-09T10:00:00Z",
        quotes: { NVDA: { symbol: "NVDA", bid: 100, ask: 100.1, last: 100.05, asOf: "t" } },
        momentum: { NVDA: 0.02 },
        newsSentiment: { NVDA: -0.75 },
      },
    });

    const [row] = db.listByPersona("sauron");
    expect(row?.context).toMatchObject({ asOf: "2026-09-09T10:00:00Z" });
    expect(row?.outcomes[0]?.intent).toMatchObject({
      strategy: "sauron-panic-claim",
      forecast: { direction: "up", invalidator: "sentiment deteriorates further" },
    });
  });

  it("names the specific guard on a refused intent, distinct from an approved one in the same cycle", () => {
    const refused = intent({ symbol: "NVDA", side: "buy", quantity: 60 });
    const approved = intent({ symbol: "MSFT", side: "sell", quantity: 30 });
    const approvedGuarded = { ...approved, quantity: 20 }; // clamped
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [refused, approved],
      guardedIntents: [approvedGuarded],
      outcomes: [
        {
          intent: approvedGuarded,
          action: "placed",
          result: { intent: approvedGuarded, status: "filled", orderId: "ord-1", filledPrice: 400 },
        },
      ],
      refusals: [{ intent: refused, reason: "s2-print" }],
    });

    const [row] = db.listByPersona("sauron");
    expect(row?.refusals).toEqual([
      { intent: expect.objectContaining({ symbol: "NVDA" }), reason: "s2-print" },
    ]);
    expect(row?.guardedIntents[0]).toMatchObject({ symbol: "MSFT", quantity: 20 });
  });

  it("captures a halted cycle with its market context, even though nothing was decided", () => {
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
      halted: "manual",
      context: { asOf: "t", quotes: {} },
    });

    const [row] = db.listByPersona("sauron");
    expect(row?.halted).toBe("manual");
    expect(row?.context).toEqual({ asOf: "t", quotes: {} });
    expect(row?.rawIntents).toEqual([]);
  });

  it("finds a decision by the broker's own order id — the exact join, no fuzzy time window", () => {
    const raw = intent();
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [raw],
      guardedIntents: [raw],
      outcomes: [
        {
          intent: raw,
          action: "placed",
          result: { intent: raw, status: "filled", orderId: "ord-42" },
        },
      ],
    });

    const found = db.findByOrderId("ord-42");
    expect(found?.record.personaId).toBe("sauron");
    expect(found?.intent.symbol).toBe("NVDA");
    expect(db.findByOrderId("no-such-order")).toBeUndefined();
  });

  it("is idempotent on (personaId, at) — re-recording the same cycle never duplicates intents", () => {
    const entry: DecisionRecord = {
      at: 1,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [intent()],
      guardedIntents: [intent()],
      outcomes: [{ intent: intent(), action: "observed" }],
    };
    db.record(entry);
    db.record(entry); // the migration's own replay-safety guarantee
    db.record(entry);

    const rows = db.listByPersona("sauron");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.outcomes).toHaveLength(1);
  });

  it("bounds listByPersona to the clamped page size, newest first, and pages with beforeAt", () => {
    for (let i = 1; i <= 5; i++) {
      db.record({
        at: i,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
      });
    }

    const firstPage = db.listByPersona("sauron", { limit: 2 });
    expect(firstPage.map((r) => r.at)).toEqual([5, 4]);

    const nextPage = db.listByPersona("sauron", { limit: 2, beforeAt: 4 });
    expect(nextPage.map((r) => r.at)).toEqual([3, 2]);

    // A caller asking for more than the max page never gets an unbounded read.
    const clamped = db.listByPersona("sauron", { limit: 10_000 });
    expect(clamped.length).toBeLessThanOrEqual(100);
    expect(clamped).toHaveLength(5); // only 5 rows exist, well under the 100 cap
  });

  it("scopes listByPersona to the requested persona only", () => {
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
    });
    db.record({
      at: 1,
      personaId: "beta-scout",
      mode: "observe",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
    });

    expect(db.listByPersona("sauron")).toHaveLength(1);
    expect(db.listByPersona("beta-scout")).toHaveLength(1);
  });

  it("writes one market_signals row per symbol in context.quotes, shared across personas", () => {
    db.record({
      at: 100,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
      context: {
        asOf: "t",
        quotes: {
          NVDA: { symbol: "NVDA", bid: 100, ask: 100.1, last: 100.05, asOf: "t" },
          MSFT: { symbol: "MSFT", bid: 400, ask: 400.2, last: 400.1, asOf: "t" },
        },
        momentum: { NVDA: 0.01 },
      },
    });
    db.close();

    // Verify directly — market_signals has no public reader in this PR (PR 7 owns consuming it).
    const raw = new DatabaseSync(dbPath);
    const rows = raw
      .prepare("SELECT symbol, momentum FROM market_signals WHERE at = 100 ORDER BY symbol")
      .all();
    expect(rows).toEqual([
      { symbol: "MSFT", momentum: null },
      { symbol: "NVDA", momentum: 0.01 },
    ]);
    raw.close();
    db = openDecisionDb(dbPath); // afterEach expects a live handle
  });
});
