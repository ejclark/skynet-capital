import type { Bot } from "../../src/bots/bot.js";
import { BOTS_UNIVERSE } from "../../src/domain/bots-universe.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { OrderIntent, PlaybookMode, PlaybookSubscription } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { applyHardcore } from "../../src/personas/registry.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { betaScoutIntents } from "../../src/playbooks/beta-scout.js";
import { onePerPlaybook, yieldPersonaRules } from "../../src/playbooks/option-ownership.js";
import type { EnabledPlaybook } from "../../src/playbooks/playbook.js";
import { enabledPlaybooks, S1_NVDA } from "../../src/playbooks/registry.js";
import { SAURON } from "../../src/playbooks/sauron-rules.js";
import { managedSymbols, withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { scoutSkipSymbols } from "../../src/scripts/autonomous-scout-staging.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * SAURON ON A LIVE ROSTER (#4651) — what happens to his playbook once env, subscriptions and the
 * ownership rules meet in `resolveBotRoster`: the beta scout, symbols other playbooks own, a capped
 * allocation, repeated env tokens, and Pause. Split from `sauron-rules.spec.ts` (the exactness
 * suite) by the two review rounds that produced every case here.
 */

const NO_PRINTS: readonly EarningsPrint[] = [];

const stamped = (intents: readonly OrderIntent[], mode: PlaybookMode): OrderIntent[] =>
  intents.map((i) => ({ ...i, playbookId: "SAURON", playbookMode: mode }));

/**
 * THE REVIEW OF 9a (449dc237) — each case below is a scenario that review reproduced against that
 * commit. Each one fails there.
 */
const subscribed = (
  accountId: string,
  playbookId: string,
  over: Partial<PlaybookSubscription> = {},
): PlaybookSubscription => ({
  accountId,
  playbookId,
  mode: "standard",
  enabled: true,
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
  ...over,
});
const botOf = (persona: Persona): Bot => ({
  persona,
  credentials: { apiKey: "k", apiSecret: "s" },
});
const quietBot = (id: string): Persona => ({ id, name: id, thesis: "test", decide: () => [] });

describe("review of 9a: his rules run once, even from a duplicated env roster", () => {
  // The env parser now refuses a repeat (round-3 check), so the duplicate is built by hand: this
  // pins withPlaybooks' own guard for any roster that reaches it with SAURON twice.
  it("a roster naming SAURON twice keeps the hardcore build exact, stamped by the first", () => {
    const { personas } = applyHardcore([new SauronPersona()], { SKYNET_HARDCORE_BOTS: "sauron" });
    const hardcore = personas[0];
    if (!hardcore) throw new Error("no persona");
    const enabled: EnabledPlaybook[] = [
      { playbook: SAURON, mode: "standard" },
      { playbook: SAURON, mode: "aggressive" },
    ];
    const panic = aContext({ AAPL: { sentiment: -0.9, momentum: 0.02 } });
    const composed = withPlaybooks(hardcore, enabled, NO_PRINTS);
    expect(composed.decide(panic, aPortfolio())).toEqual(
      stamped(hardcore.decide(panic, aPortfolio()), "standard"),
    );
  });

  // Re-review of ddf1c39c: the filter above held only on Sauron's account. The roster now resolves
  // to one entry per playbook id on every bot, so a repeated token never runs twice anywhere.
  it("a repeated SAURON token resolves to one entry on a non-Sauron bot — one buy, not two", () => {
    const { enabled } = enabledPlaybooks({ SKYNET_PLAYBOOKS: "SAURON,SAURON:aggressive" });
    const roster = resolveBotRoster(botOf(quietBot("futurist")), enabled, []);
    expect(roster.enabled.map((e) => `${e.playbook.id}:${e.mode}`)).toEqual(["SAURON:standard"]);
    const panic = aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } });
    const intents = tradingRoster(roster, DEFAULT_RISK_CONFIG).persona.decide(panic, aPortfolio());
    expect(intents.map((i) => `${i.side} ${i.symbol} ${i.playbookId}:${i.playbookMode}`)).toEqual([
      "buy AAPL SAURON:standard",
    ]);
  });

  it("the rule is per playbook, not per SAURON — HC-SAURON,HC-SAURON trades once per symbol", () => {
    const { enabled } = enabledPlaybooks({ SKYNET_PLAYBOOKS: "HC-SAURON,HC-SAURON" });
    const roster = resolveBotRoster(botOf(quietBot("futurist")), enabled, []);
    expect(roster.enabled).toHaveLength(1);
    const panic = aContext({ NVDA: { sentiment: -0.5, momentum: 0.01 } });
    const intents = tradingRoster(roster, DEFAULT_RISK_CONFIG).persona.decide(panic, aPortfolio());
    expect(intents.map((i) => `${i.side} ${i.symbol} ${i.playbookId}`)).toEqual([
      "buy NVDA HC-SAURON",
    ]);
  });

  it("the account's own subscription is the one entry that runs beside a repeated env token", () => {
    const { enabled } = enabledPlaybooks({ SKYNET_PLAYBOOKS: "SAURON,SAURON:aggressive" });
    const roster = resolveBotRoster(botOf(quietBot("futurist")), enabled, [
      subscribed("futurist", "SAURON", { mode: "conservative" }),
    ]);
    expect(roster.enabled.map((e) => `${e.playbook.id}:${e.mode}`)).toEqual([
      "SAURON:conservative",
    ]);
  });

  it("onePerPlaybook keeps the first entry per id and refuses each repeat out loud", () => {
    const log: string[] = [];
    const kept = onePerPlaybook(
      [
        { playbook: SAURON, mode: "standard" },
        { playbook: S1_NVDA, mode: "standard" },
        { playbook: SAURON, mode: "aggressive" },
      ],
      (line) => log.push(line),
    );
    expect(kept.map((e) => `${e.playbook.id}:${e.mode}`)).toEqual([
      "SAURON:standard",
      "S1-NVDA:standard",
    ]);
    expect(log).toEqual([
      "SAURON:aggressive refused — SAURON:standard is already on this bot's roster, and a " +
        "playbook runs once",
    ]);
  });

  it("onePerPlaybook drops one subscription filling two slots silently — nothing was refused", () => {
    const log: string[] = [];
    const override: EnabledPlaybook = { playbook: SAURON, mode: "conservative" };
    expect(onePerPlaybook([override, override], (line) => log.push(line))).toEqual([override]);
    expect(log).toEqual([]);
  });

  it("managedSymbols leaves out only the base persona's own rules", () => {
    const roster = [
      { playbook: S1_NVDA, mode: "standard" as const },
      { playbook: SAURON, mode: "standard" as const },
    ];
    expect([...managedSymbols("sauron", roster)]).toEqual(["NVDA"]);
    expect(managedSymbols("futurist", roster)).toEqual(new Set(BOTS_UNIVERSE));
  });
});

