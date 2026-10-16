import type { Bot } from "../../src/bots/bot.js";
import type { Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { CRWV_WHEEL } from "../../src/playbooks/registry.js";
import { tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import {
  aContext,
  anOptionQuote,
  aPortfolio,
  aPosition,
  aSubscription,
  withOptionQuotes,
} from "../support/builders.js";

/**
 * #5483 slice 3 on the live wiring: the target observer sits inside `tradingRoster`, so the one
 * first-run bot logs where its wheel stands against its target on the path it trades. It changes
 * nothing it trades, and no other bot logs at all.
 */

const ASOF = "2026-11-18T16:00:00Z";
const stub = (id: string): Persona => ({ id, name: id, thesis: "n/a", decide: () => [] });
const botOf = (id: string): Bot => ({
  persona: stub(id),
  credentials: { apiKey: "k", apiSecret: "s" },
});
const put = (strike: number) =>
  buildOccSymbol({ underlying: "CRWV", expiration: "2026-12-31", type: "put", strike });
const market = (last: number) =>
  withOptionQuotes(
    aContext({ CRWV: { last } }, ASOF),
    [
      anOptionQuote(put(75), { bid: 1.65, ask: 1.85, delta: -0.15, openInterest: 500, at: ASOF }),
      anOptionQuote(put(80), { bid: 2.2, ask: 2.4, delta: -0.21, openInterest: 500, at: ASOF }),
    ],
    { CRWV: ["2026-11-20", "2026-12-18", "2026-12-31", "2027-01-15"] },
  );
const flat = (): Portfolio => aPortfolio({ cash: 100_000, positions: [] });
const held = (): Portfolio =>
  aPortfolio({
    cash: 30_000,
    positions: [aPosition({ symbol: "CRWV", quantity: 700, avgPrice: 100 })],
  });

const rosterFor = (account: string) =>
  tradingRoster(
    {
      bot: botOf(account),
      subscriptions: [aSubscription(account, "CRWV-WHEEL", { capitalAllocated: 100_000 })],
      enabled: [{ playbook: CRWV_WHEEL, mode: "standard" }],
    },
    { maxPositionPct: 0.03 },
  );

describe("tradingRoster: the play-target observer", () => {
  let log: ReturnType<typeof rstest.spyOn>;
  beforeEach(() => {
    log = rstest.spyOn(console, "log").mockImplementation(() => undefined);
  });
  afterEach(() => {
    log.mockRestore();
  });
  const said = () =>
    log.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .filter((l) => l.includes("[play-target]"));

  it("logs where the first-run bot's wheel stands, and what it would do at the signal", () => {
    const sauron = rosterFor("sauron");
    sauron.persona.decide(market(100), held());
    sauron.persona.decide(market(70), held());
    const lines = said();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("sauron CRWV-WHEEL: watching");
    expect(lines[1]).toContain("signal (under)");
    expect(lines[1]).toContain("no order placed, changed or held back");
  });

  it("logs nothing on any other bot", () => {
    const other = rosterFor("banker");
    other.persona.decide(market(70), held());
    expect(said()).toEqual([]);
  });

  it("trades exactly as an unobserved bot with the same roster: its decisions are unchanged", () => {
    const observed = rosterFor("sauron");
    const control = rosterFor("banker");
    let placed = 0;
    for (const book of [flat(), held()]) {
      for (const last of [100, 70, 40, 140]) {
        const a = observed.persona.decide(market(last), book);
        expect(a).toEqual(control.persona.decide(market(last), book));
        placed += a.length;
      }
    }
    expect(placed).toBeGreaterThan(0);
    expect(observed.persona.optionDemand).toBeDefined();
  });
});
