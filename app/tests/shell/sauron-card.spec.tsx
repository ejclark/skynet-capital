import { render, screen } from "@testing-library/react";
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

describe("under the page's tower, in the frame's column (#3977)", () => {
  it("draws no art of its own — the shade and the league only, so the page draws one tower", () => {
    const { container } = render(<SauronCard ownedIds={["a1"]} meId="a1" scope=".cockpit" under />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("region", { name: "The league" })).toHaveClass("char-card--under");
    expect(screen.getByText("the league")).toBeInTheDocument();
  });

  it("mounts no frame on a phone — no WebGL until a real-device recheck; the brand slot holds the still Eye", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: () => ({
        matches: true,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
    try {
      const { container } = render(<SauronCard ownedIds={["a1"]} meId="a1" scope=".cockpit" />);
      expect(container.querySelector("iframe")).toBeNull();
      expect(screen.getByRole("region", { name: "The league" })).toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(window, "matchMedia");
    }
  });

  it("keeps its own tower everywhere else (between the phone and the bench width, the boxed card)", () => {
    const { container } = render(<SauronCard ownedIds={["a1"]} meId="a1" scope=".cockpit" />);
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("/tower?frame=card");
    expect(screen.getByRole("region", { name: "Sauron's tower and the league" })).not.toHaveClass(
      "char-card--under",
    );
  });
});
