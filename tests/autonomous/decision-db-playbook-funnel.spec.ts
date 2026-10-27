import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import {
  type FunnelIntentGroupRow,
  openPlaybookFunnelReads,
  type PlaybookFunnelReads,
} from "../../src/autonomous/decision-db-playbook-funnel.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, PlaybookVerdict } from "../../src/domain/types.js";

/**
 * The playbook funnel's raw rows (#4450 slice 5a): every bot's checks and playbook intents in
 * `[from, to)`, grouped by playbook and UTC hour. `playbook-funnel.spec.ts` covers the fold that
 * turns these into sessions; this spec holds the rows themselves — the window's edges, the hour
 * bucket, what counts as a check and a signal, and how an intent's fate is grouped.
 */

const HOUR = 3_600_000;
const T0 = Date.parse("2026-10-12T13:30:00Z");
const hourOf = (at: number) => Math.floor(at / HOUR);

const intent = (over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
  playbookId: "S1-NVDA",
  playbookMode: "standard",
  ...over,
});

const verdict = (
  playbookId: string,
  mode = "standard",
  state: PlaybookVerdict["state"] = "no-window",
): PlaybookVerdict => ({ playbookId, mode, state }) as PlaybookVerdict;

function pass(
  at: number,
  over: Partial<DecisionRecord> & {
    readonly verdicts?: readonly PlaybookVerdict[];
  } = {},
): DecisionRecord {
  const { verdicts = [], ...rest } = over;
  const outcomes = rest.outcomes ?? [];
  const guarded = outcomes.map((o) => o.intent);
  const refused = (rest.refusals ?? []).map((r) => r.intent);
  return {
    at,
    personaId: "sauron",
    mode: "live",
    rawIntents: [...guarded, ...refused],
    guardedIntents: guarded,
    outcomes,
    ...(verdicts.length ? { playbookVerdicts: verdicts } : {}),
    ...rest,
  };
}

const filled = { status: "filled" } as never;

