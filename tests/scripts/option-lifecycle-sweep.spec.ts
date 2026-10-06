import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AlpacaAccountActivity } from "../../src/alpaca/alpaca-options-client.js";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import {
  armOptionLifecycleSweep,
  sweepOptionLifecycle,
} from "../../src/scripts/autonomous-option-wiring.js";
import { anOptionIntent } from "../support/builders.js";

// #4642 slice 8: the bots process asks each bot's account what happened to its contracts — an
// expiry or an assignment fills no order, so without this a sold put that expired worthless never
// reached its playbook's realized P/L.

const PUT = "CRWV261106P00085000";
type Read = Awaited<ReturnType<typeof sweepBroker>>;
const sweepBroker = async (rows: readonly AlpacaAccountActivity[]) => ({
  ok: true as const,
  rows: [...rows],
});

const expired: AlpacaAccountActivity = {
  id: "exp-1",
  activity_type: "OPEXP",
  symbol: PUT,
  qty: "1",
  date: "2026-11-06",
};

function capture() {
  const lines: string[] = [];
  return {
    lines,
    logger: {
      log: (line: string) => lines.push(`log ${line}`),
      warn: (line: string) => lines.push(`warn ${line}`),
    },
  };
}

describe("sweepOptionLifecycle", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "option-lifecycle-sweep-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("closes a sold put the broker reports expired, into the wheel's realized P/L", async () => {
    const sold = anOptionIntent();
    db.record({
      at: Date.parse("2026-10-07T14:30:00Z"),
      personaId: "sauron",
      mode: "live",
      rawIntents: [sold],
      guardedIntents: [sold],
      outcomes: [
        {
          intent: sold,
          action: "placed",
          result: {
            intent: sold,
            status: "filled",
            orderId: "o-1",
            filledQuantity: 1,
            filledPrice: 2.05,
          },
        },
      ],
    });
    const { lines, logger } = capture();
    const brokers = new Map([["sauron", { readOptionLifecycle: () => sweepBroker([expired]) }]]);

    await sweepOptionLifecycle(brokers, db, logger);
    await sweepOptionLifecycle(brokers, db, logger); // the same page again records nothing new

    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);
    expect(lines).toEqual(["log [options] sauron: recorded 1 new expiry/assignment report(s)"]);
  });

  it("drops a row it cannot read, and keeps going past a bot whose read failed", async () => {
    const recorded: [string, number][] = [];
    const store = {
      recordOptionLifecycle: (personaId: string, activities: readonly unknown[]) => {
        recorded.push([personaId, activities.length]);
        return 0;
      },
    };
    const { lines, logger } = capture();
    const brokers = new Map<string, { readOptionLifecycle: () => Promise<Read | { ok: false }> }>([
      ["down", { readOptionLifecycle: async () => ({ ok: false }) }],
      ["throws", { readOptionLifecycle: () => Promise.reject(new Error("socket hang up")) }],
      [
        "sauron",
        { readOptionLifecycle: () => sweepBroker([expired, { id: "x", activity_type: "FILL" }]) },
      ],
    ]);

    await sweepOptionLifecycle(brokers, store, logger);

    expect(recorded).toEqual([["sauron", 1]]);
    expect(lines).toEqual([
      "warn [options] down: option expiry/assignment read failed — next pass retries",
      "warn [options] throws: option lifecycle sweep failed — Error: socket hang up",
    ]);
  });

  it("stays dark with no decision store — nowhere to score a report, so nothing is read", () => {
    let reads = 0;
    const read = () => {
      reads += 1;
      return sweepBroker([]);
    };
    const brokers = new Map([["sauron", { readOptionLifecycle: read }]]);
    expect(armOptionLifecycleSweep(brokers, undefined)).toBeUndefined();
    expect(reads).toBe(0);
  });

  it("runs at boot and then on its own clock, never two passes at once", async () => {
    rstest.useFakeTimers();
    try {
      let reads = 0;
      let release: () => void = () => undefined;
      const brokers = new Map([
        [
          "sauron",
          {
            readOptionLifecycle: () => {
              reads += 1;
              return new Promise<Read>((resolve) => {
                release = () => resolve({ ok: true, rows: [] });
              });
            },
          },
        ],
      ]);
      const timer = armOptionLifecycleSweep(brokers, db, capture().logger, 1_000);
      expect(reads).toBe(1);
      rstest.advanceTimersByTime(1_000); // the boot pass is still reading
      expect(reads).toBe(1);
      release();
      await rstest.advanceTimersByTimeAsync(1_000);
      expect(reads).toBe(2);
      clearInterval(timer);
    } finally {
      rstest.useRealTimers();
    }
  });
});
