import { runCompanionTool } from "../../src/companion/companion-tools.js";
import {
  accountFor,
  parseSuggestInput,
  strategyFor,
  suggestionLink,
  suggestTradesResult,
} from "../../src/companion/suggest-trades-tool.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { GuidanceMarket } from "../../src/options/position-guidance-types.js";
import type { SuggestedTrade, TradeSuggestions } from "../../src/options/trade-suggestions.js";
import { CHAIN, NOW, SPOT } from "../options/position-guidance-fixture.js";

/**
 * "Stage a trade for NVDA" (#7547 slice 3; Eric, 2026-11-13). The tool reads the member's own
 * account from their snapshot, picks the strategy it can carry, runs the engine on the chain their
 * own client returned, and hands back three tiers whose links open `/trade` filled in. The world is
 * the engine spec's frozen CRWV chain (spot $80), so these run the real engine, offline.
 */

const snapshot = (positions: ParticipantSnapshot["positions"] = []): ParticipantSnapshot => ({
  id: "acct-1",
  displayName: "Test Account",
  kind: "human",
  cash: 40_000,
  equity: 100_000,
  positions,
  activity: [],
});

const market = {
  now: NOW,
  spot: SPOT,
  sessionOpen: true,
  chain: CHAIN,
} as unknown as GuidanceMarket;
const marketFor = rstest.fn(() => Promise.resolve(market));

describe("parseSuggestInput", () => {
  it("takes a ticker and an optional named strategy", () => {
    expect(parseSuggestInput({ underlying: " nvda " })).toEqual({ symbol: "NVDA" });
    expect(parseSuggestInput({ underlying: "CRWV", strategy: "covered-call" })).toEqual({
      symbol: "CRWV",
      strategy: "covered-call",
    });
    expect(parseSuggestInput({ underlying: "CRWV", strategy: "long-put" })).toEqual({
      symbol: "CRWV",
      strategy: "long-put",
    });
  });

  it("refuses an option symbol or a strategy the engine does not run", () => {
    expect(parseSuggestInput({ underlying: "CRWV261106P00080000" })).toHaveProperty("error");
    expect(parseSuggestInput({ underlying: "CRWV", strategy: "iron-condor" })).toHaveProperty(
      "error",
    );
  });
});

describe("accountFor + strategyFor — the account decides what it can carry", () => {
  it("reads shares, cost basis and calls already sold on this symbol only", () => {
    const account = accountFor(
      snapshot([
        { symbol: "CRWV", quantity: 300, avgPrice: 70, marketValue: 24_000 },
        { symbol: "CRWV261106C00090000", quantity: -1, avgPrice: 2, marketValue: -200 },
        { symbol: "AAPL", quantity: 50, avgPrice: 100, marketValue: 5_000 },
      ]),
      "CRWV",
    );
    expect(account).toEqual({
      equity: 100_000,
      cash: 40_000,
      shares: 300,
      callsSold: 1,
      costBasis: 70,
    });
  });

  it("chooses a covered call with 100 free shares, else a cash-secured put", () => {
    expect(strategyFor({ equity: 1, cash: 1, shares: 200 }, undefined)).toBe("covered-call");
    expect(strategyFor({ equity: 1, cash: 1, shares: 100, callsSold: 1 }, undefined)).toBe(
      "cash-secured-put",
    );
    expect(strategyFor({ equity: 1, cash: 1 }, undefined)).toBe("cash-secured-put");
    expect(strategyFor({ equity: 1, cash: 1 }, "covered-call")).toBe("covered-call");
  });
});

