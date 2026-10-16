import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type {
  DayObservation,
  PlaybookObservation,
  SignalObservation,
} from "../../src/domain/playbook-observation.js";

/**
 * Where the dark run is kept (#5489): beside the playbook verdicts in the bots' decision store, one
 * row per signal, merged when a later pass says it again, so thirty observed days can be scored.
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
  exit: { side: "sell", shares: 10, kind: "resting", price: 98.5, why: "target" },
  level: "none",
  worstLevel: "none",
  age: 0,
  quote: { bid: 97.4, ask: 97.6, last: 97.5, seenAt: 1_000 },
  ...over,
});
const dayReading = (over: Partial<DayObservation> = {}): DayObservation => ({
  kind: "day",
  playbookId: "MU-DIP-BOUNCE",
  symbol: "MU",
  session: "2026-10-02",
  minutes: 955,
  level: "none",
  reasons: [],
  tiedUp: 0,
  held: 0,
  sold: 1,
  refused: 0,
  wouldBe: [],
  ...over,
});

const decision = (at: number, playbookObservations?: readonly PlaybookObservation[]) =>
  ({
    at,
    personaId: "sauron",
    mode: "observe",
    rawIntents: [],
    guardedIntents: [],
    outcomes: [],
    playbookVerdicts: [{ playbookId: "MU-DIP-BOUNCE", mode: "standard", state: "observing" }],
    ...(playbookObservations ? { playbookObservations } : {}),
  }) satisfies DecisionRecord;

describe("the decision store keeps what the dark playbooks would have done", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-observations-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes a decision's observations and reads them back by playbook, oldest session first", () => {
    db.record(
      decision(2_000, [
        signal({ session: "2026-10-05", minutes: 650 }),
        signal(),
        dayReading(),
        signal({ playbookId: "NBIS-DIP-BOUNCE", symbol: "NBIS" }),
      ]),
    );
    const mu = db.playbookObservations("MU-DIP-BOUNCE");
    expect(mu.map((o) => [o.kind, o.session, o.minutes])).toEqual([
      ["day", "2026-10-02", 955],
      ["signal", "2026-10-02", 700],
      ["signal", "2026-10-05", 650],
    ]);
    expect(mu[1]).toEqual(signal());
    expect(db.playbookObservations("NBIS-DIP-BOUNCE")).toHaveLength(1);
    expect(db.playbookObservations("S1-NVDA")).toEqual([]);
  });

  it("bounds a read to the sessions from a date on — the thirty-day window a scorer asks for", () => {
    db.record(
      decision(1, [signal(), signal({ session: "2026-10-05" }), signal({ session: "2026-10-09" })]),
    );
    expect(
      db.playbookObservations("MU-DIP-BOUNCE", { fromSession: "2026-10-05" }).map((o) => o.session),
    ).toEqual(["2026-10-05", "2026-10-09"]);
  });

  it("merges when a later pass says a signal again: the outcome moves on, the first quote stays", () => {
    db.record(decision(1_000, [signal()]));
    db.record(
      decision(2_000, [
        signal({
          level: "signal",
          worstLevel: "signal",
          age: 3,
          quote: { bid: 90, ask: 91, last: 90.5, seenAt: 99_000 },
        }),
      ]),
    );
    const [only] = db.playbookObservations("MU-DIP-BOUNCE");
    expect(db.playbookObservations("MU-DIP-BOUNCE")).toHaveLength(1);
    expect(only).toMatchObject({ level: "signal", age: 3 });
    expect((only as SignalObservation).quote).toEqual({
      bid: 97.4,
      ask: 97.6,
      last: 97.5,
      seenAt: 1_000,
    });
  });

  it("keeps the worst level a signal reached even if a later pass reads a lower one", () => {
    db.record(decision(1, [signal({ level: "gate", worstLevel: "gate", age: 5 })]));
    db.record(
      decision(2, [
        signal({
          level: "none",
          worstLevel: "none",
          sold: { session: "2026-10-09", minutes: 570, price: 99 },
        }),
      ]),
    );
    expect(db.playbookObservations("MU-DIP-BOUNCE")[0]).toMatchObject({
      level: "none",
      worstLevel: "gate",
      sold: { price: 99 },
    });
  });

  it("takes a signal found with no quote and still keeps the one a later pass brings", () => {
    db.record(decision(1, [signal({ quote: undefined })]));
    db.record(decision(2, [signal()]));
    expect((db.playbookObservations("MU-DIP-BOUNCE")[0] as SignalObservation).quote?.seenAt).toBe(
      1_000,
    );
  });

  it("keeps one reading per name per session: each newer bar replaces the last", () => {
    db.record(decision(1, [dayReading({ minutes: 950, held: 1, sold: 0 })]));
    db.record(decision(2, [dayReading({ minutes: 955, held: 0, sold: 1 })]));
    db.record(decision(3, [dayReading({ session: "2026-10-05", minutes: 600 })]));
    const days = db.playbookObservations("MU-DIP-BOUNCE");
    expect(days.map((d) => [d.session, d.minutes])).toEqual([
      ["2026-10-02", 955],
      ["2026-10-05", 600],
    ]);
    expect(days[0]).toMatchObject({ held: 0, sold: 1 });
  });

  it("is idempotent: the same decision recorded twice leaves one row", () => {
    db.record(decision(1, [signal()]));
    db.record(decision(1, [signal()]));
    expect(db.playbookObservations("MU-DIP-BOUNCE")).toHaveLength(1);
  });

  it("records observations even when the decision itself was already stored", () => {
    db.record(decision(1));
    db.record(decision(1, [signal()]));
    expect(db.playbookObservations("MU-DIP-BOUNCE")).toHaveLength(1);
  });

  it("leaves a decision with no observations exactly as it was, verdict included", () => {
    db.record(decision(1));
    expect(db.playbookObservations("MU-DIP-BOUNCE")).toEqual([]);
    expect(db.listByPersona("sauron")[0]?.playbookVerdicts).toEqual([
      { playbookId: "MU-DIP-BOUNCE", mode: "standard", state: "observing" },
    ]);
  });

  it("does not put observations on the record it reads back, so they never reach the wire", () => {
    db.record(decision(1, [signal()]));
    expect(db.listByPersona("sauron")[0]).not.toHaveProperty("playbookObservations");
  });

  it("never costs the decision: a row it cannot write is skipped, the decision is kept", () => {
    db.record(decision(1, [signal()]));
    // A signal whose body cannot be stored (a BigInt does not serialise) must not throw.
    const poison = signal({ minutes: 710 }) as unknown as Record<string, unknown>;
    poison.vwap = 10n;
    expect(() =>
      db.record(decision(2, [poison as unknown as SignalObservation, signal({ minutes: 715 })])),
    ).not.toThrow();
    expect(db.listByPersona("sauron")).toHaveLength(2);
    expect(db.playbookObservations("MU-DIP-BOUNCE").map((o) => o.minutes)).toEqual([700, 715]);
  });

  it("skips a row whose stored body is corrupt rather than failing the read", () => {
    db.record(decision(1, [signal(), signal({ minutes: 705 })]));
    const raw = new DatabaseSync(join(dir, "decisions.db"));
    raw.exec("UPDATE playbook_observations SET body_json = '{nope' WHERE minutes = 700");
    raw.close();
    expect(db.playbookObservations("MU-DIP-BOUNCE").map((o) => o.minutes)).toEqual([705]);
  });

  it("reaches a database that already exists: the table is created on open, not by a migration", () => {
    db.close();
    const raw = new DatabaseSync(join(dir, "decisions.db"));
    raw.exec("DROP TABLE playbook_observations");
    raw.close();
    db = openDecisionDb(join(dir, "decisions.db"));
    db.record(decision(1, [signal()]));
    expect(db.playbookObservations("MU-DIP-BOUNCE")).toHaveLength(1);
  });
});
