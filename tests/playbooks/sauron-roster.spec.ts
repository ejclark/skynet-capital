import type { Bot } from "../../src/bots/bot.js";
import { BOTS_UNIVERSE } from "../../src/domain/bots-universe.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { OrderIntent, PlaybookMode, PlaybookSubscription } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { applyHardcore, createDefaultPersonas } from "../../src/personas/registry.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { betaScoutIntents } from "../../src/playbooks/beta-scout.js";
import {
  claimOptionUnderlyings,
  onePerPlaybook,
  yieldPersonaRules,
} from "../../src/playbooks/option-ownership.js";
import type { EnabledPlaybook } from "../../src/playbooks/playbook.js";
import { enabledPlaybooks, NVDA_CALL_SPREAD, S1_NVDA } from "../../src/playbooks/registry.js";
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
 * PAUSE STOPS A PLAYBOOK OPENING ANYTHING NEW; ITS OWNERSHIP AND EXITS ARE UNCHANGED (#4651, round
 * 5). A paused subscription stays on the roster exits-only, env-named or Store-only: it sells on its
 * own exit rules, opens nothing but a covered call, and keeps its names exactly as when it runs —
 * held or flat — so nothing else opens a position that its paused exits would then govern. Round 4
 * held a paused name from the bot's own rules only while it was held: they bought it flat, then lost
 * their own exits on it. The scenarios below are the ones that review reproduced.
 */
