import type { OrderIntent } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, type RiskConfig } from "../../src/engine/guards.js";
import { safeguardLadderView } from "../../src/observatory/safeguard-ladder-view.js";
import type { Persona } from "../../src/personas/persona.js";
import { BETA_SCOUT } from "../../src/playbooks/beta-scout.js";
import { COND_SCOUT } from "../../src/playbooks/cond-scout.js";
import { exitPlannedFor, exitPlanOf, HOUSE_STOP_LOSS } from "../../src/playbooks/exit-plan.js";
import { type Playbook, playbookIntents } from "../../src/playbooks/playbook.js";
import { registeredPlaybooks, S1_NVDA } from "../../src/playbooks/registry.js";
import { SAURON } from "../../src/playbooks/sauron-rules.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * EVERY OPENING ORDER CARRIES ITS EXIT PLAN (#6954 slice 4; Eric, 2026-11-01). The EARS:
 *  - IF an order opens risk for a playbook that declares no stop and no target or time exit, THEN
 *    the system SHALL refuse it with reason "no exit plan".
 *  - WHILE a bot holds a position opened by a playbook with a stop, WHEN the drawdown crosses it,
 *    the system SHALL place the closing order.
 * The stops and the refusal ship together, so the roster walk below is what keeps the refusal from
 * ever turning off a house play.
 */

const MODES = ["conservative", "standard", "aggressive"] as const;
/** Places no orders at all — it records hypotheses, so it has nothing to exit. */
const PLACES_NO_ORDERS = new Set([COND_SCOUT.id]);

describe("the house roster — every playbook that can open carries its exit plan", () => {
  for (const playbook of registeredPlaybooks()) {
    if (PLACES_NO_ORDERS.has(playbook.id)) continue;
    it(`${playbook.id} has an exit plan in every mode`, () => {
      for (const mode of MODES) expect(exitPlanOf(playbook, mode)).toBeDefined();
    });
  }

  it("every share play carries the house stop, enforced, in every mode", () => {
    const sharePlays = registeredPlaybooks().filter(
      (p) => !(p.options || p.observeOnly) && p.symbols.length > 0,
    );
    expect(sharePlays.map((p) => p.id).sort()).toEqual([
      "G1-GOOG",
      "S1-NVDA",
      "SAURON",
      "TACO-DJT",
    ]);
    for (const p of sharePlays) {
      for (const mode of MODES) expect(exitPlanOf(p, mode)?.stop).toEqual(HOUSE_STOP_LOSS[mode]);
    }
  });

  it("no option play carries a share stop: it would fire on nothing, or sell the wheel's shares", () => {
    const optionPlays = registeredPlaybooks().filter((p) => p.options);
    expect(optionPlays.length).toBeGreaterThanOrEqual(4);
    for (const p of optionPlays) {
      expect(p.exitSafety).toBeUndefined();
      expect(p.exits?.target ?? p.exits?.time).toBeTruthy();
    }
  });

  it("the stop loosens as the mode grows, as size does", () => {
    const { conservative, standard, aggressive } = HOUSE_STOP_LOSS;
    expect(conservative.drawdownTripPct).toBeLessThan(standard.drawdownTripPct);
    expect(standard.drawdownTripPct).toBeLessThan(aggressive.drawdownTripPct);
  });
});

const bare = (overrides: Partial<Playbook> = {}): Playbook => ({
  id: "TEST-NVDA",
  symbols: ["NVDA"],
  thesis: "test",
  evidence: "test",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "long",
  ...overrides,
});

