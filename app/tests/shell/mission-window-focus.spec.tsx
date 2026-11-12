import { render, screen } from "@testing-library/react";
import { MissionWindowFrame, quietNextWindow } from "../../src/shell/mission-window";

/**
 * A window the member switched to takes focus at its heading; one the Eye opened on its own does
 * not (#7487 slice 5 review, WCAG 3.2.1): a screen-reader member reading the page must not have
 * focus moved from under them by a notice they never asked for.
 */

const frame = (side: 0 | 1 | -1) => (
  <MissionWindowFrame
    id="market"
    side={side}
    title="The market"
    sub="sectors against their usual range"
    links={[]}
    open={() => undefined}
  >
    <p>rows</p>
  </MissionWindowFrame>
);

describe("MissionWindowFrame · focus on a switch", () => {
  it("takes focus at its heading when the member switched to it", () => {
    render(frame(1));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: /The market/ }));
  });

  it("leaves focus where it was when the Eye opened it", () => {
    quietNextWindow("market");
    render(frame(1));
    expect(document.activeElement).toBe(document.body);
  });

  it("spends the Eye's mark on the next opening, so a later switch of the member's takes focus", () => {
    quietNextWindow("market");
    const first = render(frame(1));
    first.unmount();
    render(frame(-1));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: /The market/ }));
  });
});
