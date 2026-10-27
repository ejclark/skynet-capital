import { DatabaseSync } from "node:sqlite";
import {
  type ObservationTables,
  openObservationTables,
} from "../../src/autonomous/decision-db-observations.js";
import type {
  DayObservation,
  PlaybookObservation,
  SignalObservation,
} from "../../src/domain/playbook-observation.js";

/**
 * The observation side table on its own (#5489): opened over a bare database, written and read
 * without the decision store around it. `decision-db-observations.spec.ts` covers it riding a
 * decision record; these are the behaviors of the table itself.
 */

const buy = { side: "buy", shares: 10, kind: "market", price: 97.5, why: "dip" } as const;
const signal = (over: Partial<SignalObservation> = {}): SignalObservation => ({
  kind: "signal",
  playbookId: "MU-DIP-BOUNCE",
  symbol: "MU",
  session: "2026-10-02",
  minutes: 700,
  outcome: "buy",
  vwap: 100,
  range: 1,
  entry: buy,
  level: "none",
  worstLevel: "none",
  age: 0,
  ...over,
});
const day = (over: Partial<DayObservation> = {}): DayObservation => ({
  kind: "day",
  playbookId: "MU-DIP-BOUNCE",
  symbol: "MU",
  session: "2026-10-02",
  minutes: 955,
  level: "none",
  reasons: [],
  tiedUp: 0,
  held: 0,
  sold: 0,
  refused: 0,
  wouldBe: [],
  ...over,
});

