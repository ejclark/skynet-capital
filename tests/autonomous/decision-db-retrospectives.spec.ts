import { DatabaseSync } from "node:sqlite";
import { OPTION_TABLES_SQL } from "../../src/autonomous/decision-db-options.js";
import {
  openRetrospectiveReads,
  type RetrospectiveReads,
} from "../../src/autonomous/decision-db-retrospectives.js";
import { CORE_TABLES_SQL } from "../../src/autonomous/decision-db-schema.js";
import { SETTLEMENTS_SQL } from "../../src/autonomous/decision-db-settlements.js";
import type { RetrospectiveInsert } from "../../src/autonomous/decision-retrospectives.js";
import { LIFECYCLE_STATUS } from "../../src/trading/option-lifecycle.js";

/**
 * The share-tape half of the retrospectives table, driven directly against a bare in-memory store
 * (`decision-db.spec.ts` and the settlement specs reach it only through `openDecisionDb`). Pins the
 * FIFO re-score of one (persona, symbol) tape, the newest-first page, the closed count, the
 * playbook-attributed P/L and the put outcomes -- including what each must leave out.
 */

interface Fill {
  readonly persona?: string;
  readonly at: number;
  readonly symbol?: string;
  readonly side: "buy" | "sell";
  readonly qty: number;
  /** Omit for a fill the broker never priced. */
  readonly price?: number;
  readonly status?: string;
  readonly reason?: string;
  readonly momentum?: number;
  readonly sentiment?: number;
  readonly playbookId?: string;
  readonly strategy?: string;
  /** Marks the intent an option one: it has an `intent_options` row. */
  readonly option?: boolean;
}

const insert = (over: Partial<RetrospectiveInsert> = {}): RetrospectiveInsert => ({
  at: 1_000,
  symbol: "NVDA",
  entryIntentId: 1,
  exitReason: "target hit",
  realized: 100,
  returnPct: 10,
  sentimentDelta: null,
  momentumDelta: null,
  ...over,
});

