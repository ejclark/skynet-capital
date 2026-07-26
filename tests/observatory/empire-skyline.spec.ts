import {
  empireTheme,
  renderEmpireSkyline,
  sectorOf,
} from "../../src/observatory/empire-skyline.js";
import type {
  ParticipantSnapshot,
  PositionView,
} from "../../src/observatory/participant-snapshot.js";

const pos = (symbol: string, marketValue: number, avgPrice = 1, quantity = 1): PositionView => ({
  symbol,
  quantity,
  avgPrice,
  marketValue,
});
const snap = (
  positions: PositionView[],
  extra: Partial<ParticipantSnapshot> = {},
): ParticipantSnapshot => ({
  id: "x",
  displayName: "X",
  kind: "bot",
  cash: 0,
  equity: positions.reduce((s, p) => s + p.marketValue, 0),
  positions,
  ...extra,
});

describe("empire-skyline", () => {
  describe("sectorOf", () => {
    it("maps known tickers to sectors and defaults the rest to market", () => {
      expect(sectorOf("NVDA")).toBe("tech");
      expect(sectorOf("meta")).toBe("tech"); // case-insensitive
      expect(sectorOf("XOM")).toBe("energy");
      expect(sectorOf("EEM")).toBe("broad");
      expect(sectorOf("GLD")).toBe("gold");
      expect(sectorOf("WMT")).toBe("market");
    });
  });

  describe("empireTheme", () => {
    it("names the dominant sector", () => {
      expect(empireTheme([pos("NVDA", 100), pos("META", 40)])).toBe("TECH");
    });
    it("is DIVERSIFIED when no sector holds a majority", () => {
      expect(empireTheme([pos("NVDA", 50), pos("XOM", 50), pos("GLD", 50)])).toBe("DIVERSIFIED");
    });
    it("is FRONTIER with no holdings", () => {
      expect(empireTheme([])).toBe("FRONTIER");
    });
  });

  describe("renderEmpireSkyline", () => {
    it("renders one labelled building per position and the empire theme", () => {
      const svg = renderEmpireSkyline(snap([pos("NVDA", 100), pos("META", 60)]));
      expect(svg).toContain("<svg");
      expect(svg).toContain("TECH EMPIRE");
      expect(svg).toContain(">NVDA<");
      expect(svg).toContain(">META<");
    });

    it("tints a building cap green for a winner and red for a loser", () => {
      const svg = renderEmpireSkyline(
        snap([pos("NVDA", 200, 100, 1) /* +100 */, pos("META", 50, 100, 1) /* -50 */]),
      );
      expect(svg).toContain("var(--pos)");
      expect(svg).toContain("var(--neg)");
    });

    it("shows a frontier plot when there are no holdings", () => {
      const svg = renderEmpireSkyline(snap([]));
      expect(svg).toContain("no holdings yet");
      expect(svg).toContain("FRONTIER EMPIRE");
    });
  });
});
