import { act, render, screen } from "@testing-library/react";
import { usePrefs } from "../../src/shell/prefs";
import { SauronCard, towerSrc } from "../../src/shell/sauron-card";

// The league reads the board over the network; these cases are about the art column only.
rstest.mock("../../src/shell/league-card", () => ({
  LeagueCard: () => <p>the league</p>,
}));

/** The character card's tower: always the card framing; the dials only when the account has a landmark. */
describe("towerSrc", () => {
  it("frames the tower for the card", () => {
    expect(towerSrc()).toBe("/tower?frame=card");
  });

  it("passes a landmark's own dials through, so its tower reflects its standing and P/L", () => {
    expect(towerSrc({ power: 0.62, health: -0.3 })).toBe(
      "/tower?frame=card&power=0.620&health=-0.300",
    );
  });

  it("asks the scene for rest=still when the member stills the tower (#3807 slice 3b-1)", () => {
    expect(towerSrc(undefined, "still")).toBe("/tower?frame=card&rest=still");
    expect(towerSrc({ power: 0.62, health: -0.3 }, "still")).toBe(
      "/tower?frame=card&power=0.620&health=-0.300&rest=still",
    );
    expect(towerSrc(undefined, "live")).toBe("/tower?frame=card");
  });
});

describe("the open card, in the Profile page's tower column (#3977)", () => {
  afterEach(() => act(() => usePrefs.getState().setCrest("live")));

  it("stands unboxed: the open class, the live tower, the league under it", () => {
    const { container } = render(<SauronCard ownedIds={["a1"]} meId="a1" scope=".cockpit" open />);
    const card = screen.getByRole("region", { name: "Sauron's tower and the league" });
    expect(card).toHaveClass("char-card--open");
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("/tower?frame=card");
    expect(screen.getByText("the league")).toBeInTheDocument();
  });

  it("stays boxed everywhere else (/u/:id, the Overview below the bench width)", () => {
    render(<SauronCard ownedIds={["a1"]} meId="a1" scope=".cockpit" />);
    const card = screen.getByRole("region", { name: "Sauron's tower and the league" });
    expect(card).not.toHaveClass("char-card--open");
  });

  it("carries the member's Still to the open tower too", () => {
    act(() => usePrefs.getState().setCrest("still"));
    const { container } = render(<SauronCard ownedIds={["a1"]} meId="a1" scope=".cockpit" open />);
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      "/tower?frame=card&rest=still",
    );
  });
});
