import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { PlaybookSubscription, PlayTarget, Portfolio, Quote } from "../../src/domain/types.js";
import {
  type BookHealthInput,
  type BookHealthView,
  bookHealthView,
} from "../../src/observatory/book-health-view.js";
import type { EnabledPlaybook } from "../../src/playbooks/playbook.js";
import { CRWV_WHEEL } from "../../src/playbooks/registry.js";
import { withTargetObservation } from "../../src/playbooks/with-target-observation.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, aPortfolio, aPosition, aQuote, aSubscription } from "../support/builders.js";

/**
 * Imbalance against a play's target (#5493 slice 4): the book-health view reads each targeted
 * play's active share against its band by the same reading the bot's observer logs from
 * (#5483 slice 3), so the Balance section and the bot never name two levels for one book.
 *
 * The book: a $100,000 budget with 700 CRWV bought at 100 ($70,000 deployed, $30,000 holding), so
 * the share of the default 70% target is the CRWV price moving the active part: at 100 it sits on
 * target; 130 is 75.2% (5.2 points over, a signal); 200 is 82.4% (a gate); 70 is 62.0% (8 under).
 */

const AS_OF = "2026-11-02T15:00:00.000Z";
const BUDGET = 100_000;
const baskets = new Map([["CRWV-WHEEL", ["CRWV"]]]);
const wheel = (over: Partial<PlaybookSubscription> = {}) =>
  aSubscription("sauron", "CRWV-WHEEL", { capitalAllocated: BUDGET, ...over });
const book = (shares = 700, avgPrice = 100): Portfolio =>
  aPortfolio({
    cash: 30_000,
    positions: [aPosition({ symbol: "CRWV", quantity: shares, avgPrice })],
  });
const quotesAt = (price: number): Record<string, Quote> => ({
  CRWV: aQuote({ symbol: "CRWV", last: price }),
});

const read = (price: number, over: Partial<BookHealthInput> = {}): BookHealthView =>
  bookHealthView({
    asOf: AS_OF,
    accountId: "sauron",
    portfolio: book(),
    quotes: quotesAt(price),
    subscriptions: [wheel()],
    baskets,
    ownerView: true,
    ...over,
  });
const imbalance = (view: BookHealthView) =>
  view.findings.filter((f) => f.detector === "imbalanced");

describe("imbalance against a target — the band level", () => {
  it("is a signal past the soft line, over its target, and says capital keeps flowing", () => {
    const [found] = imbalance(read(130));
    expect(found).toMatchObject({
      detector: "imbalanced",
      level: "signal",
      playbookId: "CRWV-WHEEL",
      band: { direction: "over", target: 0.7, signal: 0.05, gate: 0.1 },
    });
    expect(found?.reading).toBeCloseTo(0.752, 3);
    expect(found?.threshold).toBeCloseTo(0.75, 6);
    expect(found?.words).toContain("75.2% of its $100,000 budget deployed against a 70% target");
    expect(found?.words).toContain("5.2 points over, past its signal at 5");
    expect(found?.words).toContain("capital keeps flowing");
    expect(found?.words).not.toContain("blocked");
  });

  it("is a gate past the hard line, worded as the stronger level with nothing blocked yet", () => {
    const [found] = imbalance(read(200));
    expect(found).toMatchObject({ level: "gate", band: { direction: "over" } });
    expect(found?.threshold).toBeCloseTo(0.8, 6);
    expect(found?.words).toContain("past its gate at 10");
    expect(found?.words).toContain("the stronger level; nothing is blocked yet");
  });

  it("reads under its target the same way, the line below the target", () => {
    const [signal] = imbalance(read(70));
    expect(signal).toMatchObject({ level: "signal", band: { direction: "under" } });
    expect(signal?.threshold).toBeCloseTo(0.65, 6);
    expect(signal?.words).toContain("8 points under, past its signal at 5");
    const [gate] = imbalance(read(40));
    expect(gate).toMatchObject({ level: "gate", band: { direction: "under" } });
    expect(gate?.threshold).toBeCloseTo(0.6, 6);
  });

  it("has no finding inside the band, and a share exactly on the edge is still inside", () => {
    expect(imbalance(read(100))).toEqual([]);
    expect(imbalance(read(120))).toEqual([]);
    // 600 shares bought at 100 and marked at 200: 120k active of 160k = exactly 75%, 5 points over.
    const onEdge = read(200, { portfolio: book(600) });
    expect(imbalance(onEdge)).toEqual([]);
    expect(onEdge.plays?.[0]?.target?.level).toBe("inside");
  });

  it("counts the finding among the gate and signal totals, gate listed first", () => {
    const view = read(200);
    expect(view.counts.byDetector.imbalanced).toBe(1);
    expect(view.findings[0]?.level).toBe("gate");
  });

  it("carries the reading on the play's own row, even when it is inside its band", () => {
    const [play] = read(100).plays ?? [];
    expect(play?.target).toMatchObject({ level: "inside", target: 0.7, signal: 0.05, gate: 0.1 });
    expect(play?.target?.share).toBeCloseTo(0.7, 6);
  });
});

