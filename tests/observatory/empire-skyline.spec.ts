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

    it("shows a frontier plot when there are no holdings AND no cash", () => {
      const svg = renderEmpireSkyline(snap([]));
      expect(svg).toContain("no holdings yet");
      expect(svg).toContain("FRONTIER EMPIRE");
    });

    it("renders a founding RESERVE (empire about to rise) when unfounded but holding cash", () => {
      const svg = renderEmpireSkyline(snap([], { cash: 1_000_000, equity: 1_000_000 }));
      expect(svg).toContain("AWAITING FOUNDING");
      expect(svg).toContain("$1.0M RESERVE");
      expect(svg).not.toContain("no holdings yet"); // dry powder reads as a city-in-waiting, not a blank
    });

    it("scales the founding reserve label to the dry powder magnitude", () => {
      expect(renderEmpireSkyline(snap([], { cash: 40_000, equity: 40_000 }))).toContain(
        "$40K RESERVE",
      );
    });

    it("compact founding reserve drops the labels but keeps the scaffold", () => {
      const svg = renderEmpireSkyline(snap([], { cash: 50_000, equity: 50_000 }), {
        compact: true,
      });
      expect(svg).toContain("empire-skyline-compact");
      expect(svg).not.toContain("AWAITING FOUNDING");
    });

    it("crowns the Sauron persona's tallest tower with the Eye emblem (P1 landmark)", () => {
      const sauron = renderEmpireSkyline(snap([pos("NVDA", 100)], { personaId: "sauron" }));
      expect(sauron).toContain("persona-eye");
      const other = renderEmpireSkyline(snap([pos("NVDA", 100)], { personaId: "day-trader" }));
      expect(other).not.toContain("persona-eye");
    });

    it("aggregates holdings beyond the display cap into a labeled outer district", () => {
      const many = Array.from({ length: 12 }, (_, i) => pos(`T${i}`, 100 - i));
      const svg = renderEmpireSkyline(snap(many));
      expect(svg).toContain(">+3<"); // 12 holdings, 9 towers, 3 aggregated — visibly, never silently
      expect(svg).toContain(">OUTER<");
      const few = renderEmpireSkyline(snap([pos("NVDA", 100)]));
      expect(few).not.toContain("OUTER");
    });

    it("compact mode drops per-building ticker labels + RESERVE but keeps the theme", () => {
      const svg = renderEmpireSkyline(snap([pos("NVDA", 100), pos("META", 60)], { cash: 40 }), {
        compact: true,
      });
      expect(svg).toContain("empire-skyline-compact");
      expect(svg).toContain("TECH EMPIRE");
      expect(svg).not.toContain(">NVDA<");
      expect(svg).not.toContain("RESERVE");
    });
  });
});
