import { normalizeInputs } from "../../src/options/position-guidance-inputs.js";
import { manageCalls } from "../../src/options/position-guidance-manage.js";
import { dteStrip, etDateOf } from "../../src/options/position-guidance-rules.js";
import type {
  GuidanceInputs,
  GuidanceStake,
  OpenCall,
  PulseItem,
} from "../../src/options/position-guidance-types.js";
import { CHAIN, inputs, NOW, quoteAt } from "./position-guidance-fixture.js";

/**
 * `manageCalls` driven directly, one open covered call at a time (#3729 "Calls you've sold").
 * `position-guidance-manage.spec.ts` reaches it through the whole engine; this file pins the
 * rule order, the boundaries between rules, the plain-language lines and the PULSE refusals at the
 * function's own seam. Same frozen CRWV world: spot $80, 80% IV, an estimated earnings window of
 * Nov 9–16, today Fri Sep 25 (so Oct 2 is exactly 7 days out). Where a spec needs a verdict the
 * fixture's own prices can't produce (a cheap buy-back on an in-the-money call), it states the
 * `ask` outright rather than leaning on the chain.
 */

const STAKE: GuidanceStake = { shares: 400, costBasis: 70, cash: 0, goal: "income" };

type LeverContext = Parameters<typeof manageCalls>[0];

/** The context `positionGuidance` hands the lever — same hygiene, same expiry strip. */
function ctxOf(raw: GuidanceInputs): LeverContext {
  const today = etDateOf(raw.now);
  const { input } = normalizeInputs(raw, today);
  const expirations = input.expirations ?? input.chain.map((q) => q.expiration);
  const strip = dteStrip(expirations, today, input.earnings, input.catalysts, input.stake.goal);
  return { input, today, strip, richness: { verdict: "unknown", basis: "none" } };
}

function open(expiration: string, strike: number, premium: number, over: Partial<OpenCall> = {}) {
  const ask = quoteAt(expiration, strike, "call").ask;
  return {
    occ: `CRWV${expiration.slice(2).replaceAll("-", "")}C${String(strike * 1000).padStart(8, "0")}`,
    strike,
    expiration,
    contracts: 1,
    premium,
    ...(ask !== undefined ? { ask } : {}),
    ...over,
  } satisfies OpenCall;
}

function manage(
  openCalls: OpenCall[] | undefined,
  over: Partial<GuidanceInputs> = {},
  stake: GuidanceStake = STAKE,
) {
  const s: GuidanceStake = openCalls ? { ...stake, openCalls } : stake;
  return manageCalls(ctxOf(inputs({ stake: s, ...over })));
}

const textOf = (m: { reasons: readonly { text: string }[] } | undefined) =>
  m?.reasons.map((r) => r.text).join(" ") ?? "";

describe("manageCalls — what it returns", () => {
  it("returns nothing when the member has sold no calls", () => {
    expect(manage(undefined)).toEqual([]);
    expect(manage([])).toEqual([]);
  });

  it("returns one call per contract, in the order the account listed them", () => {
    const calls = manage([
      open("2026-10-16", 100, 2),
      open("2026-10-23", 105, 2),
      open("2026-10-09", 95, 2),
    ]);
    expect(calls.map((c) => c.expiration)).toEqual(["2026-10-16", "2026-10-23", "2026-10-09"]);
  });

  it("echoes the contract's own terms and the days left, so the hand-off can find it", () => {
    const c = open("2026-10-16", 100, 2, { contracts: 3 });
    const [m] = manage([c]);
    expect(m).toMatchObject({
      occ: c.occ,
      strike: 100,
      expiration: "2026-10-16",
      contracts: 3,
      dte: 21,
    });
  });

  it("grades every answered verdict medium — a mechanical rule is never high", () => {
    const calls = manage([
      open("2026-10-16", 100, 2), // keep
      open("2026-10-16", 100, 2, { ask: 0.5 }), // buy back
      open("2026-10-16", 75, 3), // in the money
    ]);
    expect(calls.map((c) => c.confidence)).toEqual(["medium", "medium", "medium"]);
  });

  it("judges each call on its own — one expired call doesn't stop the next being answered", () => {
    const calls = manage([open("2026-09-18", 100, 2, { ask: 0.05 }), open("2026-10-16", 100, 2)]);
    expect(calls.map((c) => c.call)).toEqual(["NO ANSWER", "KEEP"]);
  });
});

