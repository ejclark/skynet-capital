import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { parseDecisionBatch, recordWireKind } from "../../src/autonomous/decision-wire.js";
import type { Bot } from "../../src/bots/bot.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.js";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { enabledPlaybooks } from "../../src/playbooks/registry.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { aContext, aSubscription } from "../support/builders.js";

/**
 * ONLY A SUBSCRIBED PLAYBOOK OPENS (#4642 slice 10) on a live bot, end to end: the roster the bots
 * app builds (`resolveBotRoster` + `tradingRoster`), one live `AutonomousTrader` cycle against a
 * broker, the decision record it writes, and that record crossing the bridge to the dashboard.
 * Sauron is the bot: panic on AAPL (his buy) and euphoria rolled over on MSFT, which he holds (his
 * sell).
 */
const bot: Bot = { persona: new SauronPersona(), credentials: { apiKey: "k", apiSecret: "s" } };
const market = aContext({
  AAPL: { last: 100, sentiment: -0.8, momentum: 0.01 },
  MSFT: { last: 100, sentiment: 0.8, momentum: -0.01 },
});

async function cycle(
  subscriptions: readonly PlaybookSubscription[],
  { ruleOff = false }: { readonly ruleOff?: boolean } = {},
) {
  const broker = new InMemoryBroker(1_000_000, Object.values(market.quotes));
  await broker.submit({ symbol: "MSFT", side: "buy", quantity: 7, type: "market", reason: "seed" });
  const trading = tradingRoster(resolveBotRoster(bot, [], subscriptions), DEFAULT_RISK_CONFIG);
  const { subscribedOnly: _, ...withoutRule } = trading.risk;
  const records: DecisionRecord[] = [];
  const trader = new AutonomousTrader({
    persona: trading.persona,
    broker,
    risk: ruleOff ? withoutRule : trading.risk,
    mode: "live",
    now: () => 1_760_000_000_000,
    onDecision: (r) => records.push(r),
  });
  await trader.evaluate(market);
  const [record] = records;
  if (!record) throw new Error("no decision recorded");
  const placed = record.outcomes
    .filter((o) => o.action === "placed")
    .map((o) => `${o.intent.side} ${o.intent.symbol} ${o.intent.playbookId ?? "-"}`);
  return { record, placed, portfolio: await broker.getPortfolio() };
}

describe("a bot with no subscriptions", () => {
  it("places no opens; its sell of a held position still runs", async () => {
    const { record, placed, portfolio } = await cycle([]);
    expect(placed).toEqual(["sell MSFT -"]);
    expect(record.refusals?.map((r) => `${r.intent.side} ${r.intent.symbol} ${r.reason}`)).toEqual([
      "buy AAPL unsubscribed",
    ]);
    expect(portfolio.positions.map((p) => p.symbol)).toEqual([]);
  });

  it("records the refusal so it reaches the dashboard whole, in plain words", async () => {
    const { record } = await cycle([]);
    const wire = JSON.parse(
      JSON.stringify({ kind: recordWireKind(record), personaId: "sauron", records: [record] }),
    );
    const [arrived] = parseDecisionBatch(wire)?.records ?? [];
    expect(arrived?.refusals).toEqual(record.refusals);
    const [row] = decisionCyclesView(arrived ? [arrived] : []).cycles;
    expect(row?.refusedIntents?.[0]).toMatchObject({
      symbol: "AAPL",
      guardReason: expect.stringMatching(/^not from a subscribed playbook/),
    });
  });
});

describe("a playbook named only in SKYNET_PLAYBOOKS", () => {
  // The env roster is not a grant: its playbook still runs its exits, and the boot log says it
  // opens nothing until the bot is subscribed, so a quiet playbook never reads as a quiet market.
  it("is said, on the roster's own line, to open nothing until the bot subscribes", () => {
    const warn = rstest.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const house = enabledPlaybooks({ SKYNET_PLAYBOOKS: "S1-NVDA,G1-GOOG" }).enabled;
      resolveBotRoster(bot, house, [aSubscription("sauron", "G1-GOOG")]);
      expect(warn).toHaveBeenCalledWith(
        "[playbooks] sauron is not subscribed to S1-NVDA (named in SKYNET_PLAYBOOKS) — they open nothing on it, exits still run; subscribe in the Store",
      );
      warn.mockClear();
      resolveBotRoster(bot, house, [
        aSubscription("sauron", "G1-GOOG"),
        aSubscription("sauron", "S1-NVDA", { enabled: false }),
      ]);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("Sauron and his own rules (SAURON)", () => {
  it("subscribed, he trades exactly as he did before the rule — every order stamped SAURON", async () => {
    const subscribed = [aSubscription("sauron", "SAURON")];
    const on = await cycle(subscribed);
    const before = await cycle(subscribed, { ruleOff: true });
    expect(on.record).toEqual(before.record);
    expect(on.placed).toEqual(["buy AAPL SAURON", "sell MSFT SAURON"]);
    expect(on.record.refusals).toBeUndefined();
  });

  it("paused on his own account, his buys are refused by name and his sells still run", async () => {
    const { record, placed } = await cycle([aSubscription("sauron", "SAURON", { enabled: false })]);
    expect(placed).toEqual(["sell MSFT -"]);
    expect(record.refusals?.map((r) => `${r.intent.symbol} ${r.reason}`)).toEqual([
      "AAPL unsubscribed",
    ]);
  });
});

describe("the forced daily pick on the roll call", () => {
  const scoutOn = [aSubscription("sauron", "BETA-SCOUT"), aSubscription("sauron", "SAURON")];
  const verdictsOf = (runsScout: boolean) =>
    tradingRoster(resolveBotRoster(bot, [], scoutOn), DEFAULT_RISK_CONFIG, undefined, {
      runsScout,
    }).persona.playbookVerdicts?.(market) ?? [];
  const lineFor = (runsScout: boolean) =>
    playbookRollCall(verdictsOf(runsScout)).find((l) => l.playbookId === "BETA-SCOUT");

  it("reads on only where it runs — subscribed on the bot it runs on, while armed", () => {
    expect(lineFor(true)).toMatchObject({ status: "armed" });
    expect(lineFor(true)?.reason).toContain("there is no date to wait for");
  });

  it("reads off on a bot it never runs on, or while unarmed, even when subscribed", () => {
    expect(lineFor(false)).toMatchObject({ status: "off" });
  });

  it("places nothing through the bot's own roster: its picks come from the live cycle", () => {
    const { persona } = tradingRoster(
      resolveBotRoster(bot, [], scoutOn),
      DEFAULT_RISK_CONFIG,
      undefined,
      { runsScout: true },
    );
    const without = tradingRoster(
      resolveBotRoster(bot, [], [aSubscription("sauron", "SAURON")]),
      DEFAULT_RISK_CONFIG,
    ).persona;
    expect(persona.decide(market, { cash: 1_000_000, positions: [] })).toEqual(
      without.decide(market, { cash: 1_000_000, positions: [] }),
    );
  });
});