describe("the observation table, opened over a bare database", () => {
  let db: DatabaseSync;
  let tables: ObservationTables;
  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    tables = openObservationTables(db);
  });
  afterEach(() => db.close());

  describe("when nothing has been written", () => {
    it("reads an empty list for any playbook", () => {
      expect(tables.list("MU-DIP-BOUNCE")).toEqual([]);
    });

    it("treats writing an empty batch as a no-op", () => {
      tables.write(1, []);
      expect(tables.list("MU-DIP-BOUNCE")).toEqual([]);
    });
  });

  describe("when opened again over a table that already holds rows", () => {
    it("keeps the rows: opening creates only what is missing", () => {
      tables.write(1, [signal()]);
      const reopened = openObservationTables(db);
      expect(reopened.list("MU-DIP-BOUNCE")).toEqual([signal()]);
    });
  });

  describe("when several names signal on the same bar", () => {
    it("keeps one row per name, not one per bar", () => {
      tables.write(1, [signal({ symbol: "MU" }), signal({ symbol: "NBIS" })]);
      expect(
        tables
          .list("MU-DIP-BOUNCE")
          .map((o) => o.symbol)
          .sort(),
      ).toEqual(["MU", "NBIS"]);
    });

    it("reads them in a stable order: session, then bar, then symbol", () => {
      tables.write(1, [
        signal({ symbol: "NBIS", minutes: 700 }),
        signal({ symbol: "MU", minutes: 700 }),
        signal({ symbol: "AMD", minutes: 650 }),
        signal({ symbol: "AMD", session: "2026-10-01", minutes: 900 }),
      ]);
      expect(tables.list("MU-DIP-BOUNCE").map((o) => [o.session, o.minutes, o.symbol])).toEqual([
        ["2026-10-01", 900, "AMD"],
        ["2026-10-02", 650, "AMD"],
        ["2026-10-02", 700, "MU"],
        ["2026-10-02", 700, "NBIS"],
      ]);
    });
  });

  describe("when two playbooks observe the same name and bar", () => {
    it("keeps them apart and reads each playbook's own", () => {
      tables.write(1, [signal(), signal({ playbookId: "NBIS-DIP-BOUNCE", outcome: "refused" })]);
      expect(tables.list("MU-DIP-BOUNCE")).toHaveLength(1);
      expect(tables.list("MU-DIP-BOUNCE")[0]).toMatchObject({ outcome: "buy" });
      expect(tables.list("NBIS-DIP-BOUNCE")[0]).toMatchObject({ outcome: "refused" });
    });
  });

  describe("when a signal and a day reading share a session", () => {
    it("keeps both: the kind is part of the row's identity", () => {
      tables.write(1, [signal(), day()]);
      expect(
        tables
          .list("MU-DIP-BOUNCE")
          .map((o) => o.kind)
          .sort(),
      ).toEqual(["day", "signal"]);
    });

    it("lists the day's reading ahead of that session's signals, whatever bar it was read at", () => {
      tables.write(1, [signal({ minutes: 600 }), day({ minutes: 955 })]);
      expect(tables.list("MU-DIP-BOUNCE").map((o) => o.kind)).toEqual(["day", "signal"]);
    });
  });

  describe("when a later pass says a signal again", () => {
    it("takes the newer outcome and the higher worst level, and keeps the earliest quote", () => {
      const first = { bid: 1, ask: 2, last: 1.5, seenAt: 10 };
      tables.write(10, [signal({ worstLevel: "signal", level: "signal", quote: first })]);
      tables.write(20, [
        signal({
          level: "none",
          worstLevel: "none",
          sold: { session: "2026-10-03", minutes: 575, price: 99 },
          quote: { bid: 5, ask: 6, last: 5.5, seenAt: 20 },
        }),
      ]);
      const [only] = tables.list("MU-DIP-BOUNCE");
      expect(tables.list("MU-DIP-BOUNCE")).toHaveLength(1);
      expect(only).toMatchObject({
        level: "none",
        worstLevel: "signal",
        sold: { price: 99 },
        quote: first,
      });
    });

    it("counts the level just read toward the worst, even if the pass left worstLevel lower", () => {
      tables.write(1, [signal()]);
      tables.write(2, [signal({ level: "gate", worstLevel: "none" })]);
      expect(tables.list("MU-DIP-BOUNCE")[0]).toMatchObject({ level: "gate", worstLevel: "gate" });
    });

    it("keeps the first sight's time and moves the updated time on", () => {
      tables.write(10, [signal()]);
      tables.write(20, [signal({ age: 2 })]);
      const row = db.prepare("SELECT first_at, updated_at FROM playbook_observations").get() as {
        first_at: number;
        updated_at: number;
      };
      expect(row).toEqual({ first_at: 10, updated_at: 20 });
    });
  });

  describe("when a later pass reads the day again", () => {
    it("replaces the earlier reading outright, nothing from it carried over", () => {
      tables.write(1, [day({ held: 2, reasons: ["late"], level: "signal" })]);
      tables.write(2, [day({ minutes: 960, held: 0, sold: 2 })]);
      expect(tables.list("MU-DIP-BOUNCE")).toEqual([day({ minutes: 960, held: 0, sold: 2 })]);
    });
  });

  describe("when a stored row's body is corrupt", () => {
    it("heals it: the next pass writes a fresh body over it", () => {
      tables.write(1, [signal()]);
      db.exec("UPDATE playbook_observations SET body_json = '{nope'");
      expect(tables.list("MU-DIP-BOUNCE")).toEqual([]);
      const fresh: PlaybookObservation = signal({ age: 4 });
      tables.write(2, [fresh]);
      expect(tables.list("MU-DIP-BOUNCE")).toEqual([fresh]);
    });
  });

  describe("when reading from a session", () => {
    it("includes that session itself and nothing earlier", () => {
      tables.write(1, [
        signal({ session: "2026-10-01" }),
        signal({ session: "2026-10-02" }),
        signal({ session: "2026-10-03" }),
      ]);
      expect(
        tables.list("MU-DIP-BOUNCE", { fromSession: "2026-10-02" }).map((o) => o.session),
      ).toEqual(["2026-10-02", "2026-10-03"]);
    });

    it("reads nothing when every session is earlier", () => {
      tables.write(1, [signal()]);
      expect(tables.list("MU-DIP-BOUNCE", { fromSession: "2026-11-01" })).toEqual([]);
    });
  });

  describe("when one observation cannot be stored", () => {
    it("does not throw and still writes the ones around it", () => {
      const poison = { ...signal({ minutes: 710 }), vwap: 10n } as unknown as SignalObservation;
      expect(() =>
        tables.write(1, [signal({ minutes: 705 }), poison, signal({ minutes: 715 })]),
      ).not.toThrow();
      expect(tables.list("MU-DIP-BOUNCE").map((o) => o.minutes)).toEqual([705, 715]);
    });
  });
});
