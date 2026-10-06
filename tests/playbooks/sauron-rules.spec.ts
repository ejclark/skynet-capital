import { BOTS_UNIVERSE } from "../../src/domain/bots-universe.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookMode,
  Portfolio,
} from "../../src/domain/types.js";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.js";
import type { Persona } from "../../src/personas/persona.js";
import { applyHardcore } from "../../src/personas/registry.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { SauronHardcorePersona } from "../../src/personas/sauron-hardcore.js";
import { claimOptionUnderlyings } from "../../src/playbooks/option-ownership.js";
import { type EnabledPlaybook, playbookVerdicts } from "../../src/playbooks/playbook.js";
import {
  CRWV_WHEEL,
  findPlaybook,
  HC_SAURON,
  PLAYBOOK_WIRING_GAPS,
  S1_NVDA,
} from "../../src/playbooks/registry.js";
import { SAURON } from "../../src/playbooks/sauron-rules.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
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
