import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { Bot } from "../../src/bots/bot.js";
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import {
  aContext,
  anOptionQuote,
  aPortfolio,
  aSubscription,
  withOptionQuotes,
} from "../support/builders.js";

/**
 * EXITS NEVER STOP AFTER UNSUBSCRIBE (#5609; #4469 criterion 12, #5482 criterion 5), end to end on a
 * live bot: the roster the bots app builds (`resolveBotRoster` + `tradingRoster`), swapped in place
 * the way a Store change swaps it, a real `AutonomousTrader` cycle, the real guards. The playbook is
 * S1-NVDA (print Aug 26: opens from D-20, sells before D-5) on a bot with no rules of its own.
 */
const quiet: Persona = { id: "quiet", name: "Quiet", thesis: "t", decide: () => [] };
const bot: Bot = { persona: quiet, credentials: { apiKey: "k", apiSecret: "s" } };
const S1 = aSubscription("quiet", "S1-NVDA");
const QUIET_RISK = { ...DEFAULT_RISK_CONFIG, discipline: { calendar: UPCOMING_PRINTS } };

const ENTRY_DAY = "2026-08-05T15:00:00Z"; // inside S1's window (Wed, ~D-15)
const EXIT_DAY = "2026-08-20T15:00:00Z"; // past its D-5 exit
const AFTER = "2026-08-21T15:00:00Z";
const at = (iso: string) => aContext({ NVDA: { last: 100 } }, iso);

/** The decision store's ownership marker, as a fake: which names each playbook has placed orders on. */
const placedOn =
  (marks: Readonly<Record<string, readonly string[]>>) =>
  (playbookId: string): ReadonlySet<string> =>
    new Set(marks[playbookId] ?? []);

const rosterOf = (
  subscriptions: readonly PlaybookSubscription[],
  marks: Readonly<Record<string, readonly string[]>> = {},
) =>
  tradingRoster(resolveBotRoster(bot, [], subscriptions), QUIET_RISK, undefined, {
    placedBy: placedOn(marks),
  });

describe("unsubscribing S1-NVDA with a position open", () => {
  const broker = new InMemoryBroker(1_000_000, Object.values(at(ENTRY_DAY).quotes));
  const records: DecisionRecord[] = [];
  let clock = 0; // one day per cycle, so no cooldown spans two
  // What the decision store would hold: S1-NVDA placed its buy, so NVDA is on its marker.
  const marks: Record<string, string[]> = { "S1-NVDA": ["NVDA"] };
  const first = rosterOf([S1], marks);
  const trader = new AutonomousTrader({
    persona: first.persona,
    broker,
    risk: first.risk,
    mode: "live",
    now: () => 1_760_000_000_000 + clock * 86_400_000,
    onDecision: (r) => records.push(r),
  });
  const cycle = async (iso: string) => {
    records.length = 0;
    clock += 1;
    await trader.evaluate(at(iso));
    const placed = (records[0]?.outcomes ?? [])
      .filter((o) => o.action === "placed")
      .map((o) => `${o.intent.side} ${o.intent.symbol} ${o.intent.playbookId ?? "-"}`);
    const held = (await broker.getPortfolio()).positions.map((p) => `${p.symbol}:${p.quantity}`);
    return { placed, held };
  };
  const warn = rstest.spyOn(console, "warn").mockImplementation(() => undefined);
  afterAll(() => warn.mockRestore());

  it("subscribed: opens the position", async () => {
    const { placed, held } = await cycle(ENTRY_DAY);
    expect(placed).toEqual(["buy NVDA S1-NVDA"]);
    expect(held).toHaveLength(1);
  });

  it("unsubscribed, still holding: opens nothing new", async () => {
    trader.swapRoster(rosterOf([], marks));
    const { placed, held } = await cycle("2026-08-06T15:00:00Z");
    expect(placed).toEqual([]);
    expect(held).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(
      "[playbooks] quiet: S1-NVDA is unsubscribed but still holds positions — exits only until flat",
    );
  });

  it("unsubscribed, still holding: its time exit still fires", async () => {
    const { placed, held } = await cycle(EXIT_DAY);
    expect(placed).toEqual(["sell NVDA S1-NVDA"]);
    expect(held).toEqual([]);
  });

  it("flat: the playbook has left the roster and opens nothing", async () => {
    const { placed, held } = await cycle(AFTER);
    expect(placed).toEqual([]);
    expect(held).toEqual([]);
    expect(warn).toHaveBeenCalledWith("[playbooks] quiet: S1-NVDA is flat — off the roster");
  });
});

describe("an unsubscribed bot holding a name no playbook of its placed", () => {
  it("leaves the position to the bot's own rules: the playbook claims nothing without its marker", () => {
    const held = aPortfolio({ positions: [{ symbol: "NVDA", quantity: 12, avgPrice: 100 }] });
    const { persona } = rosterOf([], { "S1-NVDA": [] });
    expect(persona.decide(at(EXIT_DAY), held)).toEqual([]);
  });
});

describe("an unsubscribed bot with nothing held", () => {
  it("is exactly the roster's own persona: nothing decided", () => {
    const { persona } = rosterOf([]);
    expect(persona.decide(at(ENTRY_DAY), aPortfolio())).toEqual([]);
  });
});

describe("an unsubscribed CRWV-WHEEL holding assigned shares", () => {
  const NOV_18 = "2026-11-18T16:00:00Z";
  const call = (strike: number) =>
    buildOccSymbol({ underlying: "CRWV", expiration: "2026-12-31", type: "call", strike });
  const quotes = [95, 100, 105, 110, 115].map((strike, i) =>
    anOptionQuote(call(strike), {
      bid: 5.6 - i,
      ask: 5.9 - i,
      delta: 0.47 - i * 0.08,
      openInterest: 500,
      at: NOV_18,
    }),
  );
  const market = withOptionQuotes(aContext({ CRWV: { last: 92 } }, NOV_18), quotes, {
    CRWV: ["2026-12-31"],
  });
  const assigned = aPortfolio({
    cash: 100_000,
    positions: [{ symbol: "CRWV", quantity: 100, avgPrice: 80 }],
  });
  const liveRisk = { ...QUIET_RISK, optionsLevel: 1 };
  const trading = () =>
    tradingRoster(resolveBotRoster(bot, [], []), liveRisk, undefined, {
      placedBy: placedOn({ "CRWV-WHEEL": ["CRWV"] }),
    });

  it("still sells a covered call on the shares, through the real guards", () => {
    const t = trading();
    const raw = t.persona.decide(market, assigned);
    expect(raw).toEqual([
      expect.objectContaining({
        playbookId: "CRWV-WHEEL",
        option: expect.objectContaining({ structure: "covered-call", effect: "open" }),
      }),
    ]);
    const result = applyGuardsWithVerdicts(raw, assigned, market, t.risk);
    expect(result.refused).toEqual([]);
    expect(result.approved).toHaveLength(1);
  });

  it("flat, it opens no cash-secured put", () => {
    expect(trading().persona.decide(market, aPortfolio({ cash: 100_000 }))).toEqual([]);
  });
});
