import { cleanup, render } from "@testing-library/react";
import type { EditionStory } from "../../src/live/edition";
import { EditionStoryLine } from "../../src/shell/edition-story";

/**
 * A story's one-line row (#7018 round 3, AT4) shows its lead fact's MOVE beside its shape. A
 * level that is itself a percentage (a yield) reads as a move there, so the row shows the level's
 * `change` instead, and the opened story keeps the level and its note (#7182).
 */

const rates: EditionStory = {
  id: "rates",
  headline: "Hiring beat forecasts by a wide margin, and the 10-year yield still fell on the week.",
  line: "Hiring beat; the 10-year fell",
  symbols: [],
  facts: [
    {
      label: "10-year Treasury yield",
      value: "4.86%",
      change: "−0.07 pts",
      move: "down",
      note: "−0.07 points on the week",
    },
  ],
  reports: [],
  more: [],
};

afterEach(cleanup);

function renderLine(story: EditionStory) {
  const { container } = render(
    <ul>
      <EditionStoryLine story={story} />
    </ul>,
  );
  return container;
}

describe("a story's one-line row", () => {
  it("shows a level's change, never the bare level (#7182)", () => {
    const row = renderLine(rates);
    expect(row.querySelector("summary .ecal-figure")?.textContent).toBe("−0.07 pts");
    // The opened story still shows the level, with its note.
    const fact = row.querySelector(".story-fact dd")?.textContent ?? "";
    expect(fact).toContain("4.86%");
    expect(fact).toContain("−0.07 points on the week");
  });

  it("shows a change's own value, which already is the move", () => {
    const fact = { label: "SMH, the chip fund", value: "−11.2%", move: "down" as const };
    const row = renderLine({ ...rates, id: "chips", facts: [fact] });
    expect(row.querySelector("summary .ecal-figure")?.textContent).toBe("−11.2%");
  });
});