describe("imbalance against a target — which plays have one", () => {
  it("shows no target reading for a play that has none, and never a zero", () => {
    // Not Sauron's account, so the first-run table does not apply, and the subscription has none.
    const view = read(200, { accountId: "other-bot", subscriptions: [wheel()] });
    expect(imbalance(view).filter((f) => f.band)).toEqual([]);
    const [play] = view.plays ?? [];
    expect(play).toBeDefined();
    expect(play).not.toHaveProperty("target");
    expect(read(200, { accountId: undefined }).plays?.[0]).not.toHaveProperty("target");
  });

  it("reads Sauron's CRWV wheel against the default when its subscription states none", () => {
    expect(imbalance(read(130))).toHaveLength(1);
    expect(read(100).plays?.[0]?.target?.target).toBe(0.7);
  });

  it("reads a subscription's own target in place of the default", () => {
    const tight: PlayTarget = { weight: 0.7, band: { signal: 0.02, gate: 0.04 } };
    // 73.7% at 120: inside the default band, 3.7 points over a 2/4 band: a signal, not a gate.
    const [found] = imbalance(read(120, { subscriptions: [wheel({ playTarget: tight })] }));
    expect(found).toMatchObject({ level: "signal", band: { signal: 0.02, gate: 0.04 } });
    expect(found?.words).toContain("past its signal at 2");
  });

  it("reads nothing for a paused play, a play with no budget or an unknown basket", () => {
    const cases: Partial<BookHealthInput>[] = [
      { subscriptions: [wheel({ enabled: false })] },
      { subscriptions: [wheel({ capitalAllocated: 0 })] },
      { subscriptions: [aSubscription("sauron", "CRWV-WHEEL")] },
      { baskets: new Map() },
    ];
    for (const over of cases) {
      const view = read(200, over);
      expect(imbalance(view)).toEqual([]);
      expect(view.plays?.[0]).not.toHaveProperty("target");
    }
  });

  it("treats a target its playbook refuses as no target: the observer ignores it, so does this", () => {
    // A 50% weight is outside the wheel's 60-80%; the old placeholder keeps reading the play.
    const view = read(200, { subscriptions: [wheel({ playTarget: { weight: 0.5 } })] });
    expect(view.plays?.[0]).not.toHaveProperty("target");
    expect(imbalance(view).map((f) => f.band)).toEqual([undefined]);
  });

  it("does not also raise the placeholder for a play that has a target", () => {
    // 700 shares at 200 on a $100,000 budget with cost 70k: committed (the guards' math) is over
    // 90% of a small budget, which the placeholder would flag; the target's finding replaces it.
    const view = read(200, { subscriptions: [wheel({ capitalAllocated: 150_000 })] });
    const found = imbalance(view);
    expect(found).toHaveLength(1);
    expect(found[0]?.band).toBeDefined();
    const bare = read(200, {
      accountId: "other-bot",
      subscriptions: [wheel({ capitalAllocated: 150_000 })],
    });
    expect(imbalance(bare).map((f) => f.band)).toEqual([undefined]);
  });

  it("keeps the placeholder alone for a play with no target", () => {
    const bare = read(200, {
      accountId: "other-bot",
      subscriptions: [wheel({ capitalAllocated: 150_000 })],
    });
    const [found] = imbalance(bare);
    expect(found).toMatchObject({ level: "signal", threshold: 0.9 });
    expect(found).not.toHaveProperty("band");
  });
});

