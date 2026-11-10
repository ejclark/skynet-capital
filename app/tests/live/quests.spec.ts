import type { EditionStory } from "../../src/live/edition";
import {
  exitLines,
  placeQuests,
  type Quest,
  rateLines,
  rateTag,
  unreadLine,
} from "../../src/live/quests";

/**
 * Quests sit by their source (#7077 slice 3, Eric's pick on #7018 round 1): a market quest under the
 * story that names its symbol, the account's quests in one part after the news. Every base rate is
 * said in words with its sample, and an untested one says "untested" (#7028 AC 5, CLAUDE.md honesty).
 */

function quest(over: Partial<Quest> & Pick<Quest, "id" | "source">): Quest {
  return {
    move: {
      kind: "sell-cash-secured-put",
      label: "Sell a cash-secured put on NVDA",
      symbol: "NVDA",
      href: "/app/trade?desk=me&symbol=NVDA&play=201",
    },
    why: [{ rule: "r", text: "Because the rule says so." }],
    baseRate: { kind: "untested", note: "No study has measured it yet." },
    exits: [],
    expires: { date: "2026-11-20", why: "the event happens on Thu, Nov 20 (confirmed)" },
    houseCall: "take",
    confidence: "low",
    atOpen: false,
    ...over,
  };
}

const story = (id: string, symbols: string[]): EditionStory => ({
  id,
  headline: id,
  line: id,
  symbols,
  facts: [],
  reports: [],
  more: [],
});

describe("placing quests by their source", () => {
  const stories = [story("chips", ["NVDA", "SMH"]), story("rates", []), story("nvda2", ["NVDA"])];

  it("puts a market quest under the first story naming its symbol", () => {
    const placed = placeQuests([quest({ id: "e1", source: "event" })], stories);
    expect(placed.byStory.get("chips")?.map((q) => q.id)).toEqual(["e1"]);
    expect(placed.byStory.has("nvda2")).toBe(false);
    expect(placed.account).toEqual([]);
  });

  it("keeps the account's quests, and a market quest no story names, in the part after the news", () => {
    const placed = placeQuests(
      [
        quest({ id: "p1", source: "position" }),
        quest({
          id: "e2",
          source: "event",
          move: { kind: "sell-cash-secured-put", label: "x", symbol: "AAPL", href: "/app/" },
        }),
        quest({ id: "c1", source: "conditions" }),
      ],
      stories,
    );
    // A position or conditions quest never moves under a story, even one naming its symbol.
    expect(placed.account.map((q) => q.id)).toEqual(["p1", "e2", "c1"]);
    expect(placed.byStory.size).toBe(0);
  });
});

describe("a quest's base rate, in words", () => {
  it("says untested in words", () => {
    const rate = { kind: "untested", note: "No study yet." } as const;
    expect(rateTag(rate)).toBe("Untested");
    expect(rateLines(rate)).toEqual(["Untested. No study yet."]);
  });

  it("shows a measured rate's sample and says its edge is untested", () => {
    const rate = {
      kind: "measured",
      rate: 0.52,
      sample: 65,
      episodes: 18,
      episodesNeeded: 32,
      mean: 0.031,
      worstDecile: -0.139,
      worstSingle: -0.21,
      source: "docs/research/drawdown.md",
      note: "Too few sell-offs to tell from chance.",
    } as const;
    expect(rateTag(rate)).toBe("Edge untested · n=65");
    const [first, second] = rateLines(rate);
    expect(first).toContain("Edge untested");
    expect(first).toContain("n=65");
    expect(first).toContain("needs 32");
    expect(second).toContain("−13.9%");
  });

  it("shows a tested rate with its sample and worst tenth", () => {
    const rate = {
      kind: "tested",
      rate: 0.6,
      sample: 40,
      worstDecile: -0.25,
      source: "docs/research/x.md",
    } as const;
    expect(rateTag(rate)).toBe("Tested · n=40");
    expect(rateLines(rate)[0]).toBe(
      "Paid in 60% of 40 past cases (n=40). The worst tenth: −25.0%.",
    );
  });
});

describe("the rest of a quest's words", () => {
  it("says a closing move is itself the exit", () => {
    expect(exitLines(quest({ id: "p", source: "position" }))).toEqual([
      "This move is itself the exit.",
    ]);
  });

  it("names what went unread, and nothing when all was read", () => {
    expect(unreadLine([])).toBeUndefined();
    expect(unreadLine(["NVDA", "conditions"])).toContain("NVDA, today's market conditions");
  });
});
