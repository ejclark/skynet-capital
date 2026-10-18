import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord, IntentOutcome } from "../../src/autonomous/decision-record.js";
import {
  funnelSessions,
  funnelWindow,
  playbookFunnelView,
} from "../../src/autonomous/playbook-funnel.js";
import type { OrderIntent, PlaybookVerdict } from "../../src/domain/types.js";
import { readHouseFunnel } from "../../src/scripts/dashboard-insights-bridge.js";

/**
 * Each playbook's funnel over its last ten sessions (#4450 slice 5a, EARS 5): checks → asked →
 * refused → placed → filled, per playbook and per session, read from the decision store and
 * pooled across every bot.
 */

const MON = Date.parse("2026-10-12T13:30:00Z"); // Mon 9:30 AM New York
const DAY = 86_400_000;
const NOW = new Date("2026-10-16T20:30:00Z"); // Fri 4:30 PM New York

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

const verdict = (playbookId: string, mode = "standard"): PlaybookVerdict =>
  ({ playbookId, mode, state: "no-window" }) as PlaybookVerdict;

function pass(
  at: number,
  over: Partial<DecisionRecord> & { readonly verdicts?: readonly PlaybookVerdict[] } = {},
): DecisionRecord {
  const { verdicts = [], ...rest } = over;
  const outcomes: readonly IntentOutcome[] = rest.outcomes ?? [];
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

describe("the playbook funnel's sessions", () => {
  it("is the ten newest sessions up to today, oldest first, weekends skipped", () => {
    const sessions = funnelSessions(NOW);
    expect(sessions).toHaveLength(10);
    expect(sessions[9]).toBe("2026-10-16");
    expect(sessions[0]).toBe("2026-10-05");
    expect(sessions).not.toContain("2026-10-10");
  });

  it("ends on the last session when today is a weekend", () => {
    expect(funnelSessions(new Date("2026-10-18T15:00:00Z")).at(-1)).toBe("2026-10-16");
  });

  it("asks the store from before New York's midnight on the oldest session to now", () => {
    const { from, to } = funnelWindow(["2026-10-05", "2026-10-16"], NOW);
    expect(from).toBe(Date.parse("2026-10-05T00:00:00Z"));
    expect(to).toBeGreaterThan(NOW.getTime());
  });
});

describe("DecisionDb.playbookFunnel, folded by session", () => {
  let dir: string;
  let db: DecisionDb;
  const sessions = funnelSessions(NOW);
  const read = () => {
    const { from, to } = funnelWindow(sessions, NOW);
    return playbookFunnelView(db.playbookFunnel(from, to), sessions);
  };
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "playbook-funnel-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("counts each pass that consulted a playbook once, across every bot", () => {
    db.record(pass(MON, { verdicts: [verdict("S1-NVDA"), verdict("S1-NVDA", "aggressive")] }));
    db.record(pass(MON + 15_000, { verdicts: [verdict("S1-NVDA")] }));
    db.record(pass(MON, { personaId: "wheeler", verdicts: [verdict("S1-NVDA")] }));
    const s1 = read().playbooks.find((p) => p.playbookId === "S1-NVDA");
    expect(s1?.totals.checks).toBe(3);
    expect(s1?.days.find((d) => d.date === "2026-10-12")?.checks).toBe(3);
  });

  it("walks a playbook's intents through asked, refused, placed and filled", () => {
    db.record(
      pass(MON + DAY, {
        verdicts: [verdict("S1-NVDA")],
        outcomes: [
          { intent: intent(), action: "placed", result: { status: "filled" } as never },
          {
            intent: intent({ symbol: "AMD" }),
            action: "placed",
            result: { status: "accepted" } as never,
          },
        ],
        refusals: [{ intent: intent({ quantity: 60 }), reason: "s2-print" }],
      }),
    );
    const s1 = read().playbooks[0];
    expect(s1?.totals).toEqual({ checks: 1, asked: 3, refused: 1, placed: 2, filled: 1 });
    expect(s1?.refusalsByReason).toEqual({ "s2-print": 1 });
    expect(s1?.askedOn).toBe(1);
  });

  it("gives every session a day, zeros included, so asked-on is out of all ten", () => {
    db.record(pass(MON, { verdicts: [verdict("S1-NVDA")] }));
    const s1 = read().playbooks[0];
    expect(s1?.days.map((d) => d.date)).toEqual(sessions);
    expect(s1?.days.filter((d) => d.checks === 0)).toHaveLength(9);
    expect(s1?.askedOn).toBe(0);
  });

  it("puts an after-close pass on that session and drops a weekend one", () => {
    db.record(pass(Date.parse("2026-10-13T23:00:00Z"), { verdicts: [verdict("S1-NVDA")] })); // Tue 7 PM NY
    db.record(pass(Date.parse("2026-10-11T15:00:00Z"), { verdicts: [verdict("S1-NVDA")] })); // Sun
    const s1 = read().playbooks[0];
    expect(s1?.days.find((d) => d.date === "2026-10-13")?.checks).toBe(1);
    expect(s1?.totals.checks).toBe(1);
  });

  it("is no playbook's when an intent carries no playbook id", () => {
    db.record(
      pass(MON, {
        outcomes: [
          {
            intent: intent({ playbookId: undefined }),
            action: "placed",
            result: { status: "filled" } as never,
          },
        ],
      }),
    );
    expect(read().playbooks).toEqual([]);
  });

  it("leads with the playbooks that asked to trade", () => {
    db.record(pass(MON, { verdicts: [verdict("G1-GOOG"), verdict("G1-GOOG", "aggressive")] }));
    db.record(pass(MON + 1, { verdicts: [verdict("G1-GOOG")] }));
    db.record(
      pass(MON + 2, {
        outcomes: [{ intent: intent(), action: "placed", result: { status: "filled" } as never }],
      }),
    );
    expect(read().playbooks.map((p) => p.playbookId)).toEqual(["S1-NVDA", "G1-GOOG"]);
  });

  it("publishes house playbooks only, never a member's authored play", () => {
    db.record(pass(MON, { verdicts: [verdict("S1-NVDA"), verdict("U-abc123")] }));
    const house = readHouseFunnel((from, to) => db.playbookFunnel(from, to), NOW);
    expect(house.playbooks.map((p) => p.playbookId)).toEqual(["S1-NVDA"]);
  });
});
