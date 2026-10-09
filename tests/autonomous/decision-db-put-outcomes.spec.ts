import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * The wheel's retire test (#4469 criterion 12) counts sold puts by how they ended: the expiry or
 * assignment report closes a contract at $0, and only those reports say whether the put finished
 * in the money. A put bought back early is neither; neither is one still open.
 */

const T0 = Date.parse("2027-01-05T15:00:00.000Z");
const TAG = "crwv-wheel-put";

describe("DecisionDb.putOutcomesForPlaybook", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-puts-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /** One filled put sold at `strike`, recorded as its own decision `n` hours after T0. */
  function sellPut(
    n: number,
    strike: number,
    overrides: { strategy?: string; playbookId?: string } = {},
  ) {
    const occ = buildOccSymbol({
      underlying: "CRWV",
      expiration: "2027-02-19",
      type: "put",
      strike,
    });
    const intent = anOptionIntent({
      strategy: overrides.strategy ?? TAG,
      playbookId: overrides.playbookId ?? "CRWV-WHEEL",
      option: { legs: [{ occSymbol: occ, side: "sell", ratio: 1 }], limitPrice: 2.3 },
    });
    const submitted = { ...intent, clientOrderId: `sk1-sauron-CRWV-k9x2-${n}` };
    db.record({
      at: T0 + n * 3_600_000,
      personaId: "sauron",
      mode: "live",
      rawIntents: [intent],
      guardedIntents: [intent],
      outcomes: [
        {
          intent: submitted,
          action: "placed",
          result: { intent: submitted, status: "working", reason: "resting", orderId: `ord-${n}` },
        },
      ],
    });
    db.recordSettlements([
      {
        orderId: `ord-${n}`,
        clientOrderId: submitted.clientOrderId,
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.3,
        legs: [{ occSymbol: occ, filledQuantity: 1, filledPrice: 2.3 }],
        settledAt: new Date(T0 + n * 3_600_000 + 60_000).toISOString(),
      },
    ]);
    return occ;
  }
  const end = (id: string, type: "OPEXP" | "OPASN", occ: string) =>
    db.recordOptionLifecycle("sauron", [
      { id, type, symbol: occ, quantity: 1, at: "2027-02-19T23:59:59.999Z" },
    ]);

  it("counts the sold puts the reports ended and how many finished in the money", () => {
    end("a1", "OPEXP", sellPut(1, 80));
    end("a2", "OPASN", sellPut(2, 85));
    end("a3", "OPEXP", sellPut(3, 75));
    expect(db.putOutcomesForPlaybook("sauron", "CRWV-WHEEL", TAG)).toEqual({
      closed: 3,
      assigned: 1,
    });
  });

  it("leaves an open put out: it has not finished", () => {
    sellPut(1, 80);
    expect(db.putOutcomesForPlaybook("sauron", "CRWV-WHEEL", TAG)).toEqual({
      closed: 0,
      assigned: 0,
    });
  });

  it("counts only the asked tag, playbook and persona", () => {
    end("a1", "OPASN", sellPut(1, 80));
    end("a2", "OPEXP", sellPut(2, 85, { strategy: "crwv-wheel-call" }));
    end("a3", "OPEXP", sellPut(3, 75, { playbookId: "OTHER" }));
    expect(db.putOutcomesForPlaybook("sauron", "CRWV-WHEEL", TAG)).toEqual({
      closed: 1,
      assigned: 1,
    });
    expect(db.putOutcomesForPlaybook("banker", "CRWV-WHEEL", TAG)).toEqual({
      closed: 0,
      assigned: 0,
    });
  });
});
