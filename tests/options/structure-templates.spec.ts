import type { OutlookDirection } from "../../src/options/outlook.js";
import {
  type AnchorFrame,
  anchorsFor,
  type LegAnchor,
  type StructureKind,
  structuresFor,
} from "../../src/options/structure-templates.js";

/**
 * The catalogue is checked as a TABLE, not shape by shape: every structure a direction offers has
 * to be well-formed, and the two rules that separate a spread from a degenerate one — a debit
 * vertical's floor of one wing, a credit vertical's short strike on the boundary the view says
 * holds — have to hold at every magnitude, including the slight views that squeeze them.
 */

const FRAME: AnchorFrame = { spot: 180, target: 200, hold: 20, wing: 10, step: 5 };
const DIRECTIONS: readonly OutlookDirection[] = ["bullish", "bearish", "neutral"];
const ALL: readonly StructureKind[] = DIRECTIONS.flatMap((direction) => structuresFor(direction));

const anchorPrices = (kind: StructureKind, frame = FRAME): number[] =>
  anchorsFor(kind, frame).map((anchor: LegAnchor) => anchor.price);

describe("structuresFor — which shapes answer which view", () => {
  it("offers three structures per direction, and never the same one twice", () => {
    for (const direction of DIRECTIONS) expect(structuresFor(direction)).toHaveLength(3);
    expect(new Set(ALL).size).toBe(ALL.length);
  });
});

describe("anchorsFor — where each leg points before it meets a chain", () => {
  it("gives every structure at least one leg, all at positive prices", () => {
    for (const kind of ALL) {
      const anchors = anchorsFor(kind, FRAME);
      expect(anchors.length).toBeGreaterThan(0);
      for (const anchor of anchors) {
        expect(anchor.price).toBeGreaterThan(0);
        expect(anchor.quantity).not.toBe(0);
      }
    }
  });

  it("nets to zero lots on the defined-risk shapes and to a signed lot on the naked ones", () => {
    const lots = (kind: StructureKind): number =>
      anchorsFor(kind, FRAME).reduce((sum, anchor) => sum + anchor.quantity, 0);
    expect(lots("bull-call-spread")).toBe(0);
    expect(lots("iron-condor")).toBe(0);
    expect(lots("long-call-butterfly")).toBe(0);
    expect(lots("long-call")).toBe(1);
    expect(lots("short-strangle")).toBe(-2);
  });

  it("floors a debit vertical one WING apart even when the target barely clears spot", () => {
    const timid: AnchorFrame = { ...FRAME, target: 181, hold: 2, wing: 10 };
    const [long, short] = anchorPrices("bull-call-spread", timid);
    expect((short ?? 0) - (long ?? 0)).toBeGreaterThanOrEqual(timid.wing);

    const timidDown: AnchorFrame = { ...timid, target: 179 };
    const [longPut, shortPut] = anchorPrices("bear-put-spread", timidDown);
    expect((longPut ?? 0) - (shortPut ?? 0)).toBeGreaterThanOrEqual(timid.wing);
  });

  it("puts a credit vertical's SHORT strike on the boundary the view says price will not reach", () => {
    const [shortPut, longPut] = anchorPrices("short-put-spread");
    expect(shortPut).toBe(FRAME.spot - FRAME.hold);
    expect(longPut).toBe(FRAME.spot - FRAME.hold - FRAME.wing);

    const [shortCall, longCall] = anchorPrices("short-call-spread");
    expect(shortCall).toBe(FRAME.spot + FRAME.hold);
    expect(longCall).toBe(FRAME.spot + FRAME.hold + FRAME.wing);
  });

  it("brackets spot symmetrically on the range-bound shapes", () => {
    const condor = anchorPrices("iron-condor").sort((a, b) => a - b);
    expect(condor).toEqual([150, 160, 200, 210]);
    expect(anchorPrices("short-strangle").sort((a, b) => a - b)).toEqual([160, 200]);
    expect(anchorPrices("long-call-butterfly")).toEqual([160, 180, 200]);
  });
});
