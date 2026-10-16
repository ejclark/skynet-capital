import { HEALTH_GLYPH, healthLine } from "../../src/live/book-health";

const counts = (gate: number, signal: number) => ({
  available: true as const,
  counts: { gate, signal, byDetector: {} },
});

/** #5493 slice 2 — the head's line for the book's health: counts by level, each level its own
 *  glyph and word, never hue alone; nothing at all when the server could not read the book. */
describe("healthLine", () => {
  it("says nothing for a book the server could not read, or an older server's payload", () => {
    expect(healthLine({ available: false })).toBeNull();
    expect(healthLine(undefined)).toBeNull();
  });

  it("says Balanced when nothing is found — a claim only a read book supports", () => {
    const line = healthLine(counts(0, 0));
    expect(line?.level).toBe("balanced");
    expect(line?.parts).toEqual([]);
    expect(line?.label).toMatch(/^Balanced/);
  });

  it("counts gates before signals, each with its own glyph and word", () => {
    const line = healthLine(counts(1, 2));
    expect(line?.level).toBe("gate");
    expect(line?.parts.map((p) => `${p.glyph} ${p.text}`)).toEqual(["■ 1 gate", "◆ 2 signals"]);
    expect(line?.label).toBe("Book health: 1 gate, 2 signals");
  });

  it("leaves out a level with nothing at it, and leads with the worst level present", () => {
    expect(healthLine(counts(0, 1))?.parts.map((p) => p.text)).toEqual(["1 signal"]);
    expect(healthLine(counts(0, 1))?.level).toBe("signal");
    expect(healthLine(counts(3, 0))?.parts.map((p) => p.text)).toEqual(["3 gates"]);
  });

  it("gives every level a glyph unique among the levels — the word and shape carry it", () => {
    const glyphs = Object.values(HEALTH_GLYPH);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});
