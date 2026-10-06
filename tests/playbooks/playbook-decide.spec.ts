import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  type ListedExpirations,
  NO_OPTION_DEMAND,
  type OptionDemand,
  type OrderIntent,
  type PlaybookMode,
} from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { mergeOptionDemand } from "../../src/playbooks/option-demand.js";
import { type Playbook, playbookIntents, playbookVerdicts } from "../../src/playbooks/playbook.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

// The widened playbook surface (#3208 / #4645): a `decide` playbook answers with whole intents, and
// the engine — not the playbook — decides which survive and whose name they carry.
const calendar: readonly EarningsPrint[] = [];
const ctx = aContext({ NVDA: { last: 100 }, AAPL: { last: 100 } }, "2026-10-21T15:00:00Z");
const order = (symbol: string, over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol,
  side: "buy",
  quantity: 1,
  type: "market",
  reason: "decided",
  ...over,
});

const deciding = (intents: readonly OrderIntent[], over: Partial<Playbook> = {}): Playbook => ({
  id: "NVDA-PLAY",
  symbols: ["NVDA"],
  thesis: "test",
  evidence: "test",
  size: { conservative: 0, standard: 0, aggressive: 0 },
  desiredState: () => "long",
  decide: () => intents,
  ...over,
});

describe("playbookIntents — a decide playbook", () => {
  it("stamps every intent with its own id and mode, whatever the play wrote", () => {
    const play = deciding([
      order("NVDA", { playbookId: "SOMEONE-ELSE", playbookMode: "aggressive" }),
    ]);
    expect(
      playbookIntents([{ playbook: play, mode: "conservative" }], ctx, aPortfolio(), calendar),
    ).toEqual([order("NVDA", { playbookId: "NVDA-PLAY", playbookMode: "conservative" })]);
  });

  it("keeps only intents on its own symbols", () => {
    const play = deciding([order("NVDA"), order("AAPL")]);
    const intents = playbookIntents(
      [{ playbook: play, mode: "standard" }],
      ctx,
      aPortfolio(),
      calendar,
    );
    expect(intents.map((i) => i.symbol)).toEqual(["NVDA"]);
  });

  it("is called instead of desiredState and tactics, and hands them the cycle's own inputs", () => {
    const seen: unknown[] = [];
    const play = deciding([], {
      tactics: [],
      decide: (context, portfolio, cal, mode: PlaybookMode) => {
        seen.push([context, portfolio, cal, mode]);
        return [];
      },
    });
    const portfolio = aPortfolio({ cash: 1 });
    expect(
      playbookIntents([{ playbook: play, mode: "aggressive" }], ctx, portfolio, calendar),
    ).toEqual([]);
    expect(seen).toEqual([[ctx, portfolio, calendar, "aggressive"]]);
    // The verdict still comes from desiredState: a decide play is still an honest roll-call entry.
    expect(
      playbookVerdicts(
        [{ playbook: { ...play, tactics: undefined }, mode: "standard" }],
        ctx.asOf,
        calendar,
      ),
    ).toEqual([{ playbookId: "NVDA-PLAY", mode: "standard", state: "long" }]);
  });

  it("skips a symbol an exit-safety trip already claimed this cycle", () => {
    const play = deciding([order("NVDA")], {
      exitSafety: { standard: { drawdownTripPct: 0.1, enforcement: "enforce" } },
    });
    const underwater = aPortfolio({
      positions: [aPosition({ symbol: "NVDA", quantity: 10, avgPrice: 150 })],
    });
    const intents = playbookIntents(
      [{ playbook: play, mode: "standard" }],
      ctx,
      underwater,
      calendar,
    );
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({ side: "sell", urgent: true }); // the trip, not the play
  });
});

describe("withPlaybooks — option plays", () => {
  const chain = (underlying: string, expiration: string) =>
    ({ underlying, expiration, type: "call" }) as const;
  const optionPlay = (id: string, underlying: string, demand: OptionDemand): Playbook =>
    deciding([], {
      id,
      symbols: [underlying],
      options: { underlyings: [underlying], holdsShortToExpiry: [], requiredLevel: 3 },
      optionDemand: (_asOf, _portfolio, _listed: ListedExpirations, _cal, mode) =>
        mode === "standard" ? demand : NO_OPTION_DEMAND,
    });
  const base: Persona = { id: "base", name: "Base", thesis: "t", decide: () => [] };

  it("tells the trader which underlyings it trades, and merges every play's demand once", () => {
    const shared = chain("NVDA", "2026-11-13");
    const composed = withPlaybooks(
      base,
      [
        {
          playbook: optionPlay("A", "NVDA", { chains: [shared], contracts: ["X"] }),
          mode: "standard",
        },
        {
          playbook: optionPlay("B", "CRWV", { chains: [shared], contracts: ["X", "Y"] }),
          mode: "standard",
        },
        { playbook: deciding([], { id: "SHARES" }), mode: "standard" },
      ],
      calendar,
    );
    expect(composed.optionUnderlyings).toEqual(["NVDA", "CRWV"]);
    expect(composed.optionDemand?.(ctx.asOf, aPortfolio(), {})).toEqual({
      chains: [shared],
      contracts: ["X", "Y"],
    });
  });

  it("passes each play its own mode, and a roster with no option play carries no option surface", () => {
    const composed = withPlaybooks(
      base,
      [{ playbook: optionPlay("A", "NVDA", { chains: [], contracts: ["X"] }), mode: "aggressive" }],
      calendar,
    );
    expect(composed.optionDemand?.(ctx.asOf, aPortfolio(), {})).toEqual(NO_OPTION_DEMAND);
    const sharesOnly = withPlaybooks(
      base,
      [{ playbook: deciding([]), mode: "standard" }],
      calendar,
    );
    expect(sharesOnly.optionDemand).toBeUndefined();
    expect(sharesOnly.optionUnderlyings).toBeUndefined();
  });

  it("mergeOptionDemand of nothing needs nothing", () => {
    expect(mergeOptionDemand([NO_OPTION_DEMAND, { chains: [], contracts: [] }])).toBe(
      NO_OPTION_DEMAND,
    );
  });
});