describe("openRetrospectiveReads", () => {
  let db: DatabaseSync;
  let reads: RetrospectiveReads;
  let orders: number;

  beforeEach(() => {
    // Foreign keys off: the list / count / scored-after cases write bare trips with stand-in entry
    // ids; the cases that depend on which intent opened a trip record real intents via `fill`.
    db = new DatabaseSync(":memory:", { enableForeignKeyConstraints: false });
    db.exec(`${CORE_TABLES_SQL}\n${OPTION_TABLES_SQL}\n${SETTLEMENTS_SQL}`);
    reads = openRetrospectiveReads(db);
    orders = 0;
  });
  afterEach(() => db.close());

  /** One decision holding one intent; returns the intent's id. */
  function fill(f: Fill): number {
    const persona = f.persona ?? "sauron";
    const symbol = f.symbol ?? "NVDA";
    orders += 1;
    const decision = db
      .prepare("INSERT INTO decisions (at, persona_id, mode) VALUES (?, ?, 'live')")
      .run(f.at, persona);
    const intent = db
      .prepare(
        `INSERT INTO intents (decision_id, symbol, side, raw_quantity, reason, strategy, playbook_id,
           momentum, sentiment, order_id, result_status, filled_quantity, filled_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        Number(decision.lastInsertRowid),
        symbol,
        f.side,
        f.qty,
        f.reason ?? `${f.side} ${f.at}`,
        f.strategy ?? null,
        f.playbookId ?? null,
        f.momentum ?? null,
        f.sentiment ?? null,
        `ord-${orders}`,
        f.status ?? "filled",
        f.qty,
        f.price ?? null,
      );
    const id = Number(intent.lastInsertRowid);
    if (f.option) {
      db.prepare(
        "INSERT INTO intent_options (intent_id, effect, structure, client_order_id) VALUES (?, 'open', 'single', ?)",
      ).run(id, `cl-${id}`);
    }
    return id;
  }

  const realized = (personaId = "sauron", limit = 50) =>
    reads.list(personaId, limit).map((r) => r.realized);

  describe("when updateFor re-scores a share tape", () => {
    it("closes lots first-in-first-out, one trip per lot, each pointing at its own entry", () => {
      const first = fill({ at: 1, side: "buy", qty: 10, price: 100 });
      const second = fill({ at: 2, side: "buy", qty: 10, price: 110 });
      fill({ at: 3, side: "sell", qty: 15, price: 120 });

      reads.updateFor("sauron", "NVDA");

      const trips = reads.list("sauron", 10);
      expect(trips).toHaveLength(2);
      const byEntry = new Map(trips.map((t) => [t.entryIntentId, t] as const));
      expect(byEntry.get(first)?.realized).toBe(200); // 10 shares, 100 -> 120
      expect(byEntry.get(second)?.realized).toBe(50); // the remaining 5, 110 -> 120
      expect(trips.every((t) => t.at === 3)).toBe(true);
    });

    it("writes nothing while a position is still open", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      reads.updateFor("sauron", "NVDA");
      expect(reads.closedCount("sauron")).toBe(0);
    });

    it("is safe to call twice for the same state: the second call adds nothing", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 2, side: "sell", qty: 10, price: 105 });
      reads.updateFor("sauron", "NVDA");
      reads.updateFor("sauron", "NVDA");
      expect(realized()).toEqual([50]);
    });

    it("writes only the newly closed trip when a later close arrives", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 2, side: "sell", qty: 4, price: 110 });
      reads.updateFor("sauron", "NVDA");
      fill({ at: 3, side: "sell", qty: 6, price: 120 });
      reads.updateFor("sauron", "NVDA");

      expect(reads.list("sauron", 10).map((r) => [r.at, r.realized])).toEqual([
        [3, 120],
        [2, 40],
      ]);
    });

    it("orders the tape by decision time, not by the order rows were written", () => {
      // The sell is stored first (a late-arriving entry), but it happened second.
      fill({ at: 2, side: "sell", qty: 10, price: 130 });
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      reads.updateFor("sauron", "NVDA");
      expect(realized()).toEqual([300]);
    });

    it("takes the exit reason from the closing intent and the entry-to-exit signal deltas", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100, momentum: -0.5, sentiment: -0.25 });
      fill({
        at: 2,
        side: "sell",
        qty: 10,
        price: 110,
        reason: "target hit",
        momentum: 0.25,
        sentiment: 0.5,
      });
      reads.updateFor("sauron", "NVDA");

      expect(reads.list("sauron", 1)[0]).toMatchObject({
        exitReason: "target hit",
        momentumDelta: 0.75,
        sentimentDelta: 0.75,
        returnPct: 10,
      });
    });

    it("leaves a delta null when either end never carried that signal", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100, momentum: 0.5 });
      fill({ at: 2, side: "sell", qty: 10, price: 110, sentiment: 0.5 });
      reads.updateFor("sauron", "NVDA");

      expect(reads.list("sauron", 1)[0]).toMatchObject({
        momentumDelta: null,
        sentimentDelta: null,
      });
    });

    it("reads only the asked persona's and symbol's fills", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 2, side: "sell", qty: 10, price: 110 });
      fill({ persona: "banker", at: 3, side: "buy", qty: 10, price: 100 });
      fill({ persona: "banker", at: 4, side: "sell", qty: 10, price: 140 });
      fill({ symbol: "AAPL", at: 5, side: "buy", qty: 10, price: 100 });
      fill({ symbol: "AAPL", at: 6, side: "sell", qty: 10, price: 150 });

      reads.updateFor("sauron", "NVDA");

      expect(realized("sauron")).toEqual([100]);
      expect(reads.closedCount("banker")).toBe(0);
    });

    it("does not pair a buy with a sell that never filled", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 2, side: "sell", qty: 10, price: 110, status: "rejected" });
      fill({ at: 3, side: "sell", qty: 10, price: 110, status: "working" }); // not settled
      reads.updateFor("sauron", "NVDA");
      expect(reads.closedCount("sauron")).toBe(0);
    });

    it("never invents a $0 fill: a close the broker did not price scores nothing", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 2, side: "sell", qty: 10 });
      reads.updateFor("sauron", "NVDA");
      expect(reads.closedCount("sauron")).toBe(0);
    });

    it("keeps an option fill on the same underlying off the share tape", () => {
      fill({ at: 1, side: "buy", qty: 1, price: 5, option: true });
      fill({ at: 2, side: "sell", qty: 1, price: 7, option: true });
      reads.updateFor("sauron", "NVDA");
      expect(reads.closedCount("sauron")).toBe(0);
    });

    it("scores shares around an option fill as if the option were not there", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 2, side: "sell", qty: 10, price: 5, option: true });
      fill({ at: 3, side: "sell", qty: 10, price: 120 });
      reads.updateFor("sauron", "NVDA");
      expect(realized()).toEqual([200]);
    });
  });

  describe("when updateFor rebuilds", () => {
    it("replaces the tape's old trips with the re-paired ones instead of counting a close twice", () => {
      const buy = fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 3, side: "sell", qty: 10, price: 120 });
      reads.updateFor("sauron", "NVDA");
      expect(realized()).toEqual([200]);

      // A fill lands BEHIND the written trip (a late settlement) and shifts which lot closes.
      fill({ at: 0, side: "buy", qty: 10, price: 90 });
      reads.updateFor("sauron", "NVDA", true);

      const trips = reads.list("sauron", 10);
      expect(trips).toHaveLength(1);
      expect(trips[0]?.realized).toBe(300); // FIFO: the 90 lot is now first in
      expect(trips[0]?.entryIntentId).not.toBe(buy);
    });

    it("drops trips the re-score no longer supports", () => {
      reads.write("sauron", insert({ symbol: "NVDA", entryIntentId: 99 }));
      reads.updateFor("sauron", "NVDA", true);
      expect(reads.closedCount("sauron")).toBe(0);
    });

    it("without rebuild, keeps a stale trip beside the fresh one", () => {
      reads.write("sauron", insert({ symbol: "NVDA", entryIntentId: 99, realized: 1 }));
      fill({ at: 1, side: "buy", qty: 10, price: 100 });
      fill({ at: 2, side: "sell", qty: 10, price: 110 });
      reads.updateFor("sauron", "NVDA");
      expect(realized().sort((a, b) => a - b)).toEqual([1, 100]);
    });

    it("clears only that persona's trips on that bare ticker", () => {
      const occ = "NVDA261113C00185000";
      reads.write("sauron", insert({ symbol: "AAPL", entryIntentId: 11 }));
      reads.write("sauron", insert({ symbol: occ, entryIntentId: 12 })); // an option trip
      reads.write("banker", insert({ symbol: "NVDA", entryIntentId: 13 }));
      reads.write("sauron", insert({ symbol: "NVDA", entryIntentId: 14 }));

      reads.updateFor("sauron", "NVDA", true);

      expect(
        reads
          .list("sauron", 10)
          .map((r) => r.symbol)
          .sort(),
      ).toEqual(["AAPL", occ].sort());
      expect(reads.closedCount("banker")).toBe(1);
    });
  });

  describe("when listing closed positions", () => {
    it("pages newest first by close time", () => {
      reads.write("sauron", insert({ at: 2_000, realized: 2 }));
      reads.write("sauron", insert({ at: 3_000, realized: 3 }));
      reads.write("sauron", insert({ at: 1_000, realized: 1 }));
      expect(realized()).toEqual([3, 2, 1]);
    });

    it("puts the later-written trip first when two closed at the same instant", () => {
      reads.write("sauron", insert({ at: 2_000, realized: 1 }));
      reads.write("sauron", insert({ at: 2_000, realized: 2 }));
      expect(realized()).toEqual([2, 1]);
    });

    it("returns only the newest `limit` trips", () => {
      for (const at of [1, 2, 3, 4]) reads.write("sauron", insert({ at, realized: at }));
      expect(realized("sauron", 2)).toEqual([4, 3]);
    });

    it("lists only the asked persona's trips", () => {
      reads.write("sauron", insert({ realized: 1 }));
      reads.write("banker", insert({ realized: 2 }));
      expect(realized("banker")).toEqual([2]);
      expect(reads.list("nobody", 10)).toEqual([]);
    });

    it("hands each column back under its record name, keeping a missing exit reason and deltas null", () => {
      reads.write(
        "sauron",
        insert({
          at: 5_000,
          symbol: "AAPL",
          entryIntentId: 7,
          exitReason: null,
          realized: -25.5,
          returnPct: -2.5,
          sentimentDelta: 0.5,
          momentumDelta: null,
        }),
      );
      expect(reads.list("sauron", 1)).toEqual([
        {
          at: 5_000,
          personaId: "sauron",
          symbol: "AAPL",
          entryIntentId: 7,
          exitReason: null,
          realized: -25.5,
          returnPct: -2.5,
          sentimentDelta: 0.5,
          momentumDelta: null,
        },
      ]);
    });
  });

  describe("when counting closed positions", () => {
    it("is zero for a persona with none", () => {
      expect(reads.closedCount("sauron")).toBe(0);
    });

    it("counts every trip the persona holds, share or option, and nobody else's", () => {
      reads.write("sauron", insert({ symbol: "NVDA", entryIntentId: 1 }));
      reads.write("sauron", insert({ symbol: "NVDA261113C00185000", entryIntentId: 2 }));
      reads.write("banker", insert({ entryIntentId: 3 }));
      expect(reads.closedCount("sauron")).toBe(2);
      expect(reads.closedCount("banker")).toBe(1);
    });
  });

  describe("when asking whether the share tape holds a later close", () => {
    beforeEach(() => reads.write("sauron", insert({ at: 1_000, symbol: "NVDA" })));

    it("is true only for a trip that closed strictly after the instant", () => {
      expect(reads.shareScoredAfter("sauron", "NVDA", 999)).toBe(true);
      expect(reads.shareScoredAfter("sauron", "NVDA", 1_000)).toBe(false);
      expect(reads.shareScoredAfter("sauron", "NVDA", 1_001)).toBe(false);
    });

    it("looks at that persona's trips on that symbol only", () => {
      expect(reads.shareScoredAfter("banker", "NVDA", 0)).toBe(false);
      expect(reads.shareScoredAfter("sauron", "AAPL", 0)).toBe(false);
    });

    it("does not read an option trip on the underlying as a share trip", () => {
      reads.write("sauron", insert({ at: 9_000, symbol: "AAPL261113C00185000" }));
      expect(reads.shareScoredAfter("sauron", "AAPL", 0)).toBe(false);
    });
  });

  describe("when summing realized P/L for a playbook", () => {
    const closeUnder = (
      playbookId: string | undefined,
      entry: number,
      exit: number,
      at: number,
    ) => {
      fill({ at, side: "buy", qty: 10, price: entry, ...(playbookId ? { playbookId } : {}) });
      fill({ at: at + 1, side: "sell", qty: 10, price: exit });
      reads.updateFor("sauron", "NVDA");
    };

    it("is zero when nothing has closed under it", () => {
      expect(reads.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(0);
    });

    it("nets wins against losses", () => {
      closeUnder("S1-NVDA", 100, 120, 10); // +200
      closeUnder("S1-NVDA", 100, 95, 20); // -50
      expect(reads.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(150);
    });

    it("can come out negative", () => {
      closeUnder("S1-NVDA", 100, 90, 10);
      expect(reads.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(-100);
    });

    it("attributes a close to the playbook that opened it, whatever tag the exit carried", () => {
      fill({ at: 1, side: "buy", qty: 10, price: 100, playbookId: "S1-NVDA" });
      fill({ at: 2, side: "sell", qty: 10, price: 110, playbookId: "OTHER" });
      reads.updateFor("sauron", "NVDA");
      expect(reads.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(100);
      expect(reads.realizedPlForPlaybook("sauron", "OTHER")).toBe(0);
    });

    it("leaves out an entry no playbook opened and a position still open", () => {
      closeUnder(undefined, 100, 150, 10);
      fill({ at: 30, side: "buy", qty: 10, price: 100, playbookId: "S1-NVDA" });
      reads.updateFor("sauron", "NVDA");
      expect(reads.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(0);
    });

    it("counts only the asked persona's closes", () => {
      closeUnder("S1-NVDA", 100, 120, 10);
      expect(reads.realizedPlForPlaybook("banker", "S1-NVDA")).toBe(0);
    });
  });

  describe("when counting put outcomes", () => {
    const TAG = "crwv-wheel-put";

    /** One put sold under the wheel, closed by `exitReason`. */
    function putClosedBy(exitReason: string | null, over: Partial<Fill> = {}, persona = "sauron") {
      const entry = fill({
        persona,
        at: 100 + orders, // each put is its own decision, at its own instant
        side: "sell",
        qty: 1,
        price: 2,
        playbookId: "CRWV-WHEEL",
        strategy: TAG,
        ...over,
      });
      reads.write(
        persona,
        insert({ symbol: "CRWV270219P00080000", entryIntentId: entry, exitReason }),
      );
    }

    it("counts expiries and assignments as closed, and only assignments as assigned", () => {
      putClosedBy(LIFECYCLE_STATUS.OPEXP);
      putClosedBy(LIFECYCLE_STATUS.OPASN);
      putClosedBy(LIFECYCLE_STATUS.OPASN);
      expect(reads.putOutcomesForPlaybook("sauron", "CRWV-WHEEL", TAG)).toEqual({
        closed: 3,
        assigned: 2,
      });
    });

    it("does not count a put closed any other way, or one with no recorded reason", () => {
      putClosedBy("bought back at 0.40");
      putClosedBy(null);
      putClosedBy(LIFECYCLE_STATUS.OPEXP);
      expect(reads.putOutcomesForPlaybook("sauron", "CRWV-WHEEL", TAG)).toEqual({
        closed: 1,
        assigned: 0,
      });
    });

    it("counts only the asked strategy, playbook and persona", () => {
      putClosedBy(LIFECYCLE_STATUS.OPASN);
      putClosedBy(LIFECYCLE_STATUS.OPASN, { strategy: "crwv-wheel-call" });
      putClosedBy(LIFECYCLE_STATUS.OPASN, { playbookId: "OTHER" });
      putClosedBy(LIFECYCLE_STATUS.OPASN, {}, "banker");
      expect(reads.putOutcomesForPlaybook("sauron", "CRWV-WHEEL", TAG)).toEqual({
        closed: 1,
        assigned: 1,
      });
    });

    it("is zero across the board when no put has closed", () => {
      expect(reads.putOutcomesForPlaybook("sauron", "CRWV-WHEEL", TAG)).toEqual({
        closed: 0,
        assigned: 0,
      });
    });
  });
});
