import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { FIRST_RUN_PLAY_TARGETS, playBookOf } from "../../src/playbooks/play-reading.js";
import type { EnabledPlaybook } from "../../src/playbooks/playbook.js";
import { CRWV_WHEEL, S1_NVDA } from "../../src/playbooks/registry.js";
import {
  type TargetObservationDeps,
  withTargetObservation,
} from "../../src/playbooks/with-target-observation.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, aPortfolio, aPosition, aSubscription } from "../support/builders.js";

/**
 * #5483 slice 3, OBSERVE-ONLY: the rebalancer reads a live book and says what it WOULD do. The
 * contract under test is that it only says. A decision comes back as the inner persona made it,
 * the very same array, whatever the book reads and whatever the log does.
 */

const ASOF = "2026-11-02T15:00:00Z";
const intent = (symbol = "CRWV"): OrderIntent => ({
  symbol,
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
  playbookId: "CRWV-WHEEL",
  playbookMode: "standard",
});
const innerOf = (intents: OrderIntent[] = []): Persona & { calls: number } => {
  const persona = {
    id: "sauron",
    name: "Sauron",
    thesis: "t",
    calls: 0,
    decide(): OrderIntent[] {
      persona.calls++;
      return intents;
    },
  };
  return persona;
};
const wheel: EnabledPlaybook = { playbook: CRWV_WHEEL, mode: "standard" };
const budgeted = (capitalAllocated = 100_000) =>
  aSubscription("sauron", "CRWV-WHEEL", { capitalAllocated });
const market = (last: number): MarketContext => aContext({ CRWV: { last } }, ASOF);
/** $70k of CRWV bought at 100: the budget's 70%. */
const holding = (): Portfolio =>
  aPortfolio({
    cash: 30_000,
    positions: [aPosition({ symbol: "CRWV", quantity: 700, avgPrice: 100 })],
  });
const malformed = (): Portfolio => ({ cash: 0, positions: undefined }) as unknown as Portfolio;

const lines = () => {
  const out: string[] = [];
  return { out, log: (line: string) => void out.push(line) };
};
const observe = (overrides: Partial<TargetObservationDeps> = {}) => {
  const sink = lines();
  const handed = [intent()];
  const inner = innerOf(handed);
  const persona = withTargetObservation(inner, {
    accountId: "sauron",
    subscriptions: [budgeted()],
    enabled: [wheel],
    log: sink,
    ...overrides,
  });
  return { sink, inner, persona, handed };
};

describe("withTargetObservation: observe-only means it never emits or changes an order", () => {
  it("returns the inner persona's intents, the very same array, at every level", () => {
    const { persona, inner, handed } = observe();
    for (const last of [100, 70, 40, 140, 100]) {
      expect(persona.decide(market(last), holding())).toBe(handed);
    }
    expect(inner.calls).toBe(5);
  });

  it("emits nothing when the inner persona does, even at the gate", () => {
    const sink = lines();
    const persona = withTargetObservation(innerOf(), {
      accountId: "sauron",
      subscriptions: [budgeted()],
      enabled: [wheel],
      log: sink,
    });
    expect(persona.decide(market(30), holding())).toEqual([]);
    expect(sink.out.some((l) => l.includes("gate"))).toBe(true);
  });

  it("keeps deciding when the log is down, or a reading throws", () => {
    const broken = {
      log: () => {
        throw new Error("log down");
      },
    };
    const down = observe({ log: broken });
    expect(down.persona.decide(market(100), holding())).toBe(down.handed);
    const bad = observe();
    expect(bad.persona.decide(market(100), malformed())).toBe(bad.handed);
    const both = observe({ log: broken });
    expect(both.persona.decide(market(100), malformed())).toBe(both.handed);
  });

  it("says a reading failed once, and says it is trading on", () => {
    const { persona, sink } = observe();
    persona.decide(market(100), malformed());
    persona.decide(market(100), malformed());
    expect(sink.out.filter((l) => l.includes("reading failed"))).toHaveLength(1);
    expect(sink.out[0]).toContain("trading goes on");
  });

  it("labels every line SIM and observe-only", () => {
    const { persona, sink } = observe();
    persona.decide(market(100), holding());
    persona.decide(market(40), holding());
    persona.decide(market(100), holding());
    expect(sink.out).toHaveLength(3);
    for (const line of sink.out) expect(line).toContain("SIM, observe-only");
  });
});