describe("review of 9a: the beta scout keeps Sauron's universe when he subscribes to his own rules", () => {
  /** A buy signal on every name: the scout picks wherever it is allowed to look. */
  const everyNameRuns = aContext(
    Object.fromEntries(BOTS_UNIVERSE.map((s) => [s, { momentum: 0.02, sentiment: 0.3 }])),
  );

  it("subscribed to SAURON and S1-NVDA, the scout skips NVDA alone — as it did before SAURON", () => {
    const sauron = botOf(new SauronPersona());
    const before = scoutSkipSymbols(
      resolveBotRoster(sauron, [], [subscribed("sauron", "S1-NVDA")]),
    );
    const skip = scoutSkipSymbols(
      resolveBotRoster(
        sauron,
        [],
        [subscribed("sauron", "SAURON"), subscribed("sauron", "S1-NVDA")],
      ),
    );
    expect([...skip]).toEqual(["NVDA"]);
    expect(skip).toEqual(before);
    const picks = betaScoutIntents(everyNameRuns, aPortfolio(), BOTS_UNIVERSE, skip, false);
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.map((p) => p.symbol)).not.toContain("NVDA");
  });

  it("on another bot SAURON's names are a playbook's, so the scout leaves them all", () => {
    const roster = resolveBotRoster(
      botOf(quietBot("futurist")),
      [],
      [subscribed("futurist", "SAURON")],
    );
    expect(scoutSkipSymbols(roster)).toEqual(new Set(BOTS_UNIVERSE));
    expect(scoutSkipSymbols(undefined)).toEqual(new Set());
  });
});