describe("manageCalls — refusing to answer", () => {
  it("reports an expired contract with the days it is past", () => {
    const [m] = manage([open("2026-09-18", 100, 2, { ask: 0.05 })]);
    expect(m?.dte).toBe(-7);
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]).toEqual({
      rule: "PULSE",
      text: "This call has expired — refresh your positions.",
    });
  });

  it("carries nothing actionable on a refusal: no grade, no falsifier, no plan for the open", () => {
    const [m] = manage([open("2026-10-16", 100, 2, { ask: undefined })], { sessionOpen: false });
    expect(m).toMatchObject({
      call: "NO ANSWER",
      confidence: "none",
      provesWrong: "",
      atOpen: false,
    });
    expect(m?.reasons).toHaveLength(1);
    expect(m?.until).toBeUndefined();
    expect(m?.rollTo).toBeUndefined();
    expect(m?.kept).toBeUndefined();
  });

  it("won't answer while a pulse says prices can't be trusted yet, and says why", () => {
    const pulse: PulseItem[] = [
      {
        id: "chain",
        source: "Alpaca indicative",
        asOf: NOW,
        status: "aging",
        note: "option marks and the stock price disagree out of hours",
        blocksPricing: true,
      },
    ];
    const [m] = manage([open("2026-10-16", 100, 2)], { pulse });
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]?.text).toBe(
      "Prices can't be trusted until the market opens — option marks and the stock price disagree out of hours.",
    );
  });

  it("names the stale option prices and tells the member to refresh", () => {
    const pulse: PulseItem[] = [
      { id: "chain", source: "Alpaca", asOf: NOW, status: "stale", note: "quotes 40 min old" },
    ];
    const [m] = manage([open("2026-10-16", 100, 2)], { pulse });
    expect(m?.reasons[0]?.text).toBe(
      "Option prices are out of date — quotes 40 min old. Refresh before acting.",
    );
  });

  it("quotes the stale stock price's own note", () => {
    const pulse: PulseItem[] = [
      { id: "spot", source: "IEX", asOf: NOW, status: "stale", note: "last trade 20 min old" },
    ];
    const [m] = manage([open("2026-10-16", 100, 2)], { pulse });
    expect(m?.reasons[0]?.text).toBe(
      "No answer — the stock price couldn't be verified: last trade 20 min old.",
    );
  });

  it("reports the expiry before anything else wrong with the inputs", () => {
    const pulse: PulseItem[] = [
      { id: "spot", source: "IEX", asOf: NOW, status: "stale", note: "20 min old" },
    ];
    const [m] = manage([open("2026-09-18", 100, 2, { ask: undefined })], { pulse });
    expect(m?.reasons[0]?.text).toContain("expired");
  });

  it("reports a missing buy-back price before a stale stock price", () => {
    const pulse: PulseItem[] = [
      { id: "spot", source: "IEX", asOf: NOW, status: "stale", note: "20 min old" },
    ];
    const [m] = manage([open("2026-10-16", 100, 2, { ask: undefined })], { pulse });
    expect(m?.reasons[0]?.text).toContain("No live price to buy it back at");
  });

  it("reports the stale stock price before a pricing blocker, and the blocker before stale options", () => {
    const stale = (id: PulseItem["id"], note: string): PulseItem => ({
      id,
      source: "x",
      asOf: NOW,
      status: "stale",
      note,
    });
    const blocker: PulseItem = { ...stale("session", "market closed"), blocksPricing: true };
    const c = open("2026-10-16", 100, 2);
    const spotFirst = manage([c], { pulse: [blocker, stale("spot", "old spot")] });
    expect(spotFirst[0]?.reasons[0]?.text).toContain("couldn't be verified");
    const blockerFirst = manage([c], { pulse: [stale("chain", "old chain"), blocker] });
    expect(blockerFirst[0]?.reasons[0]?.text).toContain("until the market opens");
  });
});