describe("openPlaybookFunnelReads", () => {
  let dir: string;
  let store: DecisionDb;
  let reader: DatabaseSync;
  let funnel: PlaybookFunnelReads;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-playbook-funnel-"));
    const path = join(dir, "decisions.db");
    store = openDecisionDb(path); // the real write path creates the schema and the rows
    reader = new DatabaseSync(path, { readOnly: true });
    funnel = openPlaybookFunnelReads(reader);
  });
  afterEach(() => {
    reader.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const wide = () => funnel.read(T0 - 100 * HOUR, T0 + 100 * HOUR);
  const total = (rows: readonly { readonly n: number }[]) => rows.reduce((sum, r) => sum + r.n, 0);

  describe("when the store holds nothing", () => {
    it("reads no checks and no intents", () => {
      expect(wide()).toEqual({ checks: [], intents: [] });
    });
  });

  describe("when a pass consulted playbooks", () => {
    it("counts a pass once even when the playbook is armed in two modes", () => {
      store.record(
        pass(T0, {
          verdicts: [verdict("S1-NVDA"), verdict("S1-NVDA", "aggressive")],
        }),
      );
      expect(wide().checks).toEqual([
        { hour: hourOf(T0), playbookId: "S1-NVDA", n: 1, signals: 0 },
      ]);
    });

    it("reports a playbook as a signal only when its verdict was long", () => {
      store.record(pass(T0, { verdicts: [verdict("S1-NVDA", "standard", "no-window")] }));
      store.record(pass(T0 + 1, { verdicts: [verdict("S1-NVDA", "standard", "long")] }));
      expect(wide().checks).toEqual([
        { hour: hourOf(T0), playbookId: "S1-NVDA", n: 2, signals: 1 },
      ]);
    });

    it("counts a pass as one signal when long in any mode, and when long in more than one", () => {
      store.record(
        pass(T0, {
          verdicts: [
            verdict("S1-NVDA", "standard", "no-window"),
            verdict("S1-NVDA", "aggressive", "long"),
          ],
        }),
      );
      store.record(
        pass(T0 + 1, {
          verdicts: [
            verdict("S1-NVDA", "standard", "long"),
            verdict("S1-NVDA", "aggressive", "long"),
          ],
        }),
      );
      expect(wide().checks).toEqual([
        { hour: hourOf(T0), playbookId: "S1-NVDA", n: 2, signals: 2 },
      ]);
    });

    it("keeps each playbook's checks on its own row", () => {
      store.record(
        pass(T0, {
          verdicts: [verdict("S1-NVDA"), verdict("G1-GOOG", "standard", "long")],
        }),
      );
      expect(wide().checks).toEqual(
        expect.arrayContaining([
          { hour: hourOf(T0), playbookId: "S1-NVDA", n: 1, signals: 0 },
          { hour: hourOf(T0), playbookId: "G1-GOOG", n: 1, signals: 1 },
        ]),
      );
      expect(wide().checks).toHaveLength(2);
    });

    it("pools every bot's passes into one playbook's funnel", () => {
      store.record(pass(T0, { verdicts: [verdict("S1-NVDA")] }));
      store.record(pass(T0, { personaId: "wheeler", verdicts: [verdict("S1-NVDA")] }));
      store.record(
        pass(T0, {
          personaId: "gandalf",
          verdicts: [verdict("S1-NVDA", "standard", "long")],
        }),
      );
      expect(wide().checks).toEqual([
        { hour: hourOf(T0), playbookId: "S1-NVDA", n: 3, signals: 1 },
      ]);
    });

    it("leaves a pass that consulted no playbook out of the checks", () => {
      store.record(pass(T0));
      expect(wide().checks).toEqual([]);
    });
  });

  describe("when passes land in different hours", () => {
    it("buckets each by floor(at / one hour) since the epoch", () => {
      const base = Date.parse("2026-10-12T14:00:00Z"); // an exact hour boundary
      store.record(pass(base - 1, { verdicts: [verdict("S1-NVDA")] }));
      store.record(pass(base, { verdicts: [verdict("S1-NVDA")] }));
      store.record(pass(base + HOUR - 1, { verdicts: [verdict("S1-NVDA")] }));
      const byHour = new Map(wide().checks.map((r) => [r.hour, r.n]));
      expect(byHour).toEqual(
        new Map([
          [hourOf(base) - 1, 1],
          [hourOf(base), 2],
        ]),
      );
    });

    it("gives the same hour a separate intent row per playbook", () => {
      store.record(
        pass(T0, {
          outcomes: [
            { intent: intent(), action: "placed", result: filled },
            {
              intent: intent({ playbookId: "G1-GOOG", symbol: "GOOG" }),
              action: "placed",
              result: filled,
            },
          ],
        }),
      );
      const rows = wide().intents;
      expect(rows.map((r) => r.playbookId).sort()).toEqual(["G1-GOOG", "S1-NVDA"]);
      expect(new Set(rows.map((r) => r.hour))).toEqual(new Set([hourOf(T0)]));
    });
  });

  describe("the window [from, to)", () => {
    beforeEach(() => {
      for (const at of [T0 - 1, T0, T0 + HOUR - 1, T0 + HOUR]) {
        store.record(
          pass(at, {
            verdicts: [verdict("S1-NVDA")],
            outcomes: [{ intent: intent(), action: "placed", result: filled }],
          }),
        );
      }
    });
    const checksIn = (from: number, to: number) => total(funnel.read(from, to).checks);
    const intentsIn = (from: number, to: number) => total(funnel.read(from, to).intents);

    it("includes a decision made exactly at `from`", () => {
      expect(checksIn(T0, T0 + 1)).toBe(1);
      expect(intentsIn(T0, T0 + 1)).toBe(1);
    });

    it("excludes a decision made exactly at `to`", () => {
      expect(checksIn(T0 - 1, T0)).toBe(1); // only T0 - 1, not T0
      expect(intentsIn(T0 - 1, T0)).toBe(1);
    });

    it("reads only what falls inside it", () => {
      expect(checksIn(T0, T0 + HOUR)).toBe(2);
      expect(intentsIn(T0, T0 + HOUR)).toBe(2);
    });

    it("reads nothing from an empty or inverted window", () => {
      expect(funnel.read(T0, T0)).toEqual({ checks: [], intents: [] });
      expect(funnel.read(T0 + HOUR, T0)).toEqual({ checks: [], intents: [] });
    });

    it("answers each read on its own window, so one reader serves many windows", () => {
      expect(checksIn(T0 - 1, T0)).toBe(1);
      expect(checksIn(T0, T0 + 2 * HOUR)).toBe(3);
      expect(checksIn(T0 - 1, T0)).toBe(1);
    });
  });

  describe("when a playbook raised intents", () => {
    const find = (
      rows: readonly FunnelIntentGroupRow[],
      pred: (r: FunnelIntentGroupRow) => boolean,
    ) => rows.find(pred);

    it("groups a refused intent by the rule that refused it", () => {
      store.record(
        pass(T0, {
          refusals: [{ intent: intent({ quantity: 60 }), reason: "s2-print" }],
        }),
      );
      expect(wide().intents).toEqual([
        {
          hour: hourOf(T0),
          playbookId: "S1-NVDA",
          guardReason: "s2-print",
          action: null,
          resultStatus: null,
          n: 1,
        },
      ]);
    });

    it("groups a placed intent by its action and the broker's status", () => {
      store.record(
        pass(T0, {
          outcomes: [
            {
              intent: intent(),
              action: "placed",
              result: { status: "accepted" } as never,
            },
          ],
        }),
      );
      expect(wide().intents).toEqual([
        {
          hour: hourOf(T0),
          playbookId: "S1-NVDA",
          guardReason: null,
          action: "placed",
          resultStatus: "accepted",
          n: 1,
        },
      ]);
    });

    it("collapses intents with the same fate into one counted row and splits differing fates", () => {
      store.record(
        pass(T0, {
          outcomes: [
            { intent: intent(), action: "placed", result: filled },
            {
              intent: intent({ symbol: "AMD" }),
              action: "placed",
              result: filled,
            },
            {
              intent: intent({ symbol: "AVGO" }),
              action: "placed",
              result: { status: "rejected" } as never,
            },
            { intent: intent({ symbol: "MU" }), action: "observed" },
          ],
        }),
      );
      const rows = wide().intents;
      expect(rows).toHaveLength(3);
      expect(find(rows, (r) => r.resultStatus === "filled")?.n).toBe(2);
      expect(find(rows, (r) => r.resultStatus === "rejected")?.n).toBe(1);
      expect(find(rows, (r) => r.action === "observed")).toMatchObject({
        guardReason: null,
        resultStatus: null,
        n: 1,
      });
    });

    it("keeps different refusal reasons apart", () => {
      store.record(
        pass(T0, {
          refusals: [
            { intent: intent(), reason: "s2-print" },
            { intent: intent({ symbol: "AMD" }), reason: "e1-open" },
            { intent: intent({ symbol: "MU" }), reason: "s2-print" },
          ],
        }),
      );
      const rows = wide().intents;
      expect(find(rows, (r) => r.guardReason === "s2-print")?.n).toBe(2);
      expect(find(rows, (r) => r.guardReason === "e1-open")?.n).toBe(1);
    });

    it("pools every bot's intents on a playbook run by more than one", () => {
      const placed = [{ intent: intent(), action: "placed" as const, result: filled }];
      store.record(pass(T0, { outcomes: placed }));
      store.record(pass(T0, { personaId: "wheeler", outcomes: placed }));
      expect(wide().intents).toEqual([
        {
          hour: hourOf(T0),
          playbookId: "S1-NVDA",
          guardReason: null,
          action: "placed",
          resultStatus: "filled",
          n: 2,
        },
      ]);
    });

    it("leaves out an intent that carries no playbook id — a bot's own rules", () => {
      store.record(
        pass(T0, {
          outcomes: [
            {
              intent: intent({
                playbookId: undefined,
                playbookMode: undefined,
              }),
              action: "placed",
              result: filled,
            },
          ],
        }),
      );
      expect(wide().intents).toEqual([]);
    });

    it("does not multiply an intent by the modes its playbook was checked in", () => {
      store.record(
        pass(T0, {
          verdicts: [verdict("S1-NVDA"), verdict("S1-NVDA", "aggressive")],
          outcomes: [{ intent: intent(), action: "placed", result: filled }],
        }),
      );
      const { checks, intents } = wide();
      expect(checks[0]?.n).toBe(1);
      expect(intents).toHaveLength(1);
      expect(intents[0]?.n).toBe(1);
    });
  });

  describe("when a working order later settled", () => {
    const working = (orderId: string, symbol = "NVDA") => ({
      intent: intent({ symbol }),
      action: "placed" as const,
      result: { status: "working", orderId } as never,
    });
    const settlement = (orderId: string, status: "filled" | "unfilled" | "rejected") => ({
      orderId,
      status,
      filledQuantity: status === "filled" ? 10 : 0,
      settledAt: new Date(T0 + 60_000).toISOString(),
    });

    it("reads the settled status in place of working", () => {
      store.record(pass(T0, { outcomes: [working("o-1")] }));
      store.recordSettlements([settlement("o-1", "filled")]);
      expect(wide().intents).toEqual([
        {
          hour: hourOf(T0),
          playbookId: "S1-NVDA",
          guardReason: null,
          action: "placed",
          resultStatus: "filled",
          n: 1,
        },
      ]);
    });

    it("reads a working order nothing has settled as still working", () => {
      store.record(pass(T0, { outcomes: [working("o-2")] }));
      expect(wide().intents[0]?.resultStatus).toBe("working");
    });

    it("reads an order that ended with nothing filled as the settlement says", () => {
      store.record(pass(T0, { outcomes: [working("o-3")] }));
      store.recordSettlements([settlement("o-3", "rejected")]);
      expect(wide().intents[0]?.resultStatus).toBe("rejected");
    });

    it("settles each order on its own, counting only the ones that ended", () => {
      store.record(
        pass(T0, {
          outcomes: [working("o-4"), working("o-5", "AMD"), working("o-6", "MU")],
        }),
      );
      store.recordSettlements([settlement("o-4", "filled"), settlement("o-5", "unfilled")]);
      const byStatus = Object.fromEntries(wide().intents.map((r) => [r.resultStatus, r.n]));
      expect(byStatus).toEqual({ filled: 1, unfilled: 1, working: 1 });
    });

    it("counts a settlement once even when the same order is settled twice", () => {
      store.record(pass(T0, { outcomes: [working("o-7")] }));
      store.recordSettlements([settlement("o-7", "filled")]);
      store.recordSettlements([settlement("o-7", "filled")]);
      expect(total(wide().intents)).toBe(1);
    });

    it("leaves an order that settled on time as it was written", () => {
      store.record(
        pass(T0, {
          outcomes: [
            {
              intent: intent(),
              action: "placed",
              result: { status: "filled", orderId: "o-8" } as never,
            },
          ],
        }),
      );
      store.recordSettlements([settlement("o-8", "rejected")]); // only a working result joins one
      expect(wide().intents[0]?.resultStatus).toBe("filled");
    });
  });
});
