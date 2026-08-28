import { deskView } from "../../src/observatory/desk-json-view.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/** The desk's JSON twin: same figures as the blotter, formatted once, filterable raws alongside. */

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 11_090,
  equity: 100_000,
  positions: [
    { symbol: "AAPL", quantity: 200, avgPrice: 189.2, marketValue: 42_930 },
    { symbol: "NVDA261218C00130000", quantity: 6, avgPrice: 7.85, marketValue: 10_920 },
  ],
  activity: [],
  ...over,
});

describe("deskView", () => {
  it("formats the blotter figures and tiles with the page's own helpers", () => {
    const view = deskView(snapshot());
    expect(view).toMatchObject({ id: "sauron", name: "Sauron", kind: "bot" });
    expect(view.tiles.openPositions).toBe(2);
    expect(view.tiles.cash).toBe("$11,090");
    // Sorted by market value: AAPL first.
    expect(view.positions[0]).toMatchObject({ symbol: "AAPL", isOption: false, value: "$42,930" });
    expect(view.positions[1]?.isOption).toBe(true);
    expect(view.positions[1]?.display).not.toBe("NVDA261218C00130000");
  });

  it("carries the raw P/L for client-side filtering, signed formatting for display", () => {
    const view = deskView(snapshot());
    const aapl = view.positions[0];
    expect(aapl?.totalPlRaw).toBeCloseTo(42_930 - 200 * 189.2, 5);
    expect(aapl?.totalPl.startsWith("+") || aapl?.totalPl.startsWith("-")).toBe(true);
  });

  it("keeps an errored account honest — zeros stay absent, the error rides along", () => {
    const view = deskView(snapshot({ positions: [], error: "account unreachable" }));
    expect(view.error).toBe("account unreachable");
    expect(view.positions).toEqual([]);
  });
});
