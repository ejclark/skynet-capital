import { glanceMessage, towerSrc } from "../../src/shell/sauron-card";

/** The only thing that crosses into the tower's frame on a filter click: a point, in its own pixels. */
describe("glanceMessage", () => {
  const rect = (left: number, top: number, width: number, height: number) =>
    ({ left, top, width, height }) as DOMRect;

  it("points at the control's centre, measured from the frame's top-left", () => {
    const m = glanceMessage(rect(1200, 240, 360, 440), rect(700, 250, 40, 20));
    expect(m).toEqual({ type: "tower:glance", x: -480, y: 20 });
  });

  it("carries nothing but the message type and the point", () => {
    expect(Object.keys(glanceMessage(rect(0, 0, 1, 1), rect(0, 0, 1, 1))).sort()).toEqual([
      "type",
      "x",
      "y",
    ]);
  });
});

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
