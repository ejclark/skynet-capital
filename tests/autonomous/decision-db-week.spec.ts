import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, PlaybookVerdict } from "../../src/domain/types.js";

/**
 * A bot's week of checks, read from the store (#5073 slice 2) — every pass, never a page: the
 * strip measures gaps between passes, so a read that stopped at the hundredth would invent one.
 */

const BUCKET = 30 * 60_000;
const MON = Date.parse("2026-10-05T13:30:00Z"); // Mon 9:30 AM New York

const intent = (over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
  ...over,
});

function pass(
  at: number,
  verdicts: readonly PlaybookVerdict[] = [],
  outcomes: DecisionRecord["outcomes"] = [],
  personaId = "sauron",
): DecisionRecord {
  const intents = outcomes.map((o) => o.intent);
  return {
    at,
    personaId,
    mode: "live",
    rawIntents: intents,
    guardedIntents: intents,
    outcomes,
    ...(verdicts.length ? { playbookVerdicts: verdicts } : {}),
  };
}

describe("DecisionDb.checkWeek", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-week-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("returns every pass in the window, oldest first, past any page size", () => {
    for (let i = 0; i < 250; i++) db.record(pass(MON + i * 15_000));
    db.record(pass(MON - 1)); // before the window
    db.record(pass(MON + 250 * 15_000, [], [], "beta-scout")); // another bot
    const week = db.checkWeek("sauron", MON, MON + 7 * 86_400_000, BUCKET);
    expect(week.checks).toHaveLength(250);
    expect(week.checks[0]).toBe(MON);
    expect(week.checks[249]).toBe(MON + 249 * 15_000);
  });

  it("groups each playbook's answers by half hour, counted", () => {
    const noWindow = { playbookId: "S1-NVDA", mode: "standard", state: "no-window" } as const;
    const long = { playbookId: "S1-NVDA", mode: "standard", state: "long" } as const;
    db.record(pass(MON, [noWindow]));
    db.record(pass(MON + 15_000, [noWindow]));
    db.record(pass(MON + 30_000, [long]));
    db.record(pass(MON + BUCKET, [long]));
    const { verdicts } = db.checkWeek("sauron", MON, MON + 2 * BUCKET, BUCKET);
    const first = Math.floor(MON / BUCKET);
    expect(
      [...verdicts].sort((a, b) => a.bucket - b.bucket || a.state.localeCompare(b.state)),
    ).toEqual([
      { bucket: first, playbookId: "S1-NVDA", mode: "standard", state: "long", n: 1 },
      { bucket: first, playbookId: "S1-NVDA", mode: "standard", state: "no-window", n: 2 },
      { bucket: first + 1, playbookId: "S1-NVDA", mode: "standard", state: "long", n: 1 },
    ]);
  });

  it("returns the trades the broker took, with the playbook that placed them", () => {
    const sold = intent({
      symbol: "CRWV",
      side: "sell",
      playbookId: "CRWV-WHEEL",
      playbookMode: "aggressive",
    });
    db.record(
      pass(
        MON + 60_000,
        [],
        [{ intent: sold, action: "placed", result: { status: "filled", orderId: "o1" } as never }],
      ),
    );
    db.record(
      pass(
        MON + 120_000,
        [],
        [
          { intent: intent(), action: "rejected", result: { status: "rejected" } as never },
          { intent: intent({ symbol: "GOOG" }), action: "observed" },
        ],
      ),
    );
    expect(db.checkWeek("sauron", MON, MON + BUCKET, BUCKET).trades).toEqual([
      {
        at: MON + 60_000,
        symbol: "CRWV",
        side: "sell",
        playbookId: "CRWV-WHEEL",
        mode: "aggressive",
      },
    ]);
  });
});