describe("Pause stops new opens; ownership and exits are unchanged", () => {
  const ids = (roster: { readonly enabled: readonly EnabledPlaybook[] }) =>
    roster.enabled.map((e) => `${e.playbook.id}:${e.mode}${e.exitsOnly ? " (paused)" : ""}`);
  const envS1 = enabledPlaybooks({ SKYNET_PLAYBOOKS: "S1-NVDA" }).enabled;
  const envSauron = enabledPlaybooks({ SKYNET_PLAYBOOKS: "SAURON" }).enabled;
  /** NVDA's confirmed print on Aug 26: S1-NVDA wants long at D-16, flat from D-5. */
  const PRINT: readonly EarningsPrint[] = [
    { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "test" },
  ];
  const D5 = "2026-08-21T15:00:00Z";
  const atD5 = aContext({ NVDA: { last: 100 } }, D5);
  const atD16 = aContext({ NVDA: { last: 100 } }, "2026-08-10T15:00:00Z");
  const holds20 = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 20 })] });
  const pausedS1 = [subscribed("sauron", "S1-NVDA", { enabled: false })];
  const decideOn = (
    roster: { readonly enabled: readonly EnabledPlaybook[] },
    context: ReturnType<typeof aContext>,
    portfolio: ReturnType<typeof aPortfolio>,
    base: Persona = quietBot("sauron"),
  ) =>
    withPlaybooks(base, roster.enabled, PRINT)
      .decide(context, portfolio)
      .map((i) => `${i.side} ${i.quantity} ${i.symbol} ${i.playbookId ?? "-"}`);

  it("S1-NVDA paused at D-5 holding NVDA still sells it before the print, env-named or not", () => {
    for (const env of [envS1, []]) {
      const roster = resolveBotRoster(botOf(quietBot("sauron")), env, pausedS1);
      expect(ids(roster)).toEqual(["S1-NVDA:standard (paused)"]);
      expect(decideOn(roster, atD5, holds20)).toEqual(["sell 20 NVDA S1-NVDA"]);
    }
  });

  it("that is the same sell it makes running, or when only the env names it", () => {
    const running = resolveBotRoster(botOf(quietBot("sauron")), envS1, [
      subscribed("sauron", "S1-NVDA", { mode: "conservative" }),
    ]);
    expect(ids(running)).toEqual(["S1-NVDA:conservative"]);
    expect(decideOn(running, atD5, holds20)).toEqual(["sell 20 NVDA S1-NVDA"]);
    const envOnly = resolveBotRoster(botOf(quietBot("sauron")), envS1, []);
    expect(ids(envOnly)).toEqual(["S1-NVDA:standard"]);
    expect(decideOn(envOnly, atD5, holds20)).toEqual(["sell 20 NVDA S1-NVDA"]);
  });

  it("paused, it never opens: inside its window and flat it buys nothing", () => {
    const running = resolveBotRoster(botOf(quietBot("sauron")), envS1, []);
    expect(decideOn(running, atD16, aPortfolio())).toEqual([
      expect.stringMatching(/^buy \d+ NVDA S1-NVDA$/),
    ]);
    const paused = resolveBotRoster(botOf(quietBot("sauron")), envS1, pausedS1);
    expect(decideOn(paused, atD16, aPortfolio())).toEqual([]);
  });

  // Review scenario 1: a flat paused name is still the playbook's, so Sauron's panic buys none of it.
  it("paused S1-NVDA keeps NVDA flat: Sauron's panic claim on it buys nothing", () => {
    const sauron = new SauronPersona();
    const roster = resolveBotRoster(botOf(sauron), [], pausedS1);
    const panic = aContext({ NVDA: { sentiment: -0.9, momentum: 0.01 } }, "2026-10-06T15:00:00Z");
    expect(sauron.decide(panic, aPortfolio())).toHaveLength(1);
    expect(decideOn(roster, panic, aPortfolio(), sauron)).toEqual([]);
  });

  // Review scenario 2: no buy/sell churn at D-5 — the bot's own rules never buy what S1 then sells.
  it("at D-5 there is no churn: one S1-NVDA sell when held, and nothing when flat", () => {
    const sauron = new SauronPersona();
    const roster = resolveBotRoster(botOf(sauron), [], pausedS1);
    const panicAtD5 = aContext({ NVDA: { sentiment: -0.9, momentum: 0.01 } }, D5);
    expect(decideOn(roster, panicAtD5, holds20, sauron)).toEqual(["sell 20 NVDA S1-NVDA"]);
    expect(decideOn(roster, panicAtD5, aPortfolio(), sauron)).toEqual([]);
  });

  // Review scenario 3: paused SAURON on another bot keeps all ten names, as when it runs.
  it("paused SAURON on another bot keeps all ten names: the day trader buys none of them", () => {
    const dayTrader = createDefaultPersonas().find((p) => p.id === "day-trader");
    if (!dayTrader) throw new Error("no day trader");
    const roster = resolveBotRoster(
      botOf(dayTrader),
      [],
      [subscribed("day-trader", "SAURON", { enabled: false })],
    );
    const runs = aContext({ AAPL: { momentum: 0.03 }, MSFT: { momentum: 0.03 } });
    expect(dayTrader.decide(runs, aPortfolio()).length).toBeGreaterThan(0);
    expect(decideOn(roster, runs, aPortfolio(), dayTrader)).toEqual([]);
  });

  it("paused SAURON on another bot buys nothing, and still sells a holding when euphoria rolls over", () => {
    const futurist = quietBot("futurist");
    const roster = resolveBotRoster(botOf(futurist), envSauron, [
      subscribed("futurist", "SAURON", { enabled: false }),
    ]);
    expect(ids(roster)).toEqual(["SAURON:standard (paused)"]);
    const panic = aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } });
    expect(decideOn(roster, panic, aPortfolio(), futurist)).toEqual([]);
    const euphoria = aContext({ AAPL: { sentiment: 0.8, momentum: -0.01 } });
    const holdsAapl = aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 10 })] });
    expect(decideOn(roster, euphoria, holdsAapl, futurist)).toEqual(["sell 10 AAPL SAURON"]);
  });

  it("paused, its names stay its own everywhere: the scout, SAURON's yield and option claims", () => {
    const roster = resolveBotRoster(botOf(quietBot("sauron")), [], pausedS1);
    expect(scoutSkipSymbols(roster)).toEqual(new Set(["NVDA"]));
    const pausedS1Entry = {
      playbook: S1_NVDA,
      mode: "standard" as const,
      exitsOnly: true as const,
    };
    const yielded = yieldPersonaRules(
      [pausedS1Entry, { playbook: SAURON, mode: "standard" }],
      () => undefined,
    );
    expect(yielded[1]?.playbook.symbols).not.toContain("NVDA");
    const claimed = claimOptionUnderlyings(
      [
        { playbook: NVDA_CALL_SPREAD, mode: "standard", exitsOnly: true },
        { playbook: S1_NVDA, mode: "standard" },
      ],
      () => undefined,
    );
    expect(claimed[1]?.playbook.symbols).toEqual([]);
  });

  it("the guards pass a paused playbook's exit: a paused subscription's cap and filter refuse no sell", () => {
    const roster = resolveBotRoster(
      botOf(quietBot("sauron")),
      [],
      [subscribed("sauron", "S1-NVDA", { enabled: false, capitalAllocated: 1, symbols: ["AAPL"] })],
    );
    const { risk } = tradingRoster(roster, DEFAULT_RISK_CONFIG);
    const raw = withPlaybooks(quietBot("sauron"), roster.enabled, PRINT).decide(atD5, holds20);
    expect(raw).toHaveLength(1);
    expect(applyGuardsWithVerdicts(raw, holds20, atD5, risk).approved).toEqual(raw);
  });

  // His own rules have no basket of positions apart from himself, so there is nothing for a paused
  // SAURON to manage on his account: it is ignored, and his reflexes run unlabelled as before.
  it("paused SAURON on Sauron's account is ignored: his rules trade unlabelled, buys and sells", () => {
    const roster = resolveBotRoster(botOf(new SauronPersona()), envSauron, [
      subscribed("sauron", "SAURON", { enabled: false }),
    ]);
    expect(ids(roster)).toEqual(["SAURON:standard (paused)"]);
    const composed = tradingRoster(roster, DEFAULT_RISK_CONFIG).persona;
    const panic = aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } });
    expect(composed.decide(panic, aPortfolio())).toEqual(
      new SauronPersona().decide(panic, aPortfolio()),
    );
    expect(composed.playbookVerdicts?.(panic)).toEqual([]);
  });
});

/** The Pause row says what pausing does to his buys: once his orders carry no SAURON id, no subscribed
 *  playbook placed them, so the guards refuse every buy (#4642 slice 10) — before slice 10 they ran
 *  unlabelled and unlimited. */
describe("what the Pause row says about his buys is what the guards do", () => {
  it("subscribed with a cap and a filter his buys are clamped and refused; paused, every buy is refused", () => {
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
      const { approved, refused } = applyGuardsWithVerdicts(raw, aPortfolio(), panic, trading.risk);
      return [
        ...approved.map((i) => `${i.side} ${i.quantity} ${i.symbol} ${i.playbookId ?? "-"}`),
        ...refused.map((r) => `refused ${r.intent.symbol} ${r.reason}`),
      ];
    };
    const ask = panic.quotes.AAPL?.ask ?? 0;
    expect(run(true)).toEqual([
      `buy ${Math.floor(10_000 / ask)} AAPL SAURON`,
      "refused MSFT subscription-filter",
    ]);
    expect(run(false)).toEqual(["refused AAPL unsubscribed", "refused MSFT unsubscribed"]);
  });
});
