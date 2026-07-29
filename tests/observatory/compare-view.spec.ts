import { renderCompareBody } from "../../src/observatory/compare-view.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type {
  ParticipantSnapshot,
  PositionView,
} from "../../src/observatory/participant-snapshot.js";

/** Build a comparison-ready snapshot; overrides let each spec state only what it cares about. */
function aSnapshot(overrides: Partial<ParticipantSnapshot> & Pick<ParticipantSnapshot, "id">) {
  const snapshot: ParticipantSnapshot = {
    id: overrides.id,
    displayName: overrides.displayName ?? overrides.id,
    kind: overrides.kind ?? "human",
    cash: overrides.cash ?? 1_000,
    equity: overrides.equity ?? 10_000,
    positions: overrides.positions ?? [],
    ...(overrides.personaId !== undefined ? { personaId: overrides.personaId } : {}),
    ...(overrides.timezone !== undefined ? { timezone: overrides.timezone } : {}),
    ...(overrides.realizedPl !== undefined ? { realizedPl: overrides.realizedPl } : {}),
    ...(overrides.activity !== undefined ? { activity: overrides.activity } : {}),
    ...(overrides.error !== undefined ? { error: overrides.error } : {}),
  };
  return snapshot;
}

function aPosition(overrides: Partial<PositionView> & Pick<PositionView, "symbol">): PositionView {
  return {
    symbol: overrides.symbol,
    quantity: overrides.quantity ?? 10,
    avgPrice: overrides.avgPrice ?? 90,
    marketValue: overrides.marketValue ?? 1_000,
  };
}

function aData(participants: ParticipantSnapshot[]): DashboardData {
  return { generatedAt: "2026-07-29T12:00:00.000Z", participants };
}

