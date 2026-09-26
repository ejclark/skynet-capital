import { towerSrc } from "../../src/shell/sauron-card";

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
});
