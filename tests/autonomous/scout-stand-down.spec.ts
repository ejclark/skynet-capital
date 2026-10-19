import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { type BetaScoutDeps, LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import { scoutSignalsFrom } from "../../src/autonomous/scout-stand-down.js";
import type { OrderIntent, PlaybookVerdict } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { aContext, aSubscription } from "../support/builders.js";

/**
 * The forced pick stands down on a signal day (#4450 slice 6a, EARS 6): WHILE the forced pick is
 * enabled, it fires only on sessions where no playbook raised a counted signal — and only once a
 * playbook other than the forced pick has placed an order in the funnel's window (the plan's hold,
 * read from the decision store instead of off the Research card by a person).
 */

const MON = Date.parse("2026-10-12T13:30:00Z"); // Mon 9:30 AM New York
const FRI = Date.parse("2026-10-16T14:00:00Z"); // Fri 10:00 AM New York
const IN_HOURS = new Date("2026-10-16T15:00:00Z");

const order = (playbookId: string): OrderIntent => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
  playbookId,
  playbookMode: "standard",
});

const verdict = (playbookId: string, state: PlaybookVerdict["state"]): PlaybookVerdict =>
  ({ playbookId, mode: "standard", state }) as PlaybookVerdict;

function checked(at: number, ...verdicts: PlaybookVerdict[]): DecisionRecord {
  return {
    at,
    personaId: "bot-1",
    mode: "live",
    rawIntents: [],
    guardedIntents: [],
    outcomes: [],
    playbookVerdicts: verdicts,
  };
}

function placed(at: number, playbookId: string, personaId = "bot-1"): DecisionRecord {
  const intent = order(playbookId);
  return {
    at,
    personaId,
    mode: "live",
    rawIntents: [intent],
    guardedIntents: [intent],
    outcomes: [{ intent, action: "placed", result: { status: "filled" } as never }],
  };
}

describe("which playbooks stand the forced pick down", () => {
  let dir: string;
  let db: DecisionDb;
  const signalledOn = (session: string, now = IN_HOURS) =>
    scoutSignalsFrom(
      (from, to) => db.playbookFunnel(from, to),
      () => now,
    )(session);
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "scout-stand-down-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("none while no playbook has placed an order, even on a session with a signal", () => {
    db.record(checked(FRI, verdict("S1-NVDA", "long")));
    expect(signalledOn("2026-10-16")).toEqual([]);
  });

  it("the signalling playbook, once a playbook has placed an order in the window", () => {
    db.record(placed(MON, "S1-NVDA"));
    db.record(checked(FRI, verdict("S1-NVDA", "long")));
    expect(signalledOn("2026-10-16")).toEqual(["S1-NVDA"]);
  });

  it("none on a session with no signal, so the forced pick still fires", () => {
    db.record(placed(MON, "S1-NVDA"));
    db.record(checked(FRI, verdict("S1-NVDA", "no-window")));
    expect(signalledOn("2026-10-16")).toEqual([]);
  });

  it("never opens the hold on the forced pick's own orders or a persona's own rules", () => {
    db.record(placed(MON, "BETA-SCOUT", "beta-scout"));
    db.record(placed(MON, "SAURON", "sauron"));
    db.record(checked(FRI, verdict("S1-NVDA", "long")));
    expect(signalledOn("2026-10-16")).toEqual([]);
  });

  it("ignores a `long` from a playbook whose signal only a research run measures", () => {
    db.record(placed(MON, "S1-NVDA"));
    db.record(checked(FRI, verdict("CRWV-WHEEL", "long")));
    expect(signalledOn("2026-10-16")).toEqual([]);
  });

  it("reads a pick staged for the next open against the session just closed", () => {
    db.record(placed(MON, "S1-NVDA"));
    db.record(checked(FRI, verdict("S1-NVDA", "long")));
    const fridayEvening = new Date("2026-10-16T22:00:00Z");
    expect(signalledOn("2026-10-19", fridayEvening)).toEqual(["S1-NVDA"]);
  });
});

/** A bot whose own rules never trade — the quiet the forced pick fills. */
const quiet: Persona = { id: "quiet", name: "Quiet", thesis: "test", decide: () => [] };

const RISK = { maxPositionPct: 0.5 };

function aRunner(signalledOn: BetaScoutDeps["signalledOn"], warnings: string[] = []) {
  const broker = new InMemoryBroker(1_000_000, [
    { symbol: "MSFT", bid: 100, ask: 100, last: 100, asOf: "t" },
  ]);
  const scoutDecisions: DecisionRecord[] = [];
  const runner = new LiveCycleRunner({
    traders: [
      {
        personaName: quiet.name,
        broker,
        trader: new AutonomousTrader({ persona: quiet, broker, risk: RISK, cooldownMs: 0 }),
      },
    ],
    safety: new SafetyController(),
    blockedReason: () => null,
    scout: {
      maxPicks: 2,
      broker,
      universe: ["MSFT"],
      managedSymbols: new Set(),
      risk: RISK,
      mode: "live",
      subscriptions: () => [aSubscription("host", "BETA-SCOUT", { mode: "conservative" })],
      ...(signalledOn ? { signalledOn } : {}),
    },
    onDecision: (r) => scoutDecisions.push(r),
    onScoutWarn: (line) => warnings.push(line),
  });
  return { runner, scoutDecisions };
}

const candidate = (asOf: string) => aContext({ MSFT: { last: 100, sentiment: 0.9 } }, asOf);

describe("the forced pick on a session where a playbook raised its signal", () => {
  it("places nothing, says so once, and asks once for the session", async () => {
    const warnings: string[] = [];
    let asked = 0;
    const { runner, scoutDecisions } = aRunner(() => {
      asked += 1;
      return ["S1-NVDA"];
    }, warnings);

    await runner.runCycle(candidate("2026-10-16T14:00:00Z"));
    await runner.runCycle(candidate("2026-10-16T14:00:15Z"));

    expect(scoutDecisions).toHaveLength(0);
    expect(asked).toBe(1);
    expect(warnings).toEqual([expect.stringContaining("standing down for 2026-10-16: S1-NVDA")]);
  });

  it("still fires on a session with no signal", async () => {
    const { runner, scoutDecisions } = aRunner(() => []);
    await runner.runCycle(candidate("2026-10-16T14:00:00Z"));
    expect(scoutDecisions).toHaveLength(1);
    expect(scoutDecisions[0]?.outcomes[0]?.action).toBe("placed");
  });

  it("a staged scan stands down without spending the session, so that session reads its own", async () => {
    let signal = ["S1-NVDA"];
    const { runner, scoutDecisions } = aRunner(() => signal);

    expect(await runner.stageScout(candidate("2026-10-16T22:00:00Z"), "2026-10-19")).toBe(0);
    signal = []; // Monday's own passes raised nothing
    await runner.runCycle(candidate("2026-10-19T14:00:00Z"));

    expect(scoutDecisions).toHaveLength(1);
  });
});
