import { render, screen } from "@testing-library/react";
import { RankFlow } from "../../src/shell/rank-flow";

/**
 * A standings row's capital-flow mark (#4563 slice 2): the server's words verbatim, a shape that
 * says added or removed without hue, and nothing at all on a row with no recorded flow.
 */

describe("RankFlow", () => {
  it("renders nothing for a row with no recorded flow — no badge, no empty slot", () => {
    const { container } = render(<RankFlow />);
    expect(container.innerHTML).toBe("");
  });

  it("writes the server's line verbatim, with its longer why on hover", () => {
    render(
      <RankFlow
        flow={{
          direction: "added",
          text: "Capital added $300,000 on Oct 5 — not a gain · inferred",
          title: "inferred from our own records",
        }}
      />,
    );
    const mark = screen.getByText("Capital added $300,000 on Oct 5 — not a gain · inferred");
    expect(mark.closest(".rank-flow")?.getAttribute("title")).toBe("inferred from our own records");
  });

  it("tells added from removed by shape, never by colour alone", () => {
    const { container, rerender } = render(
      <RankFlow flow={{ direction: "added", text: "a", title: "t" }} />,
    );
    const added = container.querySelector(".rank-flow-glyph")?.textContent;
    rerender(<RankFlow flow={{ direction: "removed", text: "r", title: "t" }} />);
    const removed = container.querySelector(".rank-flow-glyph")?.textContent;
    expect(added).toBe("+");
    expect(removed).toBe("−");
  });
});