describe("exitPlanOf", () => {
  it("is undefined for a play with no stop, no target and no time exit", () => {
    expect(exitPlanOf(bare(), "standard")).toBeUndefined();
  });

  it("does not count an alert-only dial: it sells nothing, so it is no way out", () => {
    const p = bare({
      exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "alert-only" } },
    });
    expect(exitPlanOf(p, "standard")).toBeUndefined();
  });

  it("counts a stop only in the mode that declares it", () => {
    const p = bare({ exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "enforce" } } });
    expect(exitPlanOf(p, "standard")?.stop?.drawdownTripPct).toBe(0.1);
    expect(exitPlanOf(p, "aggressive")).toBeUndefined();
    expect(exitPlanOf(p)).toBeUndefined();
  });

  it("counts a stop for an order with no mode only when every mode enforces one (SAURON)", () => {
    expect(exitPlanOf(SAURON)?.stop).toEqual(HOUSE_STOP_LOSS.standard);
  });

  it("counts a target or a time exit in any mode, a missing mode included", () => {
    expect(exitPlanOf(bare({ exits: { time: "sells tomorrow" } }))).toEqual({
      time: "sells tomorrow",
    });
    expect(exitPlanOf(bare({ exits: { target: "sells at 2×" } }), "aggressive")).toEqual({
      target: "sells at 2×",
    });
  });
});

describe("the guards refuse an open with no exit plan (`no-exit-plan`)", () => {
  const context = aContext({ NVDA: { last: 100 } }, "2026-10-07T15:00:00Z");
  const portfolio = aPortfolio({
    cash: 100_000,
    positions: [aPosition({ symbol: "NVDA", quantity: 10, avgPrice: 100 })],
  });
  const PLANLESS = bare({ id: "PLANLESS" });
  const config: RiskConfig = {
    maxPositionPct: 0.5,
    exitPlanned: exitPlannedFor([PLANLESS, S1_NVDA]),
  };
  const order = (side: "buy" | "sell", playbookId?: string): OrderIntent => ({
    symbol: "NVDA",
    side,
    quantity: 5,
    type: "market",
    reason: "test",
    ...(playbookId ? { playbookId, playbookMode: "standard" as const } : {}),
  });

  it("refuses a buy from a playbook that declares no exit plan", () => {
    const { approved, refused } = applyGuardsWithVerdicts(
      [order("buy", "PLANLESS")],
      portfolio,
      context,
      config,
    );
    expect(approved).toEqual([]);
    expect(refused.map((r) => r.reason)).toEqual(["no-exit-plan"]);
  });

  it("passes a buy from a playbook with a stop and a time exit", () => {
    const { approved } = applyGuardsWithVerdicts(
      [order("buy", "S1-NVDA")],
      portfolio,
      context,
      config,
    );
    expect(approved).toHaveLength(1);
  });

  it("refuses an open from no playbook, or one it cannot find — fail closed", () => {
    const { refused } = applyGuardsWithVerdicts(
      [order("buy"), order("buy", "NOBODY")],
      portfolio,
      context,
      config,
    );
    expect(refused.map((r) => r.reason)).toEqual(["no-exit-plan", "no-exit-plan"]);
  });

  it("never refuses an exit: a planless playbook can always sell", () => {
    const { approved } = applyGuardsWithVerdicts(
      [order("sell", "PLANLESS"), order("sell")],
      portfolio,
      context,
      config,
    );
    expect(approved).toHaveLength(2);
  });

  it("is inert where the rule is off (evals, the readiness gate)", () => {
    const { exitPlanned: _, ...ruleOff } = config;
    const { approved } = applyGuardsWithVerdicts(
      [order("buy", "PLANLESS")],
      portfolio,
      context,
      ruleOff,
    );
    expect(approved).toHaveLength(1);
  });

  it("passes the forced pick's open: its exit plan is the next-session sale", () => {
    const pick = { ...order("buy"), playbookId: BETA_SCOUT.id };
    const scoutConfig: RiskConfig = {
      maxPositionPct: 0.5,
      exitPlanned: exitPlannedFor([BETA_SCOUT]),
    };
    expect(applyGuardsWithVerdicts([pick], portfolio, context, scoutConfig).approved).toHaveLength(
      1,
    );
  });
});