describe("imbalance against a target — wording", () => {
  const shut: DecisionRecord = {
    at: Date.parse("2026-11-02T14:59:00Z"),
    personaId: "sauron",
    mode: "live",
    rawIntents: [],
    guardedIntents: [],
    outcomes: [],
    playbookVerdicts: [{ playbookId: "CRWV-WHEEL", mode: "standard", state: "no-window" }],
  };

  it("says why a play reads thin when its window is shut, without changing the level", () => {
    const open = imbalance(read(40));
    const closed = imbalance(read(40, { records: [shut] }));
    expect(closed[0]?.level).toBe(open[0]?.level);
    expect(closed[0]?.words).toContain("Its window is shut right now.");
    expect(open[0]?.words).not.toContain("window");
    // Over its target, a shut window explains nothing.
    expect(imbalance(read(200, { records: [shut] }))[0]?.words).not.toContain("window");
  });

  it("names no playbook and no dollar figure for anyone but the owner (#885)", () => {
    const view = read(200, { ownerView: false });
    const [found] = imbalance(view);
    expect(found).not.toHaveProperty("playbookId");
    expect(found?.words).toContain("One of this account's playbooks");
    expect(found?.words).not.toContain("CRWV");
    expect(found?.words).not.toContain("$");
    expect(view.plays).toBeUndefined();
  });
});

describe("imbalance against a target — the view and the observer read one level", () => {
  const enabled: EnabledPlaybook[] = [{ playbook: CRWV_WHEEL, mode: "standard" }];
  const put = buildOccSymbol({
    underlying: "CRWV",
    expiration: "2026-12-18",
    type: "put",
    strike: 75,
  });

  /** The level the observer logs for this book: the last word of its first "watching" line. */
  const observed = (portfolio: Portfolio, price: number, subs: PlaybookSubscription[]) => {
    const out: string[] = [];
    const persona = withTargetObservation(
      { id: "sauron", name: "Sauron", thesis: "t", decide: () => [] },
      { accountId: "sauron", subscriptions: subs, enabled, log: { log: (l) => void out.push(l) } },
    );
    persona.decide(aContext({ CRWV: { last: price } }, AS_OF), portfolio);
    return /points\): (inside|signal|gate)\./.exec(out[0] ?? "")?.[1];
  };
  const viewed = (portfolio: Portfolio, price: number, subs: PlaybookSubscription[]) =>
    bookHealthView({
      asOf: AS_OF,
      accountId: "sauron",
      portfolio,
      quotes: quotesAt(price),
      subscriptions: subs,
      baskets,
      ownerView: true,
    }).plays?.[0]?.target?.level;

  it("agree at every price on the share book, in both directions", () => {
    for (const price of [20, 40, 55, 70, 80, 100, 110, 120, 128, 130, 150, 200, 400]) {
      const level = observed(book(), price, [wheel()]);
      expect(level).toBeDefined();
      expect(viewed(book(), price, [wheel()])).toBe(level);
    }
  });

  it("agree when the book also holds a sold put and a long call on the name", () => {
    const call = buildOccSymbol({
      underlying: "CRWV",
      expiration: "2027-03-19",
      type: "call",
      strike: 90,
    });
    for (const price of [60, 100, 160, 260]) {
      const portfolio = aPortfolio({
        cash: 20_000,
        positions: [
          aPosition({ symbol: "CRWV", quantity: 300, avgPrice: 100 }),
          aPosition({ symbol: put, quantity: -2, avgPrice: 2.1 }),
          aPosition({ symbol: call, quantity: 3, avgPrice: 12, marketValue: 4_500 }),
        ],
      });
      expect(viewed(portfolio, price, [wheel()])).toBe(observed(portfolio, price, [wheel()]));
    }
  });

  it("agree under a subscription's own target, and on a narrower band", () => {
    const own = [wheel({ playTarget: { weight: 0.65, band: { signal: 0.03, gate: 0.06 } } })];
    for (const price of [60, 90, 100, 115, 140]) {
      expect(viewed(book(), price, own)).toBe(observed(book(), price, own));
    }
  });

  it("agree that a finding exists exactly when the observer reads signal or gate", () => {
    for (const price of [50, 100, 130, 200]) {
      const level = observed(book(), price, [wheel()]);
      const found = imbalance(read(price));
      expect(found.map((f) => f.level)).toEqual(level === "inside" ? [] : [level]);
    }
  });
});