describe("manageCalls — the earnings report", () => {
  it("explains the report window in the member's words and says what would clear it", () => {
    const [m] = manage([open("2026-11-13", 95, 4)]);
    expect(m?.reasons[0]).toMatchObject({ rule: "DTE-PRINT" });
    expect(m?.reasons[0]?.text).toContain("(Nov 9–16, estimated)");
    expect(m?.reasons[0]?.text).toContain("past $95.00 overnight");
    expect(m?.provesWrong).toBe(
      "If the company announces its earnings date for after Nov 13 → this call no longer crosses the report.",
    );
  });

  it("states a roll that costs money as a net cost, in dollars a contract", () => {
    // Rolling back to a nearer expiry at the same strike gives up time value: a debit, allowed here.
    const [m] = manage([open("2026-11-13", 95, 4)]);
    expect(m?.call).toBe("ROLL");
    const net = m?.rollTo?.net ?? 0;
    expect(net).toBeLessThan(0);
    expect(m?.reasons[1]?.text).toContain(`a net cost of $${(-net * 100).toFixed(2)} a contract`);
  });

  it("states a roll that pays as a net credit", () => {
    const [m] = manage([open("2026-12-18", 100, 2, { ask: 1 })]);
    expect(m?.call).toBe("ROLL");
    const net = m?.rollTo?.net ?? -1;
    expect(net).toBeGreaterThanOrEqual(0);
    expect(m?.reasons[1]?.text).toContain(`a net credit of $${(net * 100).toFixed(2)} a contract`);
  });

  it("treats an expiry the chain doesn't list the same as one across the report", () => {
    const [m] = manage([open("2026-12-18", 100, 2, { ask: 1 })]);
    expect(m?.reasons[0]).toMatchObject({ rule: "DTE-PRINT" });
    expect(m?.reasons[0]?.text).toContain("still open through the earnings report");
    expect(m?.provesWrong).toContain("after Dec 18");
  });

  it("never rolls to an expiry that is itself still across the report", () => {
    const [m] = manage([open("2026-12-18", 100, 2, { ask: 1 })]);
    expect((m?.rollTo?.expiration ?? "9999-12-31") < "2026-11-09").toBe(true);
  });

  it("buys it back, and says to enter the cost basis, when there's no basis to build a roll on", () => {
    const { costBasis: _basis, ...noBasis } = STAKE;
    const [m] = manage([open("2026-11-13", 95, 4)], {}, noBasis);
    expect(m?.call).toBe("BUY BACK");
    expect(m?.rollTo).toBeUndefined();
    expect(m?.reasons[1]?.text).toContain("Enter what you paid per share");
  });

  it("buys it back, and says no roll fits, when the chain has nothing to roll into", () => {
    const onlyThatExpiry = CHAIN.filter((q) => q.expiration === "2026-11-13");
    const [m] = manage([open("2026-11-13", 95, 4)], { chain: onlyThatExpiry });
    expect(m?.call).toBe("BUY BACK");
    expect(m?.rollTo).toBeUndefined();
    expect(m?.reasons[1]?.text).toBe(
      "No call to roll into fits the rules right now, so buy this one back.",
    );
  });

  it("frees this call's own lots when looking for the call to roll into", () => {
    // All 100 shares are spoken for by the very call being rolled — it can still be replaced.
    const [m] = manage([open("2026-11-13", 95, 4)], {}, { ...STAKE, shares: 100 });
    expect(m?.call).toBe("ROLL");
    expect(m?.rollTo).toBeDefined();
  });

  it("keeps lots promised to other calls out of the roll — the lot freed is only this call's", () => {
    const stake = { ...STAKE, shares: 100, callsSold: 1 };
    const [m] = manage([open("2026-11-13", 95, 4)], {}, stake);
    expect(m?.call).toBe("ROLL");
  });

  it("with keep-shares, only the report window itself is off limits — not the hold-or-sell date", () => {
    const stake: GuidanceStake = { ...STAKE, goal: "keep-shares" };
    // Nov 6 is past the Nov 2 decision date but ends before the report opens.
    const [before] = manage([open("2026-11-06", 100, 2, { ask: 1.9 })], {}, stake);
    expect(before?.reasons[0]?.rule).not.toBe("DTE-PRINT");
    expect(before?.call).toBe("KEEP");
    const [across] = manage([open("2026-11-13", 100, 2, { ask: 1.9 })], {}, stake);
    expect(across?.reasons[0]?.rule).toBe("DTE-PRINT");
  });

  it("leaves a call alone for the report when no report is on the calendar", () => {
    const { earnings: _none, ...noEarnings } = inputs();
    const [m] = manageCalls(
      ctxOf({
        ...noEarnings,
        stake: { ...STAKE, openCalls: [open("2026-11-13", 100, 2, { ask: 1.9 })] },
      }),
    );
    expect(m?.call).toBe("KEEP");
    expect(m?.reasons.map((r) => r.rule)).not.toContain("DTE-PRINT");
  });
});