describe("withTargetObservation: which bot, which plays", () => {
  it("watches the first-run play on the one bot, and nothing else", () => {
    expect(FIRST_RUN_PLAY_TARGETS.map((f) => `${f.accountId}/${f.playbookId}`)).toEqual([
      "sauron/CRWV-WHEEL",
    ]);
  });

  it("returns the persona unwrapped on any other bot with the same subscription", () => {
    const inner = innerOf();
    const other = withTargetObservation(inner, {
      accountId: "banker",
      subscriptions: [aSubscription("banker", "CRWV-WHEEL", { capitalAllocated: 100_000 })],
      enabled: [wheel],
      log: lines(),
    });
    expect(other).toBe(inner);
  });

  it("returns it unwrapped for a paused subscription, and for a playbook not on the roster", () => {
    const inner = innerOf();
    const paused = aSubscription("sauron", "CRWV-WHEEL", { capitalAllocated: 1, enabled: false });
    const deps = { accountId: "sauron", log: lines() };
    expect(
      withTargetObservation(inner, { ...deps, subscriptions: [paused], enabled: [wheel] }),
    ).toBe(inner);
    expect(
      withTargetObservation(inner, { ...deps, subscriptions: [budgeted()], enabled: [] }),
    ).toBe(inner);
  });

  it("watches a play whose own subscription carries a target, and the owner's wins", () => {
    const own = aSubscription("sauron", "CRWV-WHEEL", {
      capitalAllocated: 100_000,
      playTarget: { weight: 0.65, band: { signal: 0.03, gate: 0.06 } },
    });
    const { persona, sink } = observe({ subscriptions: [own] });
    persona.decide(market(100), holding());
    expect(sink.out[0]).toContain("Target 65%");
    expect(sink.out[0]).toContain("signal at 3 points, gate at 6");
  });

  it("watches another bot's play when its own subscription states a target", () => {
    const sink = lines();
    const inner = innerOf();
    const persona = withTargetObservation(inner, {
      accountId: "banker",
      subscriptions: [
        aSubscription("banker", "S1-NVDA", {
          capitalAllocated: 10_000,
          playTarget: { weight: 0.7 },
        }),
      ],
      enabled: [{ playbook: S1_NVDA, mode: "standard" }],
      log: sink,
    });
    expect(persona).not.toBe(inner);
    persona.decide(aContext({ NVDA: { last: 100 } }, ASOF), aPortfolio());
    expect(sink.out[0]).toContain("banker S1-NVDA: watching");
    expect(sink.out[0]).toContain("Now 0%");
  });

  it("refuses, said once, a target that widens its playbook's bounds, and does not observe it", () => {
    const sink = lines();
    const inner = innerOf();
    const persona = withTargetObservation(inner, {
      accountId: "sauron",
      subscriptions: [
        aSubscription("sauron", "CRWV-WHEEL", {
          capitalAllocated: 100_000,
          playTarget: { weight: 0.95 },
        }),
      ],
      enabled: [wheel],
      log: sink,
    });
    expect(persona).toBe(inner);
    expect(sink.out).toHaveLength(1);
    expect(sink.out[0]).toContain("target ignored");
    expect(sink.out[0]).toContain("outside this playbook's 60-80%");
  });

  it("holds a playbook's own bounds, tighter than the house's", () => {
    const tight = {
      ...CRWV_WHEEL,
      targetBounds: { weight: { min: 0.65, max: 0.75 }, signalMax: 0.04, gateMax: 0.08 },
    };
    const enabled = [{ playbook: tight, mode: "standard" as const }];
    // The first-run default states a 5/10 band: wider than this playbook allows itself, so refused.
    const refused = lines();
    const inner = innerOf();
    expect(
      withTargetObservation(inner, {
        accountId: "sauron",
        subscriptions: [budgeted()],
        enabled,
        log: refused,
      }),
    ).toBe(inner);
    expect(refused.out[0]).toContain("wider than this playbook's 65-75%");
    // A bare weight is not wider than anything: its band shrinks to fit.
    const fits = observe({
      enabled,
      subscriptions: [
        aSubscription("sauron", "CRWV-WHEEL", {
          capitalAllocated: 100_000,
          playTarget: { weight: 0.7 },
        }),
      ],
    });
    fits.persona.decide(market(100), holding());
    expect(fits.sink.out[0]).toContain("signal at 4 points, gate at 8");
  });

  it("says once that an uncapped play has no ceiling to read against", () => {
    const { persona, sink } = observe({ subscriptions: [aSubscription("sauron", "CRWV-WHEEL")] });
    persona.decide(market(100), holding());
    persona.decide(market(90), holding());
    expect(sink.out).toHaveLength(1);
    expect(sink.out[0]).toContain("no budget set");
  });
});

