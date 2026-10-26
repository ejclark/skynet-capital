import type { EarningsPrint } from "../../../src/domain/earnings-calendar";
import { optionBook } from "../../../src/domain/option-book";
import { wheelPhase } from "../../../src/playbooks/wheel";
import type { DeskPosition } from "../../src/live/desk";
import {
  dayText,
  dollarsOf,
  heldIn,
  parseWindowSpan,
  ruleTemplateOf,
  saySoOf,
  soldContract,
  storePairOf,
  wheelPhaseOf,
  wheelStep,
  windowPlan,
} from "../../src/live/playbook-rule";
import type { PairRowView, PlaybookStoreView } from "../../src/live/playbook-store";

/** A desk row with only what these joins read; the rest is display text they never touch. */
const pos = (symbol: string, quantity: string, over: Partial<DeskPosition> = {}): DeskPosition =>
  ({
    symbol,
    display: symbol,
    detail: "",
    isOption: symbol.length > 6,
    quantity,
    costPerShare: "$1",
    price: "$1",
    costBasis: "$1",
    value: "$1",
    dayPl: "$0",
    dayPct: "0%",
    dayTone: "flat",
    totalPl: "$0",
    totalPlRaw: 0,
    returnPct: "0%",
    totalTone: "flat",
    weightPct: 0,
    ...over,
  }) as DeskPosition;

const PUT = "CRWV261106P00080000";
const CALL = "CRWV261211C00095000";

describe("the wheel's step on a book (#5073 slice 3)", () => {
  // The wheel reads its state from the positions alone (`wheelPhase`, src/playbooks/wheel.ts);
  // the card must say the step the wheel itself would act on, so the two are held together.
  const books: Record<string, DeskPosition[]> = {
    "a sold put beside a few shares another rule bought": [
      pos("CRWV", "55"),
      pos(PUT, "-1"),
      pos("NVDA", "130"),
    ],
    "100 shares no call covers": [pos("CRWV", "100")],
    "a sold call on 100 shares": [pos("CRWV", "100"), pos(CALL, "-1")],
    "nothing on the ticker": [pos("NVDA", "130")],
    "a long contract — not the wheel's book": [pos(PUT, "1")],
    "short shares — not the wheel's book": [pos("CRWV", "-100")],
    "1,200 shares, read through their commas": [pos("CRWV", "1,200")],
  };
  for (const [name, positions] of Object.entries(books)) {
    it(`reads ${name} the way the wheel does`, () => {
      const portfolio = {
        cash: 0,
        positions: positions.map((p) => ({
          symbol: p.symbol,
          quantity: Number(p.quantity.replace(/,/g, "")),
          avgPrice: 1,
        })),
      };
      expect(wheelPhaseOf(positions, "CRWV")).toBe(wheelPhase(optionBook(portfolio, "CRWV")));
    });
  }

  it("numbers the steps as the loop draws them, and puts a foreign book on none", () => {
    expect(wheelStep("put-open")).toBe(1);
    expect(wheelStep("flat")).toBe(1);
    expect(wheelStep("assigned")).toBe(2);
    expect(wheelStep("call-open")).toBe(3);
    expect(wheelStep("foreign")).toBeUndefined();
  });

  it("finds the contract it sold on step 1 and step 3, and none in between", () => {
    const book = [pos("CRWV", "55"), pos(PUT, "-1")];
    expect(soldContract(book, "CRWV", "put-open")?.symbol).toBe(PUT);
    expect(soldContract(book, "CRWV", "assigned")).toBeUndefined();
  });
});

describe("what the bot holds in a playbook's ticker", () => {
  it("lists the shares first, then the contracts, and nothing on another ticker", () => {
    const held = heldIn([pos(PUT, "-1"), pos("NVDA", "130"), pos("CRWV", "55")], "CRWV");
    expect(held.map((p) => p.symbol)).toEqual(["CRWV", PUT]);
  });
});