describe("manageCalls — in the money", () => {
  it("treats exactly a week left as urgent and eight days as not yet", () => {
    const [week] = manage([open("2026-10-02", 75, 3)]);
    const [eight] = manage([open("2026-10-03", 75, 3)]);
    expect(week?.dte).toBe(7);
    expect(week?.reasons[0]?.text).toContain(
      "with 7 days left — the shares will likely be called away",
    );
    expect(eight?.dte).toBe(8);
    expect(eight?.call).toBe("KEEP");
  });

  it("only calls it in the money once the stock is past the strike, not at it", () => {
    // Spot $80, strike $80: at the money is not past it — the premium rules apply instead.
    const [m] = manage([open("2026-10-02", 80, 3, { ask: 2.9 })]);
    expect(m?.call).toBe("KEEP");
    expect(textOf(m)).not.toContain("shares will likely be called away");
    expect(m?.reasons[0]?.text).toContain("Buying it back costs");
  });

  it("uses the singular for one day and the plural otherwise", () => {
    const exit: GuidanceStake = { ...STAKE, goal: "exit" };
    const [one] = manage([open("2026-09-26", 75, 3)], {}, exit);
    const [two] = manage([open("2026-09-27", 75, 3)], {}, exit);
    expect(one?.reasons[0]?.text).toContain("with 1 day left");
    expect(two?.reasons[0]?.text).toContain("with 2 days left");
  });

  it("rolls up and out for a credit when a call to roll into pays at least the buy-back", () => {
    // The ask is stated (the chain's own ask on an in-the-money call is far above any roll's bid).
    const [m] = manage([open("2026-10-02", 75, 3, { ask: 0.2 })]);
    expect(m?.call).toBe("ROLL");
    expect(m?.rollTo?.net).toBeGreaterThanOrEqual(0);
    expect(m?.rollTo?.strike).toBeGreaterThanOrEqual(75);
    expect((m?.rollTo?.expiration ?? "") > "2026-10-02").toBe(true);
    expect(m?.reasons[1]?.text).toContain("a net credit of");
    expect(m?.provesWrong).toBe(
      "If CRWV falls back below $75.00 before Oct 2 → the call expires worthless and you keep the shares.",
    );
  });

  it("buys it back — never rolls at a loss — when no later call pays for the buy-back", () => {
    const [m] = manage([open("2026-10-02", 75, 3)]);
    expect(m?.call).toBe("BUY BACK");
    expect(m?.rollTo).toBeUndefined();
    expect(m?.reasons[1]?.text).toBe(
      "No call to roll into fits the rules right now, so buy this one back.",
    );
  });

  it("with a week or less left and a member who wants out, lets it go and says what would undo it", () => {
    const [m] = manage(
      [open("2026-10-02", 75, 3, { contracts: 2 })],
      {},
      { ...STAKE, goal: "exit" },
    );
    expect(m?.call).toBe("LET IT GO");
    expect(m?.reasons.map((r) => r.rule)).toEqual(["MANAGE", "GOAL"]);
    expect(m?.reasons[1]?.text).toBe(
      "Let it go: 200 shares sell at $75.00 — the exit you asked for.",
    );
    expect(m?.provesWrong).toContain("falls back below $75.00 before Oct 2");
    expect(m?.until).toBeUndefined();
  });

  it("with more than a week left, keeps it and says so plainly — the shares sell at the strike", () => {
    const [m] = manage([open("2026-10-16", 75, 3, { contracts: 2 })]);
    expect(m?.call).toBe("KEEP");
    expect(m?.reasons[0]?.text).toBe(
      "CRWV is at $80.00, above your $75.00 strike — if it closes there on Oct 16, 200 shares sell at $75.00.",
    );
    expect(m?.reasons[2]?.text).toContain("Keeping it is fine if selling at $75.00 suits you");
    expect(m?.until).toEqual({
      date: "2026-10-16",
      why: "it's likely exercised — your shares sell at $75.00",
    });
  });

  it("with keep-shares and more than a week left, leaves the roll-or-buy-back to the member's goal", () => {
    const [m] = manage([open("2026-10-16", 75, 3)], {}, { ...STAKE, goal: "keep-shares" });
    expect(["ROLL", "BUY BACK"]).toContain(m?.call);
    expect(m?.reasons[0]?.text).toContain(
      "above your $75.00 strike — if it closes there on Oct 16",
    );
    expect(m?.until).toBeUndefined();
    expect(m?.provesWrong).toContain("falls back below $75.00 before Oct 16");
  });

  it("with no goal set, doesn't act for the member — it keeps and explains", () => {
    const { goal: _unset, ...noGoal } = STAKE;
    const [m] = manage([open("2026-10-16", 75, 3)], {}, noGoal);
    expect(m?.call).toBe("KEEP");
  });

  it("says plainly when buying back now costs more than the premium taken in, past the strike", () => {
    const [m] = manage([open("2026-10-16", 75, 1)]);
    expect(m?.kept).toBeLessThan(0);
    expect(m?.reasons[1]?.text).toMatch(
      /^Buying it back costs \$[\d,.]+ a contract — more than the \$100\.00 you took in, because the stock has risen past the strike\.$/,
    );
  });
});