describe("renderCompareBody", () => {
  describe("when both participants resolve", () => {
    it("renders each participant's name, chip, and equity in their own column", () => {
      const a = aSnapshot({ id: "human-eric", displayName: "Eric", equity: 12_000, kind: "human" });
      const b = aSnapshot({
        id: "news-fader",
        displayName: "News Fader",
        equity: 9_000,
        kind: "bot",
      });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toContain("Eric");
      expect(html).toContain("News Fader");
      expect(html).toContain("$12,000");
      expect(html).toContain("$9,000");
      expect(html).toContain("HUMAN");
      expect(html).toContain("BOT");
      expect(html).toContain('Eric <span class="cmp-vs">vs</span> News Fader');
    });

    it("marks the leading side with a forward marker when A is ahead on equity", () => {
      const a = aSnapshot({ id: "a", displayName: "Ahead", equity: 20_000 });
      const b = aSnapshot({ id: "b", displayName: "Behind", equity: 10_000 });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      // A leads: the delta marker points left (◀), with the absolute equity gap shown.
      expect(html).toMatch(/◀ \+?\$10,000/);
    });

    it("marks the leading side with a backward marker when B is ahead on equity", () => {
      const a = aSnapshot({ id: "a", displayName: "Behind", equity: 10_000 });
      const b = aSnapshot({ id: "b", displayName: "Ahead", equity: 20_000 });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toMatch(/▶ \+?\$10,000/);
    });

    it("shows a flat delta with no directional marker when both sides are tied", () => {
      const a = aSnapshot({ id: "a", displayName: "Tied A", equity: 10_000 });
      const b = aSnapshot({ id: "b", displayName: "Tied B", equity: 10_000 });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toContain(`<span class="cmp-dval num flat">— $0</span>`);
    });

    it("renders identical participants without error, with a flat delta on every metric", () => {
      const a = aSnapshot({
        id: "same",
        displayName: "Solo",
        equity: 5_000,
        positions: [aPosition({ symbol: "AAPL", marketValue: 500, avgPrice: 100, quantity: 5 })],
      });
      const b = aSnapshot({
        id: "same",
        displayName: "Solo",
        equity: 5_000,
        positions: [aPosition({ symbol: "AAPL", marketValue: 500, avgPrice: 100, quantity: 5 })],
      });
      const html = renderCompareBody(aData([a]), { aId: a.id, bId: b.id });

      // Same id resolves to the same snapshot on both sides — the comparison still renders cleanly.
      expect(html).toContain('Solo <span class="cmp-vs">vs</span> Solo');
      expect(html.match(/flat/g)?.length).toBeGreaterThan(0);
    });

    it("shows shared holdings tagged SHARED with both sides' values", () => {
      const a = aSnapshot({
        id: "a",
        displayName: "A",
        positions: [aPosition({ symbol: "AAPL", marketValue: 2_000 })],
      });
      const b = aSnapshot({
        id: "b",
        displayName: "B",
        positions: [aPosition({ symbol: "AAPL", marketValue: 1_000 })],
      });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toContain("SHARED");
      expect(html).toContain("cmp-shared");
      // The heavier side (A, at $2,000) is marked distinctly from the lighter side.
      expect(html).toContain("aheavy");
    });

    it("shows a symbol only one side holds with a placeholder dash on the other side", () => {
      const a = aSnapshot({
        id: "a",
        displayName: "A",
        positions: [aPosition({ symbol: "TSLA", marketValue: 3_000 })],
      });
      const b = aSnapshot({ id: "b", displayName: "B", positions: [] });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toContain("TSLA");
      expect(html).not.toContain("SHARED");
      expect(html).toMatch(/<td class="num cmp-bval">·<\/td>/);
    });

    it("shows an empty-state message when neither side holds any position", () => {
      const a = aSnapshot({ id: "a", displayName: "A", positions: [] });
      const b = aSnapshot({ id: "b", displayName: "B", positions: [] });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toContain("Neither holds an open position yet.");
    });

    it("escapes HTML in display names to prevent markup injection", () => {
      const a = aSnapshot({ id: "a", displayName: "<script>bad</script>" });
      const b = aSnapshot({ id: "b", displayName: "B" });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).not.toContain("<script>bad</script>");
      expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
    });

    it("includes the history-layer seam note for future per-play insights", () => {
      const a = aSnapshot({ id: "a" });
      const b = aSnapshot({ id: "b" });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toContain("Which plays worked");
    });
  });

  describe("when the pair is incomplete", () => {
    it("renders a picker of live participants when neither id is given", () => {
      const a = aSnapshot({ id: "a", displayName: "Alice" });
      const b = aSnapshot({ id: "b", displayName: "Bob" });
      const html = renderCompareBody(aData([a, b]), {});

      expect(html).toContain("Pick two to compare");
      expect(html).toContain("Alice");
      expect(html).toContain("Bob");
      expect(html).toContain("cmp-pick");
    });

    it("anchors the picker on the first participant when only aId is given", () => {
      const a = aSnapshot({ id: "a", displayName: "Alice" });
      const b = aSnapshot({ id: "b", displayName: "Bob" });
      const html = renderCompareBody(aData([a, b]), { aId: a.id });

      expect(html).toContain("Compare <strong>Alice</strong> with…");
      // The anchor itself is not offered as a pick target.
      expect(html).not.toContain(`href="/compare?a=a&b=a"`);
      expect(html).toContain(`/compare?a=a&b=b`);
    });

    it("falls back to the picker when aId resolves to a participant with a read error", () => {
      const a = aSnapshot({ id: "a", displayName: "Alice", error: "unreachable" });
      const b = aSnapshot({ id: "b", displayName: "Bob" });
      const html = renderCompareBody(aData([a, b]), { aId: a.id, bId: b.id });

      expect(html).toContain("Pick two to compare");
    });

    it("falls back to the picker when bId does not resolve to any participant", () => {
      const a = aSnapshot({ id: "a", displayName: "Alice" });
      const html = renderCompareBody(aData([a]), { aId: a.id, bId: "missing" });

      expect(html).toContain("Compare <strong>Alice</strong> with…");
    });

    it("shows an empty-state message in the picker when there are no live participants", () => {
      const errored = aSnapshot({ id: "a", displayName: "Alice", error: "down" });
      const html = renderCompareBody(aData([errored]), {});

      expect(html).toContain("No participants to compare yet.");
    });
  });
});
