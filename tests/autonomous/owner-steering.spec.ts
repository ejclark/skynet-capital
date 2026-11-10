import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import {
  type ControlsState,
  effectiveMode,
  OPENS_HELD_REASON,
  opensHeldReason,
  parseControlsState,
} from "../../src/autonomous/bot-controls.js";
import { ownerNarrowed } from "../../src/autonomous/controls-poll-wire.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { HOST_WATCHES_REASON, scoutHostGates } from "../../src/autonomous/scout-host-gates.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";

/** #6954 slice 5b — the owner steers a bot from its Settings card: "stop opening, keep exits" holds
 *  its opens and places its exits; "watch only" places nothing at all. Both are read every cycle,
 *  both only narrow, and the forced pick on the bot obeys them and the bot's own suspend. */

/** Wants to open NVDA and to sell the AMD it already holds. */
class OpensAndExits implements Persona {
  readonly id = "both";
  readonly name = "Both";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [
      { symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "open" },
      { symbol: "AMD", side: "sell", quantity: 5, type: "market", reason: "exit" },
    ];
  }
}

const quote = (symbol: string, last: number) => ({
  symbol,
  bid: last,
  ask: last,
  last,
  asOf: "2026-07-24T14:00:00Z",
});
const context: MarketContext = {
  asOf: "2026-07-24T14:00:00Z",
  quotes: { NVDA: quote("NVDA", 100), AMD: quote("AMD", 50) },
  momentum: { NVDA: 0.05, AMD: -0.05 },
};

async function bookHolding(): Promise<InMemoryBroker> {
  const broker = new InMemoryBroker(1_000_000, [
    { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    { symbol: "AMD", bid: 50, ask: 50, last: 50, asOf: "t" },
  ]);
  await broker.submit({ symbol: "AMD", side: "buy", quantity: 20, type: "market", reason: "seed" });
  return broker;
}

const held = async (broker: InMemoryBroker, symbol: string) =>
  (await broker.getPortfolio()).positions.find((p) => p.symbol === symbol)?.quantity ?? 0;

describe("stop opening, keep exits", () => {
  it("refuses the open as opens-held and places the exit, never calling the cycle halted", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      ownerHoldsOpens: () => OPENS_HELD_REASON,
      onDecision: (r) => records.push(r),
    });

    const results = await trader.evaluate(context);

    expect(results.map((r) => r.intent.symbol)).toEqual(["AMD"]);
    expect(await held(broker, "AMD")).toBe(15);
    expect(await held(broker, "NVDA")).toBe(0);
    expect(records[0]?.refusals).toMatchObject([
      { intent: { symbol: "NVDA", side: "buy" }, reason: "opens-held" },
    ]);
    // A choice, not a stop: a halted cycle would read "Halted" on the bot's card (code review).
    expect(records[0]?.halted).toBeUndefined();
  });

  it("names the breaker first when both hold, so a safety stop is never hidden by the owner's", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      openBlockedReason: () => "daily-loss",
      ownerHoldsOpens: () => OPENS_HELD_REASON,
      onDecision: (r) => records.push(r),
    });

    await trader.evaluate(context);

    expect(records[0]?.refusals?.[0]?.reason).toBe("breaker-halt");
    expect(records[0]?.halted).toBe("daily-loss");
  });

  it("applies from the next cycle the setting changes on — no rebuild", async () => {
    const broker = await bookHolding();
    let hold: string | null = OPENS_HELD_REASON;
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      cooldownMs: 0,
      ownerHoldsOpens: () => hold,
    });

    await trader.evaluate(context);
    expect(await held(broker, "NVDA")).toBe(0);
    hold = null;
    await trader.evaluate(context);
    expect(await held(broker, "NVDA")).toBe(10);
  });
});

describe("watch only", () => {
  it("places nothing, exits included, and records what it would have done", async () => {
    const broker = await bookHolding();
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      watchOnly: () => true,
      onDecision: (r) => records.push(r),
    });

    expect(await trader.evaluate(context)).toHaveLength(0);
    expect(await held(broker, "AMD")).toBe(20);
    expect(records[0]?.mode).toBe("observe");
    expect(records[0]?.outcomes.map((o) => o.action)).toEqual(["observed", "observed"]);
  });

  it("never widens: off leaves a bot its readiness gate pinned to watching still watching", async () => {
    const broker = await bookHolding();
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      mode: "observe",
      watchOnly: () => false,
    });

    expect(await trader.evaluate(context)).toHaveLength(0);
    expect(await held(broker, "AMD")).toBe(20);
  });

  it("hands the bot back on the next cycle once it is switched off", async () => {
    const broker = await bookHolding();
    let watching = true;
    const trader = new AutonomousTrader({
      persona: new OpensAndExits(),
      broker,
      cooldownMs: 0,
      watchOnly: () => watching,
    });

    await trader.evaluate(context);
    expect(await held(broker, "NVDA")).toBe(0);
    watching = false;
    await trader.evaluate(context);
    expect(await held(broker, "NVDA")).toBe(10);
  });
});

