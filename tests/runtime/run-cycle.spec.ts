import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { ScriptedMarketData } from "../../src/adapters/scripted-market-data.js";
import { FuturistPersona } from "../../src/personas/futurist.js";
import { InMemoryCycleReportStore } from "../../src/runtime/cycle-report-store.js";
import { runCycle } from "../../src/runtime/run-cycle.js";
import { aContext } from "../support/builders.js";

describe("runCycle", () => {
  it("runs a decision cycle and persists the report with the injected timestamp", async () => {
    const context = aContext({ PLTR: { last: 50, momentum: 0.05 } });
    const broker = new InMemoryBroker(5_000_000, Object.values(context.quotes));
    const store = new InMemoryCycleReportStore();

    const persisted = await runCycle({
      persona: new FuturistPersona(),
      broker,
      marketData: new ScriptedMarketData([context]),
      store,
      universe: ["PLTR"],
      now: () => new Date("2026-07-24T15:00:00Z"),
    });

    expect(persisted.recordedAt).toBe("2026-07-24T15:00:00.000Z");
    expect(persisted.report.personaId).toBe("futurist");
    // The Futurist buys the breakout, so the cycle produced a fill.
    expect(persisted.report.results[0]?.status).toBe("filled");
  });

  it("saves exactly one report per cycle, readable from the store", async () => {
    const context = aContext({ PLTR: { last: 50, momentum: 0.0 } }); // quiet: no trade
    const broker = new InMemoryBroker(5_000_000, Object.values(context.quotes));
    const store = new InMemoryCycleReportStore();

    await runCycle({
      persona: new FuturistPersona(),
      broker,
      marketData: new ScriptedMarketData([context]),
      store,
      universe: ["PLTR"],
    });

    const saved = await store.list("futurist");
    expect(saved).toHaveLength(1);
    expect(saved[0]?.report.results).toEqual([]);
  });
});
