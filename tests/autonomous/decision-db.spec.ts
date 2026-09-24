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

describe("openDecisionDb — the missing-directory bug (found live in prod, 2026-09-22)", () => {
  it("creates its own parent directory rather than throwing when it doesn't exist yet", () => {
    // Reproduces the app-side production bug exactly: `SKYNET_INSIGHTS_DIR`-derived paths are a
    // SUBDIRECTORY of the mount, only ever created as a side effect of a DIFFERENT store writing
    // to it first. Every other test in this file pre-creates `dir` via `mkdtempSync`, which is
    // precisely why this never failed a test before — the bug only shows on a genuinely fresh
    // directory, exactly what production had.
    const root = mkdtempSync(join(tmpdir(), "decision-db-missing-parent-"));
    const nestedPath = join(root, "insights", "decisions.db");
    let db: DecisionDb | undefined;
    try {
      expect(() => {
        db = openDecisionDb(nestedPath);
      }).not.toThrow();
      db?.record({
        at: 1,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
      });
      expect(db?.listByPersona("sauron")).toHaveLength(1);
    } finally {
      db?.close();
      rmSync(root, { recursive: true, force: true });
    }
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

  describe("playbook verdicts (#3687)", () => {
    const quiet = (at: number): DecisionRecord => ({
      at,
      personaId: "sauron",
      mode: "live",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
      playbookVerdicts: [
        { playbookId: "S1-NVDA", mode: "standard", state: "no-window" },
        { playbookId: "S1-NVDA", mode: "aggressive", state: "no-window" },
        { playbookId: "HC-SAURON", mode: "standard", state: "tactical" },
      ],
    });

    it("round-trips a quiet pass's verdicts, in order, across a fresh open", () => {
      db.record(quiet(1));
      db.close();
      const reopened = openDecisionDb(dbPath);
      expect(reopened.listByPersona("sauron")[0]?.playbookVerdicts).toEqual(
        quiet(1).playbookVerdicts,
      );
      reopened.close();
      db = openDecisionDb(dbPath);
    });

    it("recording the same pass twice stores each verdict once", () => {
      db.record(quiet(1));
      db.record(quiet(1));
      expect(db.listByPersona("sauron")[0]?.playbookVerdicts).toHaveLength(3);
    });

    it("reaches a database created before the verdicts table existed", () => {
      db.close();
      const raw = new DatabaseSync(dbPath);
      raw.exec("DROP TABLE playbook_verdicts");
      raw.close();
      db = openDecisionDb(dbPath);
      db.record(quiet(2));
      expect(db.listByPersona("sauron")[0]?.playbookVerdicts).toHaveLength(3);
    });

    it("leaves the field absent on a pass that recorded none", () => {
      db.record({ ...quiet(3), playbookVerdicts: undefined });
      expect(db.listByPersona("sauron")[0]).not.toHaveProperty("playbookVerdicts");
    });
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

  it("maxAtAll reports the latest at per persona, absent for a persona with no rows", () => {
    db.record({
      at: 5,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
    });
    db.record({
      at: 9,
      personaId: "sauron",
      mode: "observe",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
    });
    db.record({
      at: 3,
      personaId: "beta-scout",
      mode: "observe",
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
    });

    expect(db.maxAtAll()).toEqual({ sauron: 9, "beta-scout": 3 });
  });

  it("listSince returns only rows strictly after the given at, oldest first, bounded", () => {
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
    expect(db.listSince("sauron", 2).map((r) => r.at)).toEqual([3, 4, 5]);
    expect(db.listSince("sauron", 0, 2).map((r) => r.at)).toEqual([1, 2]);
    expect(db.listSince("sauron", 999)).toEqual([]);
  });

  it("recordBatch writes every entry idempotently, as one transaction", () => {
    db.recordBatch([
      {
        at: 1,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
      },
      {
        at: 2,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
      },
    ]);
    db.recordBatch([
      {
        at: 2,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
      }, // already there
      {
        at: 3,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
      },
    ]);
    expect(
      db
        .listByPersona("sauron")
        .map((r) => r.at)
        .sort(),
    ).toEqual([1, 2, 3]);
  });

  describe("the retrospective writer (#2287 PR 7)", () => {
    const filledOutcome = (raw: OrderIntent, orderId: string, filledPrice: number) => ({
      intent: raw,
      action: "placed" as const,
      result: {
        intent: raw,
        status: "filled" as const,
        orderId,
        filledQuantity: raw.quantity,
        filledPrice,
      },
    });

    it("writes a retrospective automatically when a later fill closes the position — no separate call", () => {
      const buy = intent({ side: "buy", quantity: 20, reason: "panic fade" });
      db.record({
        at: 1_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [buy],
        guardedIntents: [buy],
        outcomes: [filledOutcome(buy, "o-1", 100)],
        context: {
          asOf: "2026-09-09T10:00:00Z",
          quotes: { NVDA: { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" } },
          momentum: { NVDA: -0.8 },
          newsSentiment: { NVDA: -0.6 },
        },
      });
      // No retrospective yet — nothing has closed.
      expect(db.listRetrospectives("sauron")).toEqual([]);

      const sell = intent({ side: "sell", quantity: 20, reason: "target hit" });
      db.record({
        at: 2_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [sell],
        guardedIntents: [sell],
        outcomes: [filledOutcome(sell, "o-2", 120)],
        context: {
          asOf: "2026-09-09T10:05:00Z",
          quotes: { NVDA: { symbol: "NVDA", bid: 120, ask: 120, last: 120, asOf: "t" } },
          momentum: { NVDA: 0.1 },
          newsSentiment: { NVDA: 0.2 },
        },
      });

      const [retro] = db.listRetrospectives("sauron");
      expect(retro).toMatchObject({
        at: 2_000,
        personaId: "sauron",
        symbol: "NVDA",
        exitReason: "target hit",
        realized: 400,
        returnPct: 20,
      });
      expect(retro?.momentumDelta).toBeCloseTo(0.9);
      expect(retro?.sentimentDelta).toBeCloseTo(0.8);
    });

    it("never writes a retrospective for an open position — an observed or still-open buy is not a close", () => {
      const buy = intent({ side: "buy", quantity: 20 });
      db.record({
        at: 1,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [buy],
        guardedIntents: [buy],
        outcomes: [{ intent: buy, action: "observed" }],
      });
      expect(db.listRetrospectives("sauron")).toEqual([]);
    });

    it("re-recording the same closing decision never duplicates the retrospective row", () => {
      const buy = intent({ side: "buy", quantity: 20 });
      const sell = intent({ side: "sell", quantity: 20 });
      const buyEntry: DecisionRecord = {
        at: 1_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [buy],
        guardedIntents: [buy],
        outcomes: [filledOutcome(buy, "o-1", 100)],
      };
      const sellEntry: DecisionRecord = {
        at: 2_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [sell],
        guardedIntents: [sell],
        outcomes: [filledOutcome(sell, "o-2", 120)],
      };
      db.record(buyEntry);
      db.record(sellEntry);
      db.record(sellEntry); // idempotent re-delivery, e.g. a replayed replication batch

      expect(db.listRetrospectives("sauron")).toHaveLength(1);
    });

    it("scopes retrospectives to the requested persona only", () => {
      const buy = intent({ side: "buy", quantity: 10 });
      const sell = intent({ side: "sell", quantity: 10 });
      db.record({
        at: 1,
        personaId: "sauron",
        mode: "live",
        rawIntents: [buy],
        guardedIntents: [buy],
        outcomes: [filledOutcome(buy, "s-1", 50)],
      });
      db.record({
        at: 2,
        personaId: "sauron",
        mode: "live",
        rawIntents: [sell],
        guardedIntents: [sell],
        outcomes: [filledOutcome(sell, "s-2", 60)],
      });
      expect(db.listRetrospectives("sauron")).toHaveLength(1);
      expect(db.listRetrospectives("beta-scout")).toEqual([]);
    });
  });

  describe("realizedPlForPlaybook (issue #3527 slice 3)", () => {
    const filledOutcome = (raw: OrderIntent, orderId: string, filledPrice: number) => ({
      intent: raw,
      action: "placed" as const,
      result: {
        intent: raw,
        status: "filled" as const,
        orderId,
        filledQuantity: raw.quantity,
        filledPrice,
      },
    });

    it("returns 0 when nothing has closed under that playbook yet", () => {
      expect(db.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(0);
    });

    it("sums realized P/L across every closed round-trip attributed to the playbook", () => {
      const buy = intent({ side: "buy", quantity: 20, playbookId: "S1-NVDA" });
      db.record({
        at: 1_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [buy],
        guardedIntents: [buy],
        outcomes: [filledOutcome(buy, "o-1", 100)],
      });
      const sell = intent({ side: "sell", quantity: 20, playbookId: "S1-NVDA" });
      db.record({
        at: 2_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [sell],
        guardedIntents: [sell],
        outcomes: [filledOutcome(sell, "o-2", 120)],
      });

      expect(db.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(400);
    });

    it("scopes to the requested persona and playbook only", () => {
      const buy = intent({ side: "buy", quantity: 20, playbookId: "S1-NVDA" });
      db.record({
        at: 1_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [buy],
        guardedIntents: [buy],
        outcomes: [filledOutcome(buy, "o-1", 100)],
      });
      const sell = intent({ side: "sell", quantity: 20, playbookId: "S1-NVDA" });
      db.record({
        at: 2_000,
        personaId: "sauron",
        mode: "live",
        rawIntents: [sell],
        guardedIntents: [sell],
        outcomes: [filledOutcome(sell, "o-2", 120)],
      });

      expect(db.realizedPlForPlaybook("beta-scout", "S1-NVDA")).toBe(0);
      expect(db.realizedPlForPlaybook("sauron", "OTHER-PLAYBOOK")).toBe(0);
    });
  });

  describe("funnelFor (#2287 PR 7b)", () => {
    it("walks a mixed cycle into cycles/raw/survived/placed/filled/closed plus refusals", () => {
      const refused = intent({ symbol: "TSLA", side: "buy", quantity: 5 });
      const placedRejected = intent({ symbol: "MSFT", side: "sell", quantity: 8 });
      const observedOnly = intent({ symbol: "AMD", side: "buy", quantity: 3 });
      const buy = intent({ symbol: "NVDA", side: "buy", quantity: 20 });
      const sell = intent({ symbol: "NVDA", side: "sell", quantity: 20 });

      db.record({
        at: 1,
        personaId: "sauron",
        mode: "live",
        rawIntents: [refused, placedRejected, observedOnly, buy],
        guardedIntents: [placedRejected, observedOnly, buy],
        outcomes: [
          {
            intent: placedRejected,
            action: "placed",
            result: { intent: placedRejected, status: "rejected", orderId: "r-1" },
          },
          { intent: observedOnly, action: "observed" },
          {
            intent: buy,
            action: "placed",
            result: {
              intent: buy,
              status: "filled",
              orderId: "o-1",
              filledQuantity: 20,
              filledPrice: 100,
            },
          },
        ],
        refusals: [{ intent: refused, reason: "insufficient-cash" }],
      });
      db.record({
        at: 2,
        personaId: "sauron",
        mode: "live",
        rawIntents: [sell],
        guardedIntents: [sell],
        outcomes: [
          {
            intent: sell,
            action: "placed",
            result: {
              intent: sell,
              status: "filled",
              orderId: "o-2",
              filledQuantity: 20,
              filledPrice: 120,
            },
          },
        ],
      });

      const funnel = db.funnelFor("sauron");
      expect(funnel).toMatchObject({
        cycles: 2,
        rawIntents: 5,
        survivedGuards: 4, // everything but the one refused intent
        placed: 3, // placedRejected + buy + sell
        filled: 2, // buy + sell
        closed: 1, // one round trip closed by the retrospective writer
      });
      expect(funnel.refusalsByReason).toEqual({ "insufficient-cash": 1 });
    });

    it("returns an honest all-zero funnel for a persona with no history at all", () => {
      expect(db.funnelFor("ghost")).toEqual({
        cycles: 0,
        rawIntents: 0,
        survivedGuards: 0,
        placed: 0,
        filled: 0,
        closed: 0,
        refusalsByReason: {},
      });
    });

    it("scopes the funnel to the requested persona only", () => {
      db.record({
        at: 1,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [intent()],
        guardedIntents: [intent()],
        outcomes: [{ intent: intent(), action: "observed" }],
      });
      expect(db.funnelFor("sauron").cycles).toBe(1);
      expect(db.funnelFor("beta-scout").cycles).toBe(0);
    });
  });
});