describe("review of 9a: SAURON yields every name another playbook on the bot trades", () => {
  it("on another bot it never sells S1-NVDA's NVDA, and still fades its own names", () => {
    const log: string[] = [];
    const roster = yieldPersonaRules(
      [
        { playbook: S1_NVDA, mode: "standard" },
        { playbook: SAURON, mode: "standard" },
      ],
      (line) => log.push(line),
    );
    expect(log).toEqual(["SAURON hands NVDA → S1-NVDA; it stops trading them on this bot"]);
    const euphoria = aContext({
      NVDA: { sentiment: 0.8, momentum: -0.01 },
      AAPL: { sentiment: 0.8, momentum: -0.01 },
    });
    const holding = aPortfolio({
      positions: [
        aPosition({ symbol: "NVDA", quantity: 400 }),
        aPosition({ symbol: "AAPL", quantity: 10 }),
      ],
    });
    const intents = withPlaybooks(quietBot("day-trader"), roster, NO_PRINTS).decide(
      euphoria,
      holding,
    );
    expect(intents.map((i) => `${i.side} ${i.quantity} ${i.symbol} ${i.playbookId}`)).toEqual([
      "sell 10 AAPL SAURON",
    ]);
  });

  it("the live roster resolution applies it — on another bot and on Sauron's own account", () => {
    for (const id of ["day-trader", "sauron"]) {
      const roster = resolveBotRoster(
        botOf(quietBot(id)),
        [],
        [subscribed(id, "S1-NVDA"), subscribed(id, "SAURON")],
      );
      const sauronEntry = roster.enabled.find((e) => e.playbook.id === "SAURON");
      expect(sauronEntry?.playbook.symbols).toEqual(BOTS_UNIVERSE.filter((s) => s !== "NVDA"));
      expect(sauronEntry?.playbook.rulesOf).toBe("sauron");
    }
  });

  it("leaves a roster with no persona-rules playbook exactly as it was", () => {
    const roster = [{ playbook: S1_NVDA, mode: "standard" as const }];
    expect(yieldPersonaRules(roster, () => undefined)).toEqual(roster);
  });

  /** One position, one allocation: S1-NVDA's 400 NVDA count against S1-NVDA's cap, never SAURON's. */
  it("a capped SAURON beside S1-NVDA sizes his buy against his own names only", () => {
    const roster = resolveBotRoster(
      botOf(new SauronPersona()),
      [],
      [
        subscribed("sauron", "S1-NVDA", { capitalAllocated: 40_000 }),
        subscribed("sauron", "SAURON", { capitalAllocated: 50_000 }),
      ],
    );
    const { risk } = tradingRoster(roster, { ...DEFAULT_RISK_CONFIG, maxPositionPct: 1 });
    const context = aContext({ AAPL: { last: 100 }, NVDA: { last: 100 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 400 })] });
    const buy: OrderIntent = {
      symbol: "AAPL",
      side: "buy",
      quantity: 500,
      type: "market",
      reason: "panic claim",
      playbookId: "SAURON",
      playbookMode: "standard",
    };
    const { approved } = applyGuardsWithVerdicts([buy], portfolio, context, risk);
    const ask = context.quotes.AAPL?.ask ?? 0;
    expect(approved).toEqual([{ ...buy, quantity: Math.floor(50_000 / ask) }]);
  });
});

/**
 * ROUND-3 CHECK — PAUSE (a pre-existing bug, fixed for every playbook). A paused subscription used
 * to be skipped before the merge, so a house entry of the same id from SKYNET_PLAYBOOKS kept
 * trading and Pause did nothing. Now a pause takes that id off the account's roster; an account
 * with no subscription to it keeps the house entry, as before.
 */
