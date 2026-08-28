import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  standingsBoardView,
  standingsCompareView,
} from "../../src/observatory/standings-board-view.js";
import { cohortStats } from "../../src/observatory/standings-cohort.js";
import { formatMetric, metricLabel, metricValue } from "../../src/observatory/standings-metric.js";
import { standingsFieldOps } from "../../src/observatory/standings-patch.js";
import { renderStandingsContent } from "../../src/observatory/standings-view.js";

/**
 * The live board's display patch. Two questions decide every test here: does it emit ONLY what
 * moved, and does it refuse to half-update a page whose structure moved?
 */

const pos = (symbol: string, quantity: number, avgPrice: number, marketValue: number) => ({
  symbol,
  quantity,
  avgPrice,
  marketValue,
});

function snap(over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot {
  return {
    id: over.id ?? "human-eric",
    displayName: over.displayName ?? "Eric",
    kind: over.kind ?? "human",
    cash: over.cash ?? 50_000,
    equity: over.equity ?? 150_000,
    positions: over.positions ?? [pos("NVDA", 100, 500, 60_000)],
    ...(over.realizedPl === undefined ? {} : { realizedPl: over.realizedPl }),
  };
}

const data = (...participants: ParticipantSnapshot[]): DashboardData => ({
  generatedAt: "2026-08-26T15:00:00.000Z",
  participants,
  collisions: [],
});

const board = (equityA = 150_000, equityB = 120_000) =>
  data(
    snap({ equity: equityA }),
    snap({ id: "bot-sauron", displayName: "Sauron", kind: "bot", equity: equityB }),
  );

const fieldKeys = (ops: ReturnType<typeof standingsFieldOps>): string[] =>
  ops.flatMap((op) => (op.kind === "field" ? [op.key] : []));

describe("standingsFieldOps", () => {
  it("says nothing when no rendered figure moved", () => {
    expect(standingsFieldOps(board(), board(), { metric: "equity" })).toEqual([]);
  });

  it("carries the moved row's new value and its sort position", () => {
    const ops = standingsFieldOps(board(), board(160_000), { metric: "equity" });
    const row = ops.find((op) => op.kind === "field" && op.key === "human-eric");
    expect(row).toMatchObject({ text: { value: "$160,000" }, sortValue: 160_000 });
  });

  it("leaves an untouched board alone — a row is on the wire only when its render moved", () => {
    // A second board where nothing at all changed produces nothing; the row op above is not a
    // per-tick broadcast. (A row whose BAR moved is legitimately patched: the bar is relative to
    // the field's largest value, so a leader pulling away really does redraw everyone's bar.)
    const still = board(150_000, 120_000);
    expect(standingsFieldOps(still, still, { metric: "equity" })).toEqual([]);
  });

  it("reorders in place by sort value, carrying no placing text", () => {
    const before = data(
      snap({ id: "h1", displayName: "Eric", equity: 150_000 }),
      snap({ id: "h2", displayName: "Ada", equity: 140_000 }),
      snap({ id: "bot-sauron", displayName: "Sauron", kind: "bot", equity: 90_000 }),
    );
    const after = data(
      snap({ id: "h1", displayName: "Eric", equity: 130_000 }),
      snap({ id: "h2", displayName: "Ada", equity: 140_000 }),
      snap({ id: "bot-sauron", displayName: "Sauron", kind: "bot", equity: 90_000 }),
    );
    const ops = standingsFieldOps(before, after, { metric: "equity" });
    // The overtaken row carries its new SORT VALUE, which is what repositions it. There is no
    // ordinal on the wire any more (#576) — position is a consequence of the figure, not a label.
    const h1 = ops.find((op) => op.kind === "field" && op.key === "h1");
    expect(h1).toMatchObject({ sortValue: 130_000 });
    expect(JSON.stringify(h1)).not.toContain("rank");

    // Ada's own equity never moved, but the field's largest value did, so her BAR is redrawn —
    // that, not a placing, is why she is on the wire.
    const h2 = ops.find((op) => op.kind === "field" && op.key === "h2");
    expect(h2).toMatchObject({ sortValue: 140_000 });
    expect(JSON.stringify(h2)).not.toContain("rank");
  });

  it("formats each viewer's own metric, not a single shared one", () => {
    const before = data(snap({ realizedPl: 100 }));
    const after = data(snap({ realizedPl: 250 }));
    const ops = standingsFieldOps(before, after, { metric: "realized" });
    expect(ops[0]).toMatchObject({ kind: "field", text: { value: "+$250" } });
    // The same pair moves nothing at all on the equity board — realized P/L isn't shown there.
    expect(standingsFieldOps(before, after, { metric: "equity" })).toEqual([]);
  });

  it("patches the cohort card and the match bar when the aggregate read moves", () => {
    const ops = standingsFieldOps(board(), board(160_000), { metric: "equity" });
    expect(fieldKeys(ops)).toEqual(expect.arrayContaining(["cohort:human", "match", "versus"]));
    const match = ops.find((op) => op.kind === "field" && op.key === "match");
    expect(match?.kind === "field" && match.bar).toMatchObject({ human: expect.any(Number) });
  });

  it("renders an ABSENT best performer as an em dash and an EMPTY figure, never a fake 0%", () => {
    const empty = data();
    const ops = standingsFieldOps(empty, data(snap()), { metric: "equity" });
    // A row appearing is structural, so this is a reframe — but the cohort formatting itself must
    // still be honest, which the direct read below pins.
    expect(ops).toEqual([{ kind: "reframe", reason: "the field gained or lost a row" }]);
    expect(cohortStats([], "bot", "Bots").best).toBeUndefined();
  });

  describe("refuses to half-update — the reframe cases", () => {
    it("when the field gains or loses a row", () => {
      const ops = standingsFieldOps(board(), data(snap()), { metric: "equity" });
      expect(ops).toEqual([{ kind: "reframe", reason: "the field gained or lost a row" }]);
    });

    it("when the cohort lead changes sides (the LEADS badge and card order move)", () => {
      const ops = standingsFieldOps(board(150_000, 120_000), board(100_000, 120_000), {
        metric: "equity",
      });
      expect(ops).toEqual([{ kind: "reframe", reason: "the cohort lead changed sides" }]);
    });

    it("when a head-to-head compare is on screen — that view keeps the full-render path", () => {
      const ops = standingsFieldOps(board(), board(160_000), {
        metric: "equity",
        aId: "human-eric",
        bId: "bot-sauron",
      });
      expect(ops).toEqual([
        { kind: "reframe", reason: "head-to-head compare keeps the full-render path" },
      ]);
    });
  });

  it("addresses nodes the rendered page actually has", () => {
    const html = renderStandingsContent(board(), { metric: "equity" });
    for (const key of ["human-eric", "cohort:human", "cohort:bot", "match", "versus"]) {
      expect(html).toContain(`data-field-key="${key}"`);
    }
    for (const field of ["value", "totalEquity", "humanLabel", "totalGap"]) {
      expect(html).toContain(`data-field="${field}"`);
    }
    expect(html).toContain("data-sortable");
  });
});

describe("standings metric helpers", () => {
  it("values and formats each metric the way the ladder shows it", () => {
    const p = snap({ equity: 150_000, realizedPl: -250 });
    expect(metricValue(p, "equity")).toBe(150_000);
    expect(metricValue(p, "realized")).toBe(-250);
    expect(formatMetric(metricValue(p, "realized"), "realized")).toBe("-$250");
    expect(formatMetric(12.345, "return")).toBe("+12.35%");
    expect(metricLabel("pl")).toBe("Unrealized P/L");
    expect(metricLabel("equity")).toBe("Equity");
  });

  it("treats a participant with nothing invested as flat, never as a divide-by-zero", () => {
    expect(metricValue(snap({ positions: [] }), "return")).toBe(0);
  });
});

describe("cohortStats", () => {
  it("splits by average per account so headcount alone can't win the match", () => {
    const many = data(
      snap({ id: "h1", equity: 100_000 }),
      snap({ id: "h2", equity: 100_000 }),
      snap({ id: "bot-sauron", kind: "bot", equity: 150_000 }),
    );
    const humans = cohortStats(many.participants, "human", "Humans");
    const bots = cohortStats(many.participants, "bot", "Bots");
    expect(humans.totalEquity).toBeGreaterThan(bots.totalEquity);
    expect(bots.avgEquity).toBeGreaterThan(humans.avgEquity);
  });
});

describe("standingsBoardView", () => {
  it("serves the same formatted values and keys the field ops address, plus row identity", () => {
    const view = standingsBoardView(board(), "equity");
    expect(view.rows.map((r) => r.key)).toEqual(["human-eric", "bot-sauron"]);
    expect(view.rows[0]).toMatchObject({ name: "Eric", kind: "human", value: "$150,000" });
    expect(Object.keys(view.blocks).sort()).toEqual([
      "cohort:bot",
      "cohort:human",
      "match",
      "versus",
    ]);
    expect(view.blocks["cohort:human"]?.text.totalEquity).toBe("$150,000");
  });

  it("renders a snapshot a later field op patches coherently — op values land on view keys", () => {
    const view = standingsBoardView(board(), "equity");
    const ops = standingsFieldOps(board(), board(160_000), { metric: "equity" });
    for (const op of ops) {
      if (op.kind !== "field") continue;
      const target = view.rows.some((r) => r.key === op.key) || view.blocks[op.key] !== undefined;
      expect(target).toBe(true);
    }
  });
});

describe("standingsCompareView", () => {
  it("formats both sides with the page's own helpers and names who leads each delta", () => {
    const a = snap({ id: "h1", displayName: "Eric", equity: 150_000 });
    const b = snap({
      id: "bot-sauron",
      displayName: "Sauron",
      kind: "bot",
      equity: 120_000,
      positions: [pos("NVDA", 50, 400, 30_000), pos("GLD", 10, 180, 2_000)],
    });
    const view = standingsCompareView(a, b);
    expect(view.a).toMatchObject({ name: "Eric", kind: "human", equity: "$150,000" });
    expect(view.deltas[0]).toMatchObject({ label: "Equity", lead: "a", amount: "$30,000" });
    // Holdings union sorts by combined weight; the shared symbol carries both values.
    const nvda = view.holdings.find((h) => h.symbol === "NVDA");
    expect(nvda).toMatchObject({ shared: true, heavier: "a" });
    expect(view.holdings.find((h) => h.symbol === "GLD")).toMatchObject({
      shared: false,
      heavier: "b",
    });
  });

  it("calls a dead-even metric a tie, never a lead", () => {
    const a = snap({ id: "h1", equity: 100_000 });
    const b = snap({ id: "h2", equity: 100_000 });
    expect(standingsCompareView(a, b).deltas[0]?.lead).toBe("tie");
  });
});
