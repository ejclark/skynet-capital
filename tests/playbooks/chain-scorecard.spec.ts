import { AI_DIP_CHAIN, type PlaybookChain } from "../../src/playbooks/chain.js";
import type { ChainRun } from "../../src/playbooks/chain-replay.js";
import {
  chainPlaybooks,
  chainShape,
  scorecardFor,
  scorecardOf,
} from "../../src/playbooks/chain-scorecard.js";
import file from "../../src/playbooks/chain-scorecards.json";

/**
 * THE CHAIN SCORECARD (#6959 slice 4). WHEN the Store shows a chain's replay, it SHALL show each
 * link's own result and the chain's total beside them (criterion 3). A link that never owned a
 * position SHALL show no result (not $0), and a chain whose links were never replayed SHALL get no
 * card — never another chain's numbers.
 */

const run = (links: [string, number][], total: number, status: ChainRun["status"]): ChainRun => ({
  chainId: "T",
  start: 0,
  links: links.map(([playbook, result]) => ({ playbook, result })),
  total,
  path: [],
  status,
  steps: [],
});
const META = { symbol: "CRWV", from: "2025-01-02", to: "2026-01-02" };
const CLEAN = { sessions: 10, twoDeciders: 0, unowned: 0 };

describe("scorecardOf", () => {
  it("averages each link over the runs it owned, and the total over every run", () => {
    const runs = [
      run([["CRWV-WHEEL", 100]], 100, "closed"),
      run(
        [
          ["CRWV-WHEEL", 300],
          ["CRWV-LONG-CALL", -500],
        ],
        -200,
        "open",
      ),
    ];
    const card = scorecardOf(AI_DIP_CHAIN, runs, META, CLEAN);
    expect(card.links).toEqual([
      { playbook: "CRWV-WHEEL", runs: 2, mean: 200 },
      { playbook: "CRWV-LONG-CALL", runs: 1, mean: -500 },
    ]);
    expect(card.total).toEqual({ mean: -50, won: 1 });
    expect(card).toMatchObject({ runs: 2, open: 1, ...META });
  });

  it("shows a link that never owned a position as no result, not zero", () => {
    const card = scorecardOf(AI_DIP_CHAIN, [run([["CRWV-WHEEL", 50]], 50, "closed")], META, CLEAN);
    expect(card.links[1]).toEqual({ playbook: "CRWV-LONG-CALL", runs: 0, mean: null });
  });

  it("lists links in the order they first own the position", () => {
    const three: PlaybookChain = {
      ...AI_DIP_CHAIN,
      links: [
        { from: "A", on: { kind: "expired" }, to: "B" },
        { from: "B", on: { kind: "stopped" }, to: "C" },
      ],
    };
    expect(chainPlaybooks(three)).toEqual(["A", "B", "C"]);
  });
});

describe("scorecardFor", () => {
  it("matches a chain by its links, not its name", () => {
    const renamed = { ...AI_DIP_CHAIN, id: "mine", title: "Mine" };
    expect(chainShape(renamed)).toBe(chainShape(AI_DIP_CHAIN));
    expect(scorecardFor(renamed, file.cards)?.symbol).toBe("CRWV");
  });

  it("gives a chain with other links no card, even a close one", () => {
    const other: PlaybookChain = {
      ...AI_DIP_CHAIN,
      links: [{ from: "CRWV-WHEEL", on: { kind: "stopped" }, to: "CRWV-LONG-CALL" }],
    };
    expect(scorecardFor(other, file.cards)).toBeUndefined();
  });
});

describe("the committed scorecards", () => {
  it("hold the AI-dip chain, each link's own result beside the total, and one owner throughout", () => {
    const card = scorecardFor(AI_DIP_CHAIN, file.cards);
    expect(card).toBeDefined();
    // The plan's falsifier: a total with no per-link results, or a result for a link that never decided.
    expect(card?.links.map((l) => l.playbook)).toEqual(chainPlaybooks(AI_DIP_CHAIN));
    for (const l of card?.links ?? []) expect(l.mean === null).toBe(l.runs === 0);
    expect(card?.ownership).toMatchObject({ twoDeciders: 0, unowned: 0 });
    expect(card?.runs).toBeGreaterThan(0);
  });
});