describe("a held position past its play's stop is closed", () => {
  // 15% under cost: past the standard 12% stop, inside the aggressive 16%.
  const context = aContext({ NVDA: { last: 85 } }, "2026-10-07T15:00:00Z");
  const portfolio = aPortfolio({
    cash: 100_000,
    positions: [aPosition({ symbol: "NVDA", quantity: 40, avgPrice: 100 })],
  });

  it("S1-NVDA sells the whole position at standard, and holds at aggressive", () => {
    const standard = playbookIntents(
      [{ playbook: S1_NVDA, mode: "standard" }],
      context,
      portfolio,
      [],
    );
    expect(standard).toEqual([
      expect.objectContaining({
        symbol: "NVDA",
        side: "sell",
        quantity: 40,
        playbookId: "S1-NVDA",
      }),
    ]);
    const aggressive = playbookIntents(
      [{ playbook: S1_NVDA, mode: "aggressive" }],
      context,
      portfolio,
      [],
    );
    expect(aggressive.filter((i) => i.side === "sell")).toEqual([]);
  });

  describe("a play its stop sold out of a name stays out of it", () => {
    const base: Persona = { id: "plain", name: "plain", thesis: "test", decide: () => [] };
    // S1-NVDA's window open: NVDA reports 2026-11-18, confirmed; 2026-10-28 is about D-15.
    const NVDA_PRINT = {
      symbol: "NVDA",
      date: "2026-11-18",
      status: "confirmed" as const,
      source: "test",
      window: { start: "2026-11-17", end: "2026-11-19" },
    };
    const PRINT = [NVDA_PRINT];
    const at = (iso: string, last: number) => aContext({ NVDA: { last } }, iso);
    const flat = aPortfolio({ cash: 100_000 });

    it("does not buy back while its window is still open, and says why once", () => {
      const said: string[] = [];
      const bot = withPlaybooks(
        base,
        [{ playbook: S1_NVDA, mode: "standard" }],
        PRINT,
        [],
        undefined,
        (l) => said.push(l),
      );
      expect(bot.decide(at("2026-10-28T15:00:00Z", 100), flat)).toEqual([
        expect.objectContaining({ side: "buy", symbol: "NVDA" }),
      ]);
      const trip = bot.decide(at("2026-10-29T15:00:00Z", 85), portfolio);
      expect(trip).toEqual([expect.objectContaining({ side: "sell", quantity: 40 })]);
      // Flat again, the window still "long": no buy-back, the next day included.
      expect(bot.decide(at("2026-10-29T15:05:00Z", 85), flat)).toEqual([]);
      expect(bot.decide(at("2026-10-30T15:00:00Z", 90), flat)).toEqual([]);
      expect(said).toEqual([
        "S1-NVDA was stopped out of NVDA; it opens nothing on it until its window closes",
      ]);
    });

    it("opens again in the next window, once this one has closed — the same bot, one memory", () => {
      const next = {
        ...NVDA_PRINT,
        date: "2027-02-24",
        window: { start: "2027-02-23", end: "2027-02-25" },
      };
      const bot = withPlaybooks(base, [{ playbook: S1_NVDA, mode: "standard" }], [...PRINT, next]);
      bot.decide(at("2026-10-29T15:00:00Z", 85), portfolio);
      expect(bot.decide(at("2026-10-30T15:00:00Z", 90), flat)).toEqual([]);
      // D-5 and after: the window is flat, which clears the latch.
      expect(bot.decide(at("2026-11-12T15:00:00Z", 90), flat)).toEqual([]);
      expect(bot.decide(at("2027-02-01T15:00:00Z", 90), flat)).toEqual([
        expect.objectContaining({ side: "buy", symbol: "NVDA" }),
      ]);
    });
  });

  describe("SAURON on his own account, where his rules run as the persona", () => {
    // A stand-in for his rules that wants to ADD to the loser: the stop must win the name.
    const rules: Persona = {
      id: SAURON.rulesOf ?? "sauron",
      name: "Sauron",
      thesis: "test",
      decide: () => [
        { symbol: "NVDA", side: "buy", quantity: 5, type: "market", reason: "panic claim" },
        { symbol: "AMD", side: "buy", quantity: 5, type: "market", reason: "panic claim" },
      ],
    };
    const sauron = { ...SAURON, symbols: ["NVDA", "AMD"] };

    it("sells the stopped name, stamped SAURON, and drops his reflex on it for the cycle", () => {
      const intents = withPlaybooks(rules, [{ playbook: sauron, mode: "standard" }], []).decide(
        context,
        portfolio,
      );
      expect(intents).toEqual([
        expect.objectContaining({
          symbol: "NVDA",
          side: "sell",
          quantity: 40,
          playbookId: "SAURON",
          urgent: true,
        }),
        expect.objectContaining({ symbol: "AMD", side: "buy", playbookId: "SAURON" }),
      ]);
    });

    it("still stops while paused: a pause holds opens, never a way out", () => {
      const intents = withPlaybooks(
        rules,
        [{ playbook: sauron, mode: "standard", exitsOnly: true }],
        [],
      ).decide(context, portfolio);
      expect(intents.filter((i) => i.symbol === "NVDA")).toEqual([
        expect.objectContaining({ side: "sell", quantity: 40, playbookId: "SAURON" }),
      ]);
    });

    it("changes nothing while the position is inside its stop", () => {
      const calm = aContext({ NVDA: { last: 95 } }, "2026-10-07T15:00:00Z");
      const intents = withPlaybooks(rules, [{ playbook: sauron, mode: "standard" }], []).decide(
        calm,
        portfolio,
      );
      expect(intents.map((i) => `${i.symbol}:${i.side}`)).toEqual(["NVDA:buy", "AMD:buy"]);
    });

    it("buys the stopped name back no sooner than the next session", () => {
      const bot = withPlaybooks(rules, [{ playbook: sauron, mode: "standard" }], []);
      bot.decide(context, portfolio);
      const flat = aPortfolio({ cash: 100_000 });
      const sameDay = bot.decide(aContext({ NVDA: { last: 85 } }, "2026-10-07T18:00:00Z"), flat);
      expect(sameDay.map((i) => i.symbol)).toEqual(["AMD"]);
      const nextDay = bot.decide(aContext({ NVDA: { last: 85 } }, "2026-10-08T15:00:00Z"), flat);
      expect(nextDay.map((i) => i.symbol)).toEqual(["NVDA", "AMD"]);
    });
  });
});

describe("the safeguard ladder shows the stop armed, and an option play's own exits", () => {
  it("reads enforcing on a house share play", () => {
    const [entry] = safeguardLadderView([
      { playbookId: "S1-NVDA", mode: "standard", state: "long" },
    ]);
    expect(entry?.stages?.[1]).toMatchObject({ state: "enforcing" });
    expect(entry?.stages?.[1]?.does).toContain("12.0%");
  });

  it("names the long call's target and time rules where it has no stop", () => {
    const [entry] = safeguardLadderView([
      { playbookId: "CRWV-LONG-CALL", mode: "standard", state: "long" },
    ]);
    expect(entry?.stages?.[1]).toMatchObject({ state: "off" });
    expect(entry?.stages?.[1]?.does).toBe(
      "No stop on a losing position on standard. This play gets out on its own rules: it sells " +
        "everything once the bid is 2× the average cost; it sells everything with 45 days left to expiry.",
    );
  });

  it("reads every option play's own exits as sentences: each one is a verb phrase", () => {
    for (const p of registeredPlaybooks().filter((x) => x.options)) {
      for (const line of [p.exits?.target, p.exits?.time].filter(Boolean)) {
        expect(line).toMatch(/^(sells|holds) /);
      }
    }
  });
});
