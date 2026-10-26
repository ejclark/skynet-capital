import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CoverageJson, CoverageRowJson } from "../../src/live/coverage";
import { CoverageSection } from "../../src/shell/coverage-section";

/**
 * R&D → Coverage (#3811 slice 3), shape H. WHEN a member opens it, the system SHALL render all 11
 * sectors with gaps named in words, an Unclassified row, and no order button; a tap SHALL hand the
 * sector to the Board; with no market data it SHALL say so and show no number.
 */

const row = (sector: string, over: Partial<CoverageRowJson> = {}): CoverageRowJson => ({
  sector,
  slug: sector.toLowerCase().replace(/[^a-z]+/g, "-"),
  fund: "XL?",
  depth: "gap",
  researched: [],
  calendar: [],
  held: [],
  macroReports: 0,
  next: null,
  ...over,
});

const SECTORS: CoverageRowJson[] = [
  row("Technology", {
    fund: "XLK",
    depth: "researched",
    researched: ["MSFT", "NVDA"],
    next: { title: "MSFT print", date: "2026-10-28" },
    fundLine: { ret: "+3.0%", retTone: "pos", vsSpy: "+1.1 pts vs S&P", vsSpyTone: "pos" },
  }),
  row("Energy", { fund: "XLE", depth: "events", macroReports: 21 }),
  ...[
    "Communication Services",
    "Healthcare",
    "Financials",
    "Consumer Discretionary",
    "Consumer Staples",
    "Industrials",
    "Utilities",
    "Real Estate",
    "Materials",
  ].map((s) => row(s)),
];

const payload = (over: Partial<CoverageJson> = {}): CoverageJson => ({
  asOf: "2026-10-26",
  coveredCount: 2,
  byName: 1,
  byMacroOnly: 1,
  gaps: SECTORS.filter((s) => s.depth === "gap").map((s) => s.sector),
  holdingsRead: true,
  heldSectorCount: 0,
  sectors: SECTORS,
  unclassified: row("Unclassified", { slug: null, fund: null, held: ["EEM"], depth: "held" }),
  funds: { available: true, window: "1M", asOf: "2026-10-23" },
  ...over,
});

let served: CoverageJson = payload();
rstest.mock("../../src/live/coverage", () => ({
  coverageQuery: () => ({
    queryKey: ["research-coverage"],
    queryFn: () => Promise.resolve(served),
  }),
}));

const mount = (onPick: (s: string) => void = () => undefined) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <CoverageSection scoped="Energy" onPick={onPick} />
    </QueryClientProvider>,
  );

afterEach(() => {
  cleanup();
  served = payload();
});

describe("R&D → Coverage", () => {
  it("draws all 11 sectors as rows a member can tap, plus Unclassified", async () => {
    mount();
    expect(
      await screen.findAllByRole("button", { name: /show its research on the Board/ }),
    ).toHaveLength(11);
    expect(screen.getByText("Unclassified")).toBeTruthy();
    expect(screen.getByText(/not a GICS sector/)).toBeTruthy();
  });

  it("names every gap in words, not just with the hatch", async () => {
    mount();
    await screen.findByText("Technology");
    expect(screen.getAllByText("gap")).toHaveLength(9);
    expect(screen.getByText(/9 gaps:/)).toBeTruthy();
  });

  it("hands the tapped sector to the Board, and marks the one already scoped", async () => {
    const picked: string[] = [];
    mount((s) => picked.push(s));
    fireEvent.click(await screen.findByRole("button", { name: /^Technology:/ }));
    expect(picked).toEqual(["Technology"]);
    expect(screen.getByRole("button", { name: /^Energy:/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("puts no order button beside any number", async () => {
    mount();
    await screen.findByText("Technology");
    expect(screen.queryByRole("button", { name: /buy|sell|trade|order/i })).toBeNull();
    expect(screen.getAllByText("+1.1 pts vs S&P").length).toBeGreaterThan(0);
  });

  it("says there is no market data and shows no fund number without a linked account", async () => {
    served = payload({
      funds: { available: false, note: "No market data — none is linked." },
      sectors: SECTORS.map(({ fundLine: _drop, ...rest }) => rest),
    });
    mount();
    expect(await screen.findByText(/No market data — none is linked\./)).toBeTruthy();
    expect(screen.queryByText(/pts vs S&P/)).toBeNull();
  });

  it("falls back to the month itself when the S&P leg is missing, and names a fund that came back empty", async () => {
    served = payload({
      sectors: SECTORS.map((r) =>
        r.sector === "Technology" ? { ...r, fundLine: { ret: "-0.8%", retTone: "neg" } } : r,
      ),
    });
    mount();
    expect((await screen.findAllByText("-0.8%")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/XLE — no market data/).length).toBe(1);
  });

  it("names a holding outside every sector in the readout", async () => {
    mount();
    expect(await screen.findByText(/1 outside all of them \(EEM, Unclassified\)/)).toBeTruthy();
  });
});
