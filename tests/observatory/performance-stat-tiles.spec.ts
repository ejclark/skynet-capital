import type { EquitySample } from "../../src/observatory/history-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { renderStatTiles, statTiles } from "../../src/observatory/performance-stat-tiles.js";
import { tradeStats } from "../../src/trading/trade-stats.js";

const snapshot: ParticipantSnapshot = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 5_000,
  equity: 11_000,
  positions: [],
  activity: [],
};

describe("performance stat tiles — equity, trade stats and the day trophies", () => {
  it("leads with equity and cash, and marks trade-derived tiles as needing a closed trade when none exist", () => {
    const tiles = statTiles(tradeStats([]), snapshot, null, []);
    const equity = tiles.find((t) => t.label === "Equity");
    expect(equity?.lead).toBe(true);
    expect(equity?.value).toContain("11,000");
    const netRealized = tiles.find((t) => t.label === "Net realized");
    expect(netRealized?.note).toBe("needs a closed trade");
  });

  it("reports both day trophies as absent until two trading days are recorded", () => {
    const tiles = statTiles(tradeStats([]), snapshot, null, []);
    const bestDay = tiles.find((t) => t.label === "Best day");
    const streak = tiles.find((t) => t.label === "Green streak");
    expect(bestDay?.value).toBe("—");
    expect(streak?.value).toBe("—");
  });

  it("surfaces the biggest single-day gain once two trading days exist", () => {
    const samples: EquitySample[] = [
      {
        at: "2026-07-01T14:00:00.000Z",
        participantId: "ann",
        equity: 10_000,
        cash: 10_000,
        realizedPl: 0,
      },
      {
        at: "2026-07-02T14:00:00.000Z",
        participantId: "ann",
        equity: 11_000,
        cash: 9_000,
        realizedPl: 0,
      },
    ];
    const tiles = statTiles(tradeStats([]), snapshot, null, samples);
    const bestDay = tiles.find((t) => t.label === "Best day");
    expect(bestDay?.value).toBe("+$1,000");
    expect(bestDay?.cls).toBe("pos");
  });

  it("renders one desk-tile per stat, escaping label, value and note", () => {
    const html = renderStatTiles([{ label: "<Label>", value: "<Value>", note: "<Note>" }]);
    expect(html).toContain("&lt;Label&gt;");
    expect(html).toContain("&lt;Value&gt;");
    expect(html).toContain("&lt;Note&gt;");
    expect(html).not.toContain("<Label>");
  });

  it("marks the lead tile with the lead class", () => {
    const html = renderStatTiles([{ label: "Equity", value: "$1", note: "", lead: true }]);
    expect(html).toContain('class="desk-tile lead"');
  });
});
