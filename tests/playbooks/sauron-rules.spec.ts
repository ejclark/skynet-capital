import type { Bot } from "../../src/bots/bot.js";
import { BOTS_UNIVERSE } from "../../src/domain/bots-universe.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookMode,
  PlaybookSubscription,
  Portfolio,
} from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.js";
import type { Persona } from "../../src/personas/persona.js";
import { applyHardcore } from "../../src/personas/registry.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { SauronHardcorePersona } from "../../src/personas/sauron-hardcore.js";
import { betaScoutIntents } from "../../src/playbooks/beta-scout.js";
import {
  claimOptionUnderlyings,
  onePerPlaybook,
  yieldPersonaRules,
} from "../../src/playbooks/option-ownership.js";
import { type EnabledPlaybook, playbookVerdicts } from "../../src/playbooks/playbook.js";
import {
  CRWV_WHEEL,
  enabledPlaybooks,
  findPlaybook,
  HC_SAURON,
  PLAYBOOK_WIRING_GAPS,
  S1_NVDA,
} from "../../src/playbooks/registry.js";
import { SAURON } from "../../src/playbooks/sauron-rules.js";
import { managedSymbols, withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { scoutSkipSymbols } from "../../src/scripts/autonomous-scout-staging.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * SAURON — his own persona rules as a subscribable playbook, exact by construction (#4642 slice 9a,
 * design on #4651). Subscribed, his intents are the bare persona's intents byte for byte, each
 * stamped with `playbookId: "SAURON"` and the subscription's mode. Unsubscribed, nothing changes.
 */

const MODES: readonly PlaybookMode[] = ["conservative", "standard", "aggressive"];
const NO_PRINTS: readonly EarningsPrint[] = [];

const stamped = (intents: readonly OrderIntent[], mode: PlaybookMode): OrderIntent[] =>
  intents.map((i) => ({ ...i, playbookId: "SAURON", playbookMode: mode }));

/** The characterization spec's two Sauron fixtures, plus contexts that exercise every branch of
 *  his rules at once — including GLD, a name outside the bots' universe: today he trades whatever
 *  is quoted, and subscribing must not narrow that. */
const SCENARIOS: readonly {
  readonly name: string;
  readonly context: MarketContext;
  readonly portfolio: Portfolio;
}[] = [
  {
    name: "euphoria rolled over on a held name — the fade",
    context: aContext({ AAPL: { sentiment: 0.8, momentum: -0.01 } }),
    portfolio: aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 50 })] }),
  },
  {
    name: "panic turning up on a flat name — the claim",
    context: aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } }),
    portfolio: aPortfolio(),
  },
  {
    name: "a mixed tape: a fade, two claims (one off-universe), a building hype and a falling knife",
    context: aContext({
      TSLA: { sentiment: 0.9, momentum: -0.02 },
      MSFT: { sentiment: -1, momentum: 0.03 },
      GLD: { sentiment: -0.75, momentum: 0.01 },
      META: { sentiment: 0.85, momentum: 0.04 },
      AMZN: { sentiment: -0.9, momentum: -0.02 },
    }),
    portfolio: aPortfolio({
      positions: [
        aPosition({ symbol: "TSLA", quantity: 30 }),
        aPosition({ symbol: "META", quantity: 10 }),
      ],
    }),
  },
  {
    name: "a quiet tape — nothing at an extreme",
    context: aContext({ NVDA: { sentiment: 0.2, momentum: 0.01 }, AAPL: {} }),
    portfolio: aPortfolio(),
  },
];