describe("round-3 check: Pause turns a playbook off on that account, even when the env names it", () => {
  const ids = (roster: { readonly enabled: readonly EnabledPlaybook[] }) =>
    roster.enabled.map((e) => `${e.playbook.id}:${e.mode}`);
  const envS1 = enabledPlaybooks({ SKYNET_PLAYBOOKS: "S1-NVDA" }).enabled;
  const envSauron = enabledPlaybooks({ SKYNET_PLAYBOOKS: "SAURON" }).enabled;
  const panic = aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } });

  it("a paused S1-NVDA subscription takes the env's S1-NVDA off that account", () => {
    const roster = resolveBotRoster(botOf(quietBot("sauron")), envS1, [
      subscribed("sauron", "S1-NVDA", { enabled: false }),
    ]);
    expect(ids(roster)).toEqual([]);
  });

  it("an enabled subscription runs on its own terms over the env entry", () => {
    const roster = resolveBotRoster(botOf(quietBot("sauron")), envS1, [
      subscribed("sauron", "S1-NVDA", { mode: "conservative" }),
    ]);
    expect(ids(roster)).toEqual(["S1-NVDA:conservative"]);
  });

  it("an account with no subscription to it keeps today's env entry", () => {
    expect(ids(resolveBotRoster(botOf(quietBot("sauron")), envS1, []))).toEqual([
      "S1-NVDA:standard",
    ]);
  });

  it("paused SAURON on another bot, with the env naming SAURON: nothing of his runs there", () => {
    const roster = resolveBotRoster(botOf(quietBot("futurist")), envSauron, [
      subscribed("futurist", "SAURON", { enabled: false }),
    ]);
    expect(ids(roster)).toEqual([]);
    expect(tradingRoster(roster, DEFAULT_RISK_CONFIG).persona.decide(panic, aPortfolio())).toEqual(
      [],
    );
  });

  it("paused SAURON on Sauron's account, with the env naming SAURON: his rules trade unlabelled", () => {
    const roster = resolveBotRoster(botOf(new SauronPersona()), envSauron, [
      subscribed("sauron", "SAURON", { enabled: false }),
    ]);
    expect(ids(roster)).toEqual([]);
    expect(tradingRoster(roster, DEFAULT_RISK_CONFIG).persona.decide(panic, aPortfolio())).toEqual(
      new SauronPersona().decide(panic, aPortfolio()),
    );
  });
});

/** The Pause row says pausing lifts the limits set in the Store along with the label: once his
 *  orders carry no SAURON id, the guards find no subscription to cap or filter them. */
describe("round-3 check: what the Pause row says about limits is what the guards do", () => {
  it("subscribed with a cap and a filter his buys are clamped and refused; paused, neither applies", () => {
    const panic = aContext({
      AAPL: { sentiment: -0.8, momentum: 0.01 },
      MSFT: { sentiment: -0.8, momentum: 0.01 },
    });
    const run = (enabled: boolean) => {
      const roster = resolveBotRoster(
        botOf(new SauronPersona()),
        [],
        [subscribed("sauron", "SAURON", { capitalAllocated: 10_000, symbols: ["AAPL"], enabled })],
      );
      const trading = tradingRoster(roster, { ...DEFAULT_RISK_CONFIG, maxPositionPct: 1 });
      const raw = trading.persona.decide(panic, aPortfolio());
      return applyGuardsWithVerdicts(raw, aPortfolio(), panic, trading.risk).approved.map(
        (i) => `${i.side} ${i.quantity} ${i.symbol} ${i.playbookId ?? "-"}`,
      );
    };
    const ask = panic.quotes.AAPL?.ask ?? 0;
    expect(run(true)).toEqual([`buy ${Math.floor(10_000 / ask)} AAPL SAURON`]);
    expect(run(false)).toEqual(
      new SauronPersona()
        .decide(panic, aPortfolio())
        .map((i) => `${i.side} ${i.quantity} ${i.symbol} -`),
    );
  });
});