describe("the pre-print window on the calendar", () => {
  it("reads the Store's two single-span sentences, and refuses a window with a hole", () => {
    expect(parseWindowSpan("20 to 6 sessions before the print")).toEqual({ opens: 20, closes: 6 });
    expect(parseWindowSpan("20 sessions before the print to the close of print day")).toEqual({
      opens: 20,
      closes: 0,
    });
    expect(parseWindowSpan("on sessions 20, 18 before the print")).toBeUndefined();
    expect(parseWindowSpan(undefined)).toBeUndefined();
  });

  const nov18: EarningsPrint[] = [
    { symbol: "NVDA", date: "2026-11-18", status: "estimate", source: "test" },
  ];

  it("lays S1's 20-to-6 on NVDA's Nov 18 print: opens Oct 21, out by Nov 11", () => {
    const plan = windowPlan(
      "NVDA",
      "20 to 6 sessions before the print",
      "2026-10-09T19:00:00Z",
      nov18,
    );
    expect(plan).toMatchObject({
      opens: "2026-10-21",
      lastLong: "2026-11-10",
      outBy: "2026-11-11",
      today: "2026-10-09",
      phase: "before",
      print: { date: "2026-11-18", confirmed: false },
    });
  });

  it("holds to the print itself when the window runs to the close of print day", () => {
    const plan = windowPlan(
      "NVDA",
      "20 sessions before the print to the close of print day",
      "2026-11-02T15:00:00Z",
      nov18,
    );
    expect(plan?.lastLong).toBe("2026-11-18");
    expect(plan?.outBy).toBeUndefined();
    expect(plan?.phase).toBe("inside");
  });

  it("draws nothing when no print for the ticker is on file", () => {
    expect(
      windowPlan("GOOG", "20 to 6 sessions before the print", "2026-10-09T19:00:00Z", nov18),
    ).toBeUndefined();
  });
});

describe("whose say-so a playbook runs on", () => {
  const wheel: PairRowView = {
    id: "CRWV-WHEEL",
    symbols: ["CRWV"],
    status: "conviction",
    statusLabel: "◆ conviction",
    stale: false,
    call: "Runs as its owner's conviction against the study's stand-aside.",
    checkOn: "2027-01-29",
    studyHref: "/research/crwv-premium-fit",
    subscription: {
      mode: "aggressive",
      enabled: true,
      conviction: { reason: "CRWV's premium pays me to wait", checkOn: "2027-01-29" },
    },
  };

  it("names a conviction as the owner's, with their words and its check day", () => {
    const say = saySoOf(wheel, "standard");
    expect(say.head).toBe("◆ Your conviction");
    // The subscription's own mode wins over the card's.
    expect(say.mode).toBe("aggressive");
    expect(say.reason).toBe("CRWV's premium pays me to wait");
    expect(say.dated).toMatch(/^Checked again Jan 29, 2027 — a failed check stops new entries/);
    expect(say.studyHref).toBe("/research/crwv-premium-fit");
  });

  it("names a researched pair by the Store's own label and its shelf date", () => {
    const say = saySoOf({
      id: "S1-NVDA",
      symbols: ["NVDA"],
      status: "researched",
      statusLabel: "✓ researched, weakened",
      stale: false,
      call: "Long from 20 trading sessions before a confirmed print to 6 before.",
      shelfOn: "2027-03-31",
    });
    expect(say.head).toBe("✓ Researched, weakened");
    expect(say.dated).toMatch(/^Good until Mar 31, 2027/);
  });

  it("never promises a shelf date a stale pair is already past", () => {
    const say = saySoOf({
      id: "G1-GOOG",
      symbols: ["GOOG"],
      status: "researched",
      statusLabel: "✓ researched · past its shelf date",
      stale: true,
      call: "x",
      shelfOn: "2026-01-01",
    });
    expect(say.dated).toBeUndefined();
  });
});

describe("the Store lookup and the small readers", () => {
  it("finds a pair by id inside its strategy, with the card that carries its rules", () => {
    const store = {
      cards: [{ id: "S1-NVDA", window: "20 to 6 sessions before the print" }],
      strategies: [
        { strategy: "wheel", pairs: [{ id: "CRWV-WHEEL" }] },
        { strategy: "pre-print-run-up", pairs: [{ id: "S1-NVDA" }] },
      ],
    } as unknown as PlaybookStoreView;
    const found = storePairOf(store, "S1-NVDA");
    expect(found?.strategy.strategy).toBe("pre-print-run-up");
    expect(found?.card?.window).toBe("20 to 6 sessions before the print");
    expect(storePairOf(store, "NOPE")).toBeUndefined();
  });

  it("draws the wheel, the run-up and the call spread, and nothing else", () => {
    expect(ruleTemplateOf("wheel")).toBe("wheel");
    expect(ruleTemplateOf("pre-print-run-up")).toBe("window");
    expect(ruleTemplateOf("call-spread")).toBe("window");
    expect(ruleTemplateOf("tactical")).toBeUndefined();
  });

  it("reads a dollar figure, and nothing from a word", () => {
    expect(dollarsOf("$77.45")).toBe(77.45);
    expect(dollarsOf("$1,077.45")).toBe(1077.45);
    expect(dollarsOf("—")).toBeUndefined();
    expect(dollarsOf(undefined)).toBeUndefined();
  });

  it("adds the year only to a date outside this one", () => {
    const now = new Date("2026-10-09T12:00:00Z");
    expect(dayText("2026-10-21", now)).not.toMatch(/2026/);
    expect(dayText("2027-01-29", now)).toMatch(/2027/);
  });
});