describe("SAURON on Sauron's own account — his persona's intents, stamped", () => {
  const bare = new SauronPersona();

  for (const { name, context, portfolio } of SCENARIOS) {
    for (const mode of MODES) {
      it(`${name} (${mode}): identical to the bare persona except the stamp`, () => {
        const composed = withPlaybooks(bare, [{ playbook: SAURON, mode }], NO_PRINTS);
        expect(composed.decide(context, portfolio)).toEqual(
          stamped(bare.decide(context, portfolio), mode),
        );
      });
    }
  }

  it("the fixtures are not vacuous — the mixed tape fires three intents, one on GLD", () => {
    const mixed = SCENARIOS[2];
    if (!mixed) throw new Error("fixture missing");
    const intents = bare.decide(mixed.context, mixed.portfolio);
    expect(intents.map((i) => `${i.side} ${i.symbol}`).sort()).toEqual([
      "buy GLD",
      "buy MSFT",
      "sell TSLA",
    ]);
  });

  it("runs his rules once — the playbook's own copy of them never runs beside the bot's", () => {
    let calls = 0;
    // A bot with Sauron's id whose own rules decide nothing: anything that appears came from a
    // second run of the standard rules.
    const silentSauron: Persona = {
      id: "sauron",
      name: "Sauron",
      thesis: "test",
      decide: () => {
        calls += 1;
        return [];
      },
    };
    const panic = aContext({ AAPL: { sentiment: -0.9, momentum: 0.02 } });
    const composed = withPlaybooks(
      silentSauron,
      [{ playbook: SAURON, mode: "standard" }],
      NO_PRINTS,
    );
    expect(composed.decide(panic, aPortfolio())).toEqual([]);
    expect(calls).toBe(1);
  });

  it("a hardcore build stays exact: its own intents are the ones stamped", () => {
    const { personas } = applyHardcore([new SauronPersona()], { SKYNET_HARDCORE_BOTS: "sauron" });
    const hardcore = personas[0];
    if (!hardcore) throw new Error("no persona");
    expect(hardcore).toBeInstanceOf(SauronHardcorePersona);
    // Loosened thresholds: the hardcore build claims a -0.5 panic and scalps a run, which the
    // standard rules would ignore — so a stand-in running the standard rules would fail here.
    const context = aContext({
      NVDA: { sentiment: -0.5, momentum: 0.01 },
      GOOGL: { sentiment: 0.1, momentum: 0.015 },
    });
    const portfolio = aPortfolio();
    const own = hardcore.decide(context, portfolio);
    expect(own.length).toBeGreaterThan(0);
    expect(new SauronPersona().decide(context, portfolio)).toEqual([]);
    const composed = withPlaybooks(hardcore, [{ playbook: SAURON, mode: "aggressive" }], NO_PRINTS);
    expect(composed.decide(context, portfolio)).toEqual(stamped(own, "aggressive"));
  });

  it("reports itself as reading live signals, not waiting for a window", () => {
    const composed = withPlaybooks(bare, [{ playbook: SAURON, mode: "standard" }], NO_PRINTS);
    const panic = aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } });
    expect(composed.playbookVerdicts?.(panic)).toEqual([
      { playbookId: "SAURON", mode: "standard", state: "tactical" },
    ]);
  });
});

describe("SAURON beside a playbook that owns symbols — those stay that playbook's", () => {
  const bare = new SauronPersona();
  /** NVDA's print 16 days out, confirmed: S1-NVDA's window is open, so it trades NVDA itself. */
  const S1_OPEN: readonly EarningsPrint[] = [
    { symbol: "NVDA", date: "2026-08-09", status: "confirmed", source: "test" },
  ];
  const context = aContext({
    NVDA: { sentiment: -0.9, momentum: 0.02 },
    AAPL: { sentiment: -0.9, momentum: 0.02 },
  });
  const portfolio = aPortfolio();

  it("with S1-NVDA on: his NVDA reflex stays suppressed exactly as today, the rest is stamped", () => {
    const today = withPlaybooks(bare, [{ playbook: S1_NVDA, mode: "standard" }], S1_OPEN).decide(
      context,
      portfolio,
    );
    const subscribed = withPlaybooks(
      bare,
      [
        { playbook: S1_NVDA, mode: "standard" },
        { playbook: SAURON, mode: "conservative" },
      ],
      S1_OPEN,
    ).decide(context, portfolio);

    // Today: S1's own NVDA entry, then his AAPL claim unlabelled — no reflex of his on NVDA.
    expect(today.map((i) => `${i.symbol} ${i.playbookId ?? "-"}`)).toEqual([
      "NVDA S1-NVDA",
      "AAPL -",
    ]);
    expect(subscribed).toEqual(
      today.map((i) =>
        i.playbookId ? i : { ...i, playbookId: "SAURON", playbookMode: "conservative" },
      ),
    );
  });

  it("with an option playbook claiming CRWV (as the live roster resolves it): CRWV stays the wheel's", () => {
    const crwvPanic = aContext({
      CRWV: { sentiment: -0.9, momentum: 0.02 },
      AAPL: { sentiment: -0.9, momentum: 0.02 },
    });
    const log: string[] = [];
    const roster: EnabledPlaybook[] = claimOptionUnderlyings(
      [
        { playbook: SAURON, mode: "standard" },
        { playbook: CRWV_WHEEL, mode: "standard" },
      ],
      (line) => log.push(line),
    );
    expect(log).toEqual(["SAURON hands CRWV → CRWV-WHEEL; it stops trading them on this bot"]);
    const intents = withPlaybooks(bare, roster, NO_PRINTS).decide(crwvPanic, portfolio);
    expect(intents.map((i) => i.symbol)).toEqual(["AAPL"]);
    expect(intents[0]).toMatchObject({ playbookId: "SAURON", playbookMode: "standard" });
  });
});