describe("manageCalls — premium kept", () => {
  it("buys back at exactly half kept, and keeps just under it", () => {
    const [half] = manage([open("2026-10-16", 100, 2, { ask: 1 })]);
    const [under] = manage([open("2026-10-16", 100, 2, { ask: 1.02 })]);
    expect(half?.kept).toBe(0.5);
    expect(half?.call).toBe("BUY BACK");
    expect(under?.call).toBe("KEEP");
  });

  it("reports the share of premium kept as the fraction of what was taken in", () => {
    const [m] = manage([open("2026-10-16", 100, 2, { ask: 0.5 })]);
    expect(m?.kept).toBeCloseTo(0.75, 10);
    expect(m?.reasons[0]?.text).toBe(
      "Buying it back costs $50.00 a contract now — you've kept 75% of the $200.00 you took in.",
    );
  });

  it("says what's left is small pay for the days of capped shares, singular for one day", () => {
    const [many] = manage([open("2026-10-16", 100, 2, { ask: 0.5 })]);
    const [one] = manage([open("2026-09-26", 100, 2, { ask: 0.5 })]);
    expect(many?.reasons[1]?.text).toContain("for 21 more days of capping your shares");
    expect(one?.reasons[1]?.text).toContain("for 1 more day of capping your shares");
    expect(many?.provesWrong).toBe(
      "If CRWV keeps falling, holding would keep a little more — the trade-off is the risk you carry until Oct 16.",
    );
    expect(many?.until).toBeUndefined();
  });

  it("says plainly when it costs more than the premium, because the stock rose toward the strike", () => {
    const [m] = manage([open("2026-10-16", 100, 0.1)]);
    expect(m?.call).toBe("KEEP");
    expect(m?.kept).toBeLessThan(0);
    expect(m?.reasons[0]?.text).toMatch(
      /more than the \$10\.00 you took in, because the stock has risen toward the strike\.$/,
    );
  });

  it("keeps it below half and tells the member when to come back", () => {
    const [m] = manage([open("2026-10-16", 100, 2, { ask: 1.5 })]);
    expect(m?.call).toBe("KEEP");
    expect(m?.reasons[1]?.text).toBe("Time does the rest if CRWV stays below $100.00.");
    expect(m?.provesWrong).toBe(
      "If CRWV climbs toward $100.00 → come back; rolling or buying back may fit.",
    );
    expect(m?.until).toEqual({
      date: "2026-10-16",
      why: "it expires — or come back once about half the premium is kept",
    });
  });

  it("plans an action for the open only when the market is closed", () => {
    const sell = open("2026-10-16", 100, 2, { ask: 0.5 });
    const keep = open("2026-10-16", 100, 2, { ask: 1.5 });
    expect(manage([sell], { sessionOpen: true })[0]?.atOpen).toBe(false);
    expect(manage([sell], { sessionOpen: false })[0]?.atOpen).toBe(true);
    // A KEEP asks the member to do nothing, so there is no plan to hold for the open.
    expect(manage([keep], { sessionOpen: false })[0]?.atOpen).toBe(false);
  });

  it("holds a roll for the open too, when the market is closed", () => {
    const [m] = manage([open("2026-11-13", 95, 4)], { sessionOpen: false });
    expect(m?.call).toBe("ROLL");
    expect(m?.atOpen).toBe(true);
  });

  it("never turns a let-it-go into an order for the open — exercise isn't the member's trade", () => {
    const [m] = manage(
      [open("2026-10-02", 75, 3)],
      { sessionOpen: false },
      { ...STAKE, goal: "exit" },
    );
    expect(m?.call).toBe("LET IT GO");
    expect(m?.atOpen).toBe(false);
  });
});