describe("suggestionLink — the link the trade form fills itself from", () => {
  it("names the whole ticket: rung, symbol, strike, expiry, contracts, limit and tier", () => {
    const link = suggestionLink({
      type: "put",
      side: "sell",
      symbol: "NVDA",
      strike: 170,
      expiration: "2026-12-18",
      contracts: 2,
      limit: 3.1,
      tier: "standard",
    } as SuggestedTrade);
    expect(link).toBe(
      "/trade?play=201&symbol=NVDA&strike=170&exp=2026-12-18&qty=2&limit=3.10&tier=standard",
    );
  });

  it("opens the buy rung for a long call or put: 302 buys a call, 301 a put (#7547 slice 4)", () => {
    const base = {
      side: "buy",
      symbol: "NVDA",
      strike: 160,
      expiration: "2027-01-15",
      contracts: 1,
      limit: 12.4,
      tier: "conservative",
    } as const;
    expect(suggestionLink({ ...base, type: "call" } as SuggestedTrade)).toMatch(
      /^\/trade\?play=302&symbol=NVDA&strike=160&exp=2027-01-15&qty=1&limit=12\.40/,
    );
    expect(suggestionLink({ ...base, type: "put" } as SuggestedTrade)).toMatch(
      /^\/trade\?play=301&/,
    );
  });
});

describe("get_sized_suggestions — end to end through the dispatcher", () => {
  beforeEach(() => {
    marketFor.mockClear();
  });

  it("stages three tiers on a member with no shares as cash-secured puts, each available one linked", async () => {
    const out = await runCompanionTool(
      "get_sized_suggestions",
      { snapshotFor: () => snapshot(), suggestMarketFor: marketFor },
      "acct-1",
      { underlying: "crwv" },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    type Linked = { readonly link?: string };
    const result = out.result as TradeSuggestions;
    expect(marketFor).toHaveBeenCalledWith("acct-1", "CRWV");
    expect(result.strategy).toBe("cash-secured-put");
    expect(result.options.map((o) => o.tier)).toEqual(["conservative", "standard", "high-risk"]);
    const linked = result.options.filter((o): o is SuggestedTrade => o.available);
    expect(linked.length).toBeGreaterThan(0);
    for (const o of linked) {
      const { link } = o as SuggestedTrade & Linked;
      expect(link).toMatch(/^\/trade\?play=201&symbol=CRWV&strike=\d/);
      expect(link).toContain(`&qty=${String(o.contracts)}&`);
      expect(link).toContain(`&tier=${o.tier}`);
    }
    for (const o of result.options.filter((x) => !x.available)) {
      expect((o as Linked).link).toBeUndefined();
    }
    expect(result.disclosure).toBeTruthy();
  });

  it("stages a named long call as three buys, each linked to the buy-a-call rung", async () => {
    const out = await suggestTradesResult(marketFor, snapshot(), "acct-1", {
      underlying: "CRWV",
      strategy: "long-call",
    });
    if (!out.ok) throw new Error(out.error);
    const result = out.result as TradeSuggestions;
    expect(result.strategy).toBe("long-call");
    const linked = result.options.filter((o): o is SuggestedTrade => o.available);
    expect(linked.length).toBeGreaterThan(0);
    for (const o of linked) {
      expect(o.side).toBe("buy");
      expect((o as SuggestedTrade & { readonly link?: string }).link).toMatch(
        /^\/trade\?play=302&symbol=CRWV&/,
      );
    }
  });

  it("says plainly when there is no desk, no market reader, or no chain", async () => {
    expect(
      await suggestTradesResult(marketFor, undefined, undefined, { underlying: "CRWV" }),
    ).toEqual({ ok: false, error: "no linked desk" });
    expect(
      await suggestTradesResult(undefined, snapshot(), "acct-1", { underlying: "CRWV" }),
    ).toEqual({ ok: false, error: "trade suggestions aren't available on this deployment" });
    const closed = rstest.fn(() => Promise.resolve({ reason: "no chain", note: "" }));
    const out = await suggestTradesResult(closed, snapshot(), "acct-1", { underlying: "CRWV" });
    expect(out).toEqual({
      ok: false,
      error: "couldn't read a live chain for CRWV right now: no chain",
    });
  });
});