describe("no SAURON subscription — withPlaybooks is exactly what it was", () => {
  const bare = new SauronPersona();
  const context = aContext({
    NVDA: { sentiment: -0.9, momentum: 0.02 },
    AAPL: { sentiment: -0.9, momentum: 0.02 },
    GLD: { sentiment: -0.9, momentum: 0.02 },
  });
  const portfolio = aPortfolio();

  it("the dark default still hands back the bare persona itself", () => {
    expect(withPlaybooks(bare, [], NO_PRINTS)).toBe(bare);
  });

  it("beside S1-NVDA alone: his reflexes run unlabelled, suppressed only on NVDA", () => {
    const intents = withPlaybooks(
      bare,
      [{ playbook: S1_NVDA, mode: "standard" }],
      NO_PRINTS,
    ).decide(context, portfolio);
    expect(intents).toEqual(bare.decide(context, portfolio).filter((i) => i.symbol !== "NVDA"));
    for (const intent of intents) expect(intent).not.toHaveProperty("playbookId");
  });

  it("beside HC-SAURON: a playbook named for him is not his own rules — no stamping", () => {
    const intents = withPlaybooks(
      bare,
      [{ playbook: HC_SAURON, mode: "standard" }],
      NO_PRINTS,
    ).decide(context, portfolio);
    // HC-SAURON owns the universe (NVDA, AAPL); his GLD reflex passes through, unlabelled.
    const reflexes = intents.filter((i) => i.playbookId !== "HC-SAURON");
    expect(reflexes).toEqual(bare.decide(context, portfolio).filter((i) => i.symbol === "GLD"));
    expect(intents.some((i) => i.playbookId === "SAURON")).toBe(false);
  });
});

describe("SAURON on another bot — the standard rules, on the universe only", () => {
  const futurist: Persona = {
    id: "futurist",
    name: "Futurist",
    thesis: "test",
    decide: (): OrderIntent[] => [
      { symbol: "AAPL", side: "buy", quantity: 5, type: "market", reason: "own reflex" },
      { symbol: "GLD", side: "buy", quantity: 5, type: "market", reason: "own reflex" },
    ],
  };
  const context = aContext({
    AAPL: { sentiment: -0.8, momentum: 0.01 },
    TSLA: { sentiment: 0.8, momentum: -0.01 },
    GLD: { sentiment: -0.8, momentum: 0.01 },
  });
  const portfolio = aPortfolio({ positions: [aPosition({ symbol: "TSLA", quantity: 20 })] });

  it("trades default SauronPersona intents on universe symbols only, stamped SAURON", () => {
    const intents = withPlaybooks(
      futurist,
      [{ playbook: SAURON, mode: "aggressive" }],
      NO_PRINTS,
    ).decide(context, portfolio);
    const standard = new SauronPersona()
      .decide(context, portfolio)
      .filter((i) => BOTS_UNIVERSE.includes(i.symbol));
    expect(standard.map((i) => i.symbol).sort()).toEqual(["AAPL", "TSLA"]);
    expect(intents.filter((i) => i.playbookId === "SAURON")).toEqual(
      stamped(standard, "aggressive"),
    );
    // Its own rules lose the universe to the playbook (one position, one decision-maker) and keep
    // everything else — so GLD is the bot's own, and SAURON never touches it.
    expect(intents.filter((i) => i.playbookId === undefined)).toEqual([
      { symbol: "GLD", side: "buy", quantity: 5, type: "market", reason: "own reflex" },
    ]);
  });
});

describe("the SAURON definition", () => {
  it("names whose rules it runs, and trades the bots' universe — the same list HC-SAURON uses", () => {
    expect(findPlaybook("SAURON")).toBe(SAURON); // the Store and the roster resolve this object
    expect(SAURON.rulesOf).toBe(new SauronPersona().id);
    expect(SAURON.symbols).toBe(BOTS_UNIVERSE);
    expect(HC_SAURON.symbols).toBe(BOTS_UNIVERSE);
    expect([...BOTS_UNIVERSE]).toEqual([
      "AAPL",
      "MSFT",
      "NVDA",
      "GOOGL",
      "AMZN",
      "META",
      "AVGO",
      "TSLA",
      "CRWV",
      "MRVL",
    ]);
  });

  it("carries no exit-safety dial and no window — a trip would add a sell his rules never make", () => {
    expect(SAURON.exitSafety).toBeUndefined();
    expect(SAURON.tactics).toBeUndefined();
    expect(SAURON.options).toBeUndefined();
    expect(
      playbookVerdicts([{ playbook: SAURON, mode: "standard" }], "2026-10-06T15:00:00Z", []),
    ).toEqual([{ playbookId: "SAURON", mode: "standard", state: "tactical" }]);
  });

  it("is wired: the roll call never calls it blocked, and reads it as live signals when armed", () => {
    expect(PLAYBOOK_WIRING_GAPS.SAURON).toBeUndefined();
    expect(PLAYBOOK_WIRING_GAPS["HC-SAURON"]).toBeDefined();
    const [line] = playbookRollCall([
      { playbookId: "SAURON", mode: "standard", state: "tactical" },
    ]).filter((l) => l.playbookId === "SAURON");
    expect(line).toEqual({
      playbookId: "SAURON",
      status: "armed",
      mode: "standard",
      reason:
        "On, reading live price and sentiment every pass — there is no date window to wait for.",
    });
  });
});

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
  it("SKYNET_PLAYBOOKS naming SAURON twice keeps the hardcore build exact, stamped by the first", () => {
    const { personas } = applyHardcore([new SauronPersona()], { SKYNET_HARDCORE_BOTS: "sauron" });
    const hardcore = personas[0];
    if (!hardcore) throw new Error("no persona");
    const { enabled } = enabledPlaybooks({ SKYNET_PLAYBOOKS: "SAURON,SAURON:aggressive" });
    expect(enabled).toHaveLength(2);
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
