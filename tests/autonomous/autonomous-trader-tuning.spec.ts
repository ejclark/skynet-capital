import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import { DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { aContext } from "../support/builders.js";

/** Always wants 10 NVDA — isolates the trader's own mode and cooldown. */
class AlwaysBuys implements Persona {
  readonly id = "always";
  readonly name = "Always";
  readonly thesis = "test";
  decide() {
    return [
      { symbol: "NVDA", side: "buy" as const, quantity: 10, type: "market" as const, reason: "t" },
    ];
  }
}

const context = aContext({ NVDA: { last: 100, momentum: 0.05 } });
const broker = () =>
  new InMemoryBroker(1_000_000, [{ symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" }]);
const roster = (trader: AutonomousTrader) => ({
  persona: new AlwaysBuys(),
  risk: DEFAULT_RISK_CONFIG,
  ...{ trader },
});

describe("AutonomousTrader.swapRoster — build tuning (#4535 slice 2c)", () => {
  it("applies a new cooldown on the next cycle, with the order clock kept", async () => {
    let clock = 1_000;
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker: broker(),
      now: () => clock,
    });
    await trader.evaluate(context); // default cooldown: 5 minutes
    clock += 100_000;
    expect(await trader.evaluate(context)).toHaveLength(0); // 100s < 5m

    trader.swapRoster({ ...roster(trader), tuning: { mode: "live", cooldownMs: 90_000 } });

    expect(await trader.evaluate(context)).toHaveLength(1); // 100s > 90s, same order clock
  });

  it("drops back to the default cooldown when the tuning carries none", async () => {
    let clock = 1_000;
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker: broker(),
      cooldownMs: 90_000,
      now: () => clock,
    });
    await trader.evaluate(context);
    trader.swapRoster({ ...roster(trader), tuning: { mode: "live" } });
    clock += 100_000;

    expect(await trader.evaluate(context)).toHaveLength(0);
  });

  it("swaps the mode the gate allows: live pinned to observe places nothing", async () => {
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker: broker(),
      mode: "live",
    });

    trader.swapRoster({ ...roster(trader), tuning: { mode: "observe" } });

    expect(await trader.evaluate(context)).toHaveLength(0);
  });

  it("keeps the tuning in force when a swap carries none (a Store change)", async () => {
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker: broker(),
      mode: "observe",
    });

    trader.swapRoster(roster(trader));

    expect(await trader.evaluate(context)).toHaveLength(0); // still observe
  });
});