describe("the stored settings", () => {
  const state = (bots: ControlsState["bots"]): ControlsState => ({ bots });

  it("reads stop-opening back from the file, and a hostile value as unset", () => {
    expect(parseControlsState({ bots: { sauron: { holdOpens: true } } })?.bots.sauron).toEqual({
      holdOpens: true,
    });
    expect(parseControlsState({ bots: { sauron: { holdOpens: "yes" } } })?.bots.sauron).toEqual({});
    expect(opensHeldReason(state({ sauron: { holdOpens: true } }), "sauron")).toBe(
      OPENS_HELD_REASON,
    );
    expect(opensHeldReason(state({ sauron: { holdOpens: false } }), "sauron")).toBeNull();
    expect(opensHeldReason(state({ banker: { holdOpens: true } }), "sauron")).toBeNull();
  });

  it("watch only narrows a live house and never widens an observe one", () => {
    expect(effectiveMode(state({ sauron: { mode: "observe" } }), "sauron", "live")).toBe("observe");
    expect(effectiveMode(state({ sauron: { mode: "live" } }), "sauron", "observe")).toBe("observe");
  });
});

describe("the fleet card hears the owner's watch only on the poll", () => {
  const verdict = {
    id: "sauron",
    ready: true,
    reason: "pack passed",
    wanted: "live",
    mode: "live",
  } as const;

  it("folds it into a placing bot's verdict, so the card names the owner's hold", () => {
    expect(ownerNarrowed(verdict, true)).toEqual({
      ...verdict,
      wanted: "observe",
      mode: "observe",
    });
  });

  it("leaves the verdict alone when the owner is not holding it, or when the house already watches", () => {
    expect(ownerNarrowed(verdict, false)).toBe(verdict);
    const houseWatches = { ...verdict, wanted: "observe", mode: "observe" } as const;
    expect(ownerNarrowed(houseWatches, true)).toBe(houseWatches);
  });

  it("keeps the readiness verdict: a not-ready bot the owner watches still reads not ready", () => {
    const pinned = { ...verdict, ready: false, mode: "observe" } as const;
    expect(ownerNarrowed(pinned, true)).toMatchObject({ ready: false, wanted: "observe" });
  });
});

describe("the forced pick obeys its host bot's owner", () => {
  const controls = (bots: ControlsState["bots"]) => ({
    suspendedReason: (id: string) => (bots[id]?.suspended ? "suspended by owner" : null),
    opensHeldReason: (id: string) => opensHeldReason({ bots }, id),
    watchOnly: (id: string) => bots[id]?.mode === "observe",
  });
  const clear = { stopEverything: () => null, openBlockedReason: () => null };

  it("stops opens AND exits when the host bot is suspended", () => {
    const gates = scoutHostGates(controls({ sauron: { suspended: true } }), "sauron", clear);
    expect(gates.blockedReason()).toBe("suspended by owner");
    expect(gates.exitBlockedReason()).toBe("suspended by owner");
  });

  it("stops opens and keeps exits when the host bot's owner stopped opening", () => {
    const gates = scoutHostGates(controls({ sauron: { holdOpens: true } }), "sauron", clear);
    expect(gates.blockedReason()).toBe(OPENS_HELD_REASON);
    expect(gates.exitBlockedReason()).toBeNull();
  });

  it("holds its opens while the host bot watches, so no day is spent, and keeps exits recorded", () => {
    const gates = scoutHostGates(controls({ sauron: { mode: "observe" } }), "sauron", clear);
    expect(gates.blockedReason()).toBe(HOST_WATCHES_REASON);
    expect(gates.exitBlockedReason()).toBeNull();
    expect(gates.watchOnly()).toBe(true);
  });

  it("watches when the host bot watches, and reads another bot's settings as nothing", () => {
    expect(
      scoutHostGates(controls({ sauron: { mode: "observe" } }), "sauron", clear).watchOnly(),
    ).toBe(true);
    const other = scoutHostGates(
      controls({ banker: { suspended: true, holdOpens: true, mode: "observe" } }),
      "sauron",
      clear,
    );
    expect([other.blockedReason(), other.exitBlockedReason(), other.watchOnly()]).toEqual([
      null,
      null,
      false,
    ]);
  });

  it("still obeys the process gates first: the kill switch stops everything, a breaker holds opens", () => {
    const gates = scoutHostGates(controls({ sauron: { holdOpens: true } }), "sauron", {
      stopEverything: () => "manual",
      openBlockedReason: () => "daily-loss",
    });
    expect(gates.exitBlockedReason()).toBe("manual");
    expect(gates.blockedReason()).toBe("manual");
    const breaker = scoutHostGates(controls({ sauron: { holdOpens: true } }), "sauron", {
      stopEverything: () => null,
      openBlockedReason: () => "daily-loss",
    });
    expect(breaker.blockedReason()).toBe("daily-loss");
    expect(breaker.exitBlockedReason()).toBeNull();
  });

  it("with no host wired, leaves only the process gates", () => {
    const gates = scoutHostGates(controls({}), undefined, clear);
    expect([gates.blockedReason(), gates.exitBlockedReason(), gates.watchOnly()]).toEqual([
      null,
      null,
      false,
    ]);
  });
});
