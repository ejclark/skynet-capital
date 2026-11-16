import { cleanup, render } from "@testing-library/react";
import type { Quest } from "../../src/live/quests";
import { AccountQuests, StoryQuests } from "../../src/shell/landing-quests";

/**
 * The landing page's quests, drawn (#7077 slice 3): ranked as the route ranks them, at most 3
 * showing and the rest folded (#7028 objection 3), each closed to one line until tapped, each
 * opening on a draft ticket the member fires. Nothing frames a time as good to buy (#7077 c7).
 */

const quest = (id: string, label: string): Quest => ({
  id,
  source: "position",
  move: {
    kind: "sell-to-close",
    label,
    symbol: "NVDA",
    href: `/app/trade?desk=me&symbol=NVDA&section=orders&manage=${id}`,
  },
  why: [{ rule: `guidance:${id}`, text: "The call bids at twice what was paid." }],
  baseRate: { kind: "untested", note: "No study has tested this exit rule yet." },
  exits: [],
  expires: { date: "2026-12-19", why: "the call expires" },
  houseCall: "take",
  confidence: "medium",
  atOpen: true,
});

afterEach(cleanup);

describe("the account's quests", () => {
  it("shows the first 3 in rank order and folds the rest", () => {
    const quests = ["a", "b", "c", "d", "e"].map((id) => quest(id, `Sell your ${id} call`));
    const { container } = render(<AccountQuests quests={quests} unread={[]} />);
    const top = container.querySelectorAll(".quests > .quest-list > .quest");
    expect([...top].map((li) => li.querySelector(".quest-label")?.textContent)).toEqual([
      "Sell your a call",
      "Sell your b call",
      "Sell your c call",
    ]);
    const rest = container.querySelector(".quest-rest");
    expect(rest?.querySelector("summary")?.textContent).toBe("2 more quests");
    expect(rest?.querySelectorAll(".quest")).toHaveLength(2);
  });

  it("loads each quest closed, says its base rate in words, and opens on a draft ticket", () => {
    const { container } = render(
      <AccountQuests quests={[quest("a", "Sell your call")]} unread={[]} />,
    );
    const row = container.querySelector<HTMLDetailsElement>(".quest-row");
    expect(row?.open).toBe(false);
    expect(row?.querySelector(".quest-tag")?.textContent).toBe("Untested");
    const body = row?.textContent ?? "";
    expect(body).toContain("Untested. No study has tested this exit rule yet.");
    expect(body).toContain("market closed: a plan for the next open");
    expect(body).toContain("This move is itself the exit.");
    expect(row?.querySelector("a.quest-open")?.getAttribute("href")).toContain("manage=a");
    expect(body).not.toMatch(/good (time )?to buy|great time|buy the dip/i);
  });

  it("says so plainly when there is none, and names what went unread", () => {
    const { container } = render(<AccountQuests quests={[]} unread={["conditions"]} />);
    expect(container.textContent).toContain("No quest for this account right now.");
    expect(container.querySelector(".quests-unread")?.textContent).toContain(
      "today's market conditions",
    );
  });
});

describe("a story's quests", () => {
  it("draws nothing when the story has none", () => {
    const { container } = render(<StoryQuests quests={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("draws its market quests under a heading inside the story", () => {
    const { container } = render(<StoryQuests quests={[quest("e", "Sell a put on NVDA")]} />);
    expect(container.querySelector(".story-sub")?.textContent).toBe("A quest from this story");
    expect(container.querySelectorAll(".quest")).toHaveLength(1);
  });
});
