import {
  dayTrophyTiles,
  renderStatTiles,
  type StatTile,
} from "../../src/observatory/desk-tiles.js";
import type { EquitySample } from "../../src/observatory/history-store.js";

/**
 * The stat-tile row, tested through what it renders rather than how it computes.
 *
 * The invariant these cases exist to pin: a day trophy with nothing behind it reads ABSENT, never
 * as a confident zero. A "Best day" of $0 would dress a flat record as a win, and a streak of 0
 * would claim a trading day the board never recorded.
 */

/** Indexing is checked, so a missing tile fails loudly here rather than as a confusing undefined. */
const tileAt = (tiles: readonly StatTile[], i: number): StatTile => {
  const tile = tiles[i];
  if (!tile) throw new Error(`expected a tile at index ${i}, got ${tiles.length} tiles`);
  return tile;
};

const sample = (at: string, equity: number): EquitySample => ({
  at,
  participantId: "ann",
  equity,
  cash: equity,
  realizedPl: 0,
});

describe("desk tiles — the day trophies", () => {
  const twoDays: EquitySample[] = [
    sample("2026-07-31T20:00:00.000Z", 10_000),
    sample("2026-08-01T20:00:00.000Z", 11_000),
  ];

  it("reports the best day in dollars, with its date and percent alongside", () => {
    const best = tileAt(dayTrophyTiles(twoDays, "UTC"), 0);
    expect(best.label).toBe("Best day");
    expect(best.value).toContain("1,000");
    expect(best.note).toContain("2026-08-01");
    expect(best.note).toContain("+10.00%");
  });

  it("counts a green streak in trading days, singular when it is one", () => {
    const streak = tileAt(dayTrophyTiles(twoDays, "UTC"), 1);
    expect(streak.label).toBe("Green streak");
    expect(streak.value).toBe("1 trading day");
  });

  it("renders both trophies absent — never a zero — without two recorded days", () => {
    const tiles = dayTrophyTiles([], "UTC");
    for (const tile of tiles) {
      expect(tile.value).toBe("—");
      expect(tile.note).toBe("needs two days of history");
      expect(tile.cls).toBeUndefined();
    }
    expect(tiles.map((t) => t.value).join(" ")).not.toContain("0");
  });

  it("does not award a best day when every recorded day lost ground", () => {
    const losing = [
      sample("2026-07-31T20:00:00.000Z", 10_000),
      sample("2026-08-01T20:00:00.000Z", 9_000),
    ];
    const best = tileAt(dayTrophyTiles(losing, "UTC"), 0);
    expect(best.value).toBe("—"); // the least-bad loss is not a gain
  });
});

describe("desk tiles — rendering", () => {
  it("escapes tile text so a label can never inject markup", () => {
    const html = renderStatTiles([{ label: "<b>x</b>", value: "1", note: "n" }]);
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&lt;b&gt;");
  });

  it("marks the lead tile so the row has one anchor", () => {
    const html = renderStatTiles([{ label: "Equity", value: "$1", note: "n", lead: true }]);
    expect(html).toContain("desk-tile lead");
  });
});