describe("withTargetObservation: what it says, and when", () => {
  it("opens with the target, what its edges mean as a price move, and where the play stands", () => {
    const { persona, sink } = observe();
    persona.decide(market(100), holding());
    expect(sink.out).toHaveLength(1);
    expect(sink.out[0]).toContain("sauron CRWV-WHEEL: watching");
    expect(sink.out[0]).toContain("Target 70% of its $100,000 budget");
    expect(sink.out[0]).toContain("lean 60% to 80%");
    expect(sink.out[0]).toContain("a 20.4% fall or a 28.6% rise in the position trips the signal");
    expect(sink.out[0]).toContain("Now 70% (+0.0 points): inside");
  });

  it("stays quiet while the level holds, and speaks on each change", () => {
    const { persona, sink } = observe();
    persona.decide(market(100), holding());
    persona.decide(market(99), holding());
    persona.decide(market(98), holding());
    expect(sink.out).toHaveLength(1);
    persona.decide(market(70), holding());
    expect(sink.out).toHaveLength(2);
    expect(sink.out[1]).toContain("signal (under)");
    expect(sink.out[1]).toContain("Would: record it and tell its owner; capital keeps flowing");
    persona.decide(market(69), holding());
    expect(sink.out).toHaveLength(2);
    persona.decide(market(40), holding());
    expect(sink.out[2]).toContain("gate (under)");
    expect(sink.out[2]).toContain("exits are never held back");
    persona.decide(market(100), holding());
    expect(sink.out[3]).toContain("back inside its band from gate");
  });

  it("reads a rally as over target, and a gate on the way up", () => {
    const { persona, sink } = observe();
    persona.decide(market(100), holding());
    persona.decide(market(150), holding());
    expect(sink.out[1]).toContain("signal (over)");
    persona.decide(market(300), holding());
    expect(sink.out[2]).toContain("gate (over)");
    expect(sink.out[2]).toContain("stop new entries");
  });
});

describe("playBookOf: what the play has deployed", () => {
  const symbols = ["CRWV"];
  const put75 = buildOccSymbol({
    underlying: "CRWV",
    expiration: "2026-12-18",
    type: "put",
    strike: 75,
  });
  const call90 = buildOccSymbol({
    underlying: "CRWV",
    expiration: "2027-03-19",
    type: "call",
    strike: 90,
  });

  it("marks shares at the last price and costs them at what was paid", () => {
    const b = playBookOf(holding(), market(80).quotes, symbols, 100_000);
    expect(b).toEqual({ ceiling: 100_000, active: 56_000, deployedCost: 70_000 });
  });

  it("counts a sold put's collateral as deployed, at the cash it sets aside", () => {
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: put75, quantity: -2, avgPrice: 2.1 })],
    });
    const b = playBookOf(portfolio, market(80).quotes, symbols, 100_000);
    expect(b.active).toBe(15_000);
    expect(b.deployedCost).toBe(15_000);
  });

  it("counts a long contract at its mark and at what it cost, and no one else's symbols", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: call90, quantity: 3, avgPrice: 12, marketValue: 4_500 }),
        aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 100 }),
      ],
    });
    const b = playBookOf(portfolio, market(80).quotes, symbols, 100_000);
    expect(b.active).toBe(4_500);
    expect(b.deployedCost).toBe(3_600);
  });

  it("ignores a short share position: the bots hold long only, so it is not deployment", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: -10 })] });
    expect(playBookOf(portfolio, market(80).quotes, symbols, 100_000)).toMatchObject({
      active: 0,
      deployedCost: 0,
    });
  });
});
