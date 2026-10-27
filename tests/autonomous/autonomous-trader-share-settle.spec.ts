import { AutonomousTrader, type TraderMode } from "../../src/autonomous/autonomous-trader.js";
import type { Portfolio } from "../../src/domain/types.js";
import type { RiskConfig } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import type { BrokerPort } from "../../src/ports/broker.js";
import type { OptionOrderTracker } from "../../src/ports/option-market.js";
import { aContext } from "../support/builders.js";

/**
 * The beta scout trades live on the first bot's account whatever mode that bot runs in, so the
 * share orders it leaves working sit in that bot's broker (#4650 review). Reading what they became
 * places nothing, so the bot does it every cycle — observing, halted or suspended — while the option
 * half, which cancels orders, stays a live bot's alone.
 */

const RISK: RiskConfig = { maxPositionPct: 0.2 };
const quiet: Persona = { id: "sauron", name: "Sauron", thesis: "n/a", decide: () => [] };

function harness(mode: TraderMode, blocked: string | null = null) {
  const calls: string[] = [];
  const broker: BrokerPort = {
    getPortfolio: (): Promise<Portfolio> => Promise.resolve({ cash: 10_000, positions: [] }),
    submit: (intent) => Promise.resolve({ intent, status: "rejected" }),
  };
  const tracker: OptionOrderTracker = {
    settle: () => {
      calls.push("options");
      return Promise.resolve(new Set<string>());
    },
    settleShares: () => {
      calls.push("shares");
      return Promise.resolve();
    },
  };
  const trader = new AutonomousTrader({
    persona: quiet,
    broker,
    risk: RISK,
    mode,
    optionOrders: tracker,
    blockedReason: () => blocked,
  });
  return { trader, calls };
}

describe("AutonomousTrader — share orders left working", () => {
  it("are read every cycle in observe mode, where the option half never runs", async () => {
    const h = harness("observe");
    await h.trader.evaluate(aContext({ NVDA: { last: 100 } }));
    expect(h.calls).toEqual(["shares"]);
  });

  it("are read while the bot is halted or suspended too", async () => {
    const h = harness("live", "suspended by the owner");
    await h.trader.evaluate(aContext({ NVDA: { last: 100 } }));
    expect(h.calls).toEqual(["shares"]);
  });

  it("are read first in live mode, then the option orders", async () => {
    const h = harness("live");
    await h.trader.evaluate(aContext({ NVDA: { last: 100 } }));
    expect(h.calls).toEqual(["shares", "options"]);
  });
});