describe("manageCalls — a member who wants out", () => {
  const exit: GuidanceStake = { ...STAKE, goal: "exit" };

  it("treats exercise as the exit: out of the money, it says both outcomes and what to do first", () => {
    const [m] = manage([open("2026-10-16", 100, 2)], {}, exit);
    expect(m?.call).toBe("KEEP");
    expect(m?.reasons.map((r) => r.rule)).toEqual(["GOAL", "MANAGE", "MANAGE"]);
    expect(m?.reasons[0]?.text).toBe(
      "Above $100.00 on Oct 16, 100 shares sell at $100.00 — the exit you asked for; below it you keep the premium and the shares.",
    );
    expect(m?.reasons[1]?.text).toContain("buy this call back first");
    expect(m?.provesWrong).toBe(
      "If CRWV is still below $100.00 near Oct 16 → the call expires, and you'd sell the shares another way.",
    );
    expect(m?.until).toEqual({ date: "2026-10-16", why: "it's exercised (your exit) or expires" });
  });

  it("never offers a roll or a buy-back on its own — even for a call that has kept most of its premium", () => {
    const [m] = manage([open("2026-10-16", 100, 2, { ask: 0.1 })], {}, exit);
    expect(m?.call).toBe("KEEP");
    expect(m?.rollTo).toBeUndefined();
  });

  it("lets it go at a week left, but only keeps it at eight days", () => {
    const [week] = manage([open("2026-10-02", 75, 3)], {}, exit);
    const [eight] = manage([open("2026-10-03", 75, 3)], {}, exit);
    expect(week?.call).toBe("LET IT GO");
    expect(eight?.call).toBe("KEEP");
    expect(eight?.reasons[0]?.rule).toBe("GOAL");
  });

  it("states how much of the premium is kept, honestly, even in the money", () => {
    const [m] = manage([open("2026-10-16", 75, 1)], {}, exit);
    expect(m?.call).toBe("KEEP");
    expect(m?.reasons[2]?.text).toContain("more than the $100.00 you took in");
    expect(m?.reasons[2]?.text).toContain("risen past the strike");
  });
});

describe("manageCalls — honest about a partly verified stock price", () => {
  const aging: PulseItem[] = [
    { id: "spot", source: "IEX", asOf: NOW, status: "aging", note: "no parity pair" },
  ];

  it("leads with the caveat and still answers, at medium", () => {
    const [m] = manage([open("2026-10-16", 100, 2, { ask: 1.5 })], { pulse: aging });
    expect(m?.call).toBe("KEEP");
    expect(m?.confidence).toBe("medium");
    expect(m?.reasons[0]).toEqual({
      rule: "PULSE",
      text: "The stock price is only partly verified — no parity pair. Confidence capped at medium.",
    });
  });

  it("keeps at most three reasons, dropping the least important rather than the caveat", () => {
    // A member who wants out gets three lines of their own; the caveat makes four.
    const [m] = manage([open("2026-10-16", 100, 2)], { pulse: aging }, { ...STAKE, goal: "exit" });
    expect(m?.reasons).toHaveLength(3);
    expect(m?.reasons[0]?.rule).toBe("PULSE");
    expect(textOf(m)).not.toContain("Buying it back costs");
  });

  it("says nothing of it when the stock price is fresh", () => {
    const [m] = manage([open("2026-10-16", 100, 2, { ask: 1.5 })]);
    expect(textOf(m)).not.toContain("partly verified");
  });
});
