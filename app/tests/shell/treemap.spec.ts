import { squarify } from "../../src/shell/treemap";

// The Map lens's layout (#3689 slice 9).
describe("squarify", () => {
  const area = (t: { w: number; h: number }) => t.w * t.h;

  it("gives each item area in proportion to its weight and fills the box", () => {
    const tiles = squarify([6, 6, 4, 3, 2, 2, 1], (x) => x, { w: 6, h: 4 });
    expect(tiles).toHaveLength(7);
    const total = tiles.reduce((s, t) => s + area(t), 0);
    expect(total).toBeCloseTo(24, 6);
    for (const t of tiles) expect(area(t)).toBeCloseTo(t.item, 6);
  });

  it("keeps every tile inside the box", () => {
    for (const t of squarify([50, 20, 10, 5, 1], (x) => x)) {
      expect(t.x).toBeGreaterThanOrEqual(-1e-9);
      expect(t.y).toBeGreaterThanOrEqual(-1e-9);
      expect(t.x + t.w).toBeLessThanOrEqual(100 + 1e-9);
      expect(t.y + t.h).toBeLessThanOrEqual(100 + 1e-9);
    }
  });

  it("drops zero and negative weights, and lays out nothing when there's nothing to size", () => {
    expect(squarify([5, 0, -3], (x) => x)).toHaveLength(1);
    expect(squarify([0], (x) => x)).toEqual([]);
  });
});
