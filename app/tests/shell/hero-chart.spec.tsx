import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { BarsAnswer } from "../../src/live/bars";
import type { EquityCurve, EquityCurveRange } from "../../src/live/equity-curve";
import { HeroChart, HeroChartFlows, HeroChartLegend } from "../../src/shell/hero-chart";
import type { OverlaySeries } from "../../src/shell/hero-chart-data";

/**
 * `HeroChart`'s degrade branches and range-selector wiring (#3186 slice 2) — same doctrine as
 * `chart-section.spec.tsx`: everything here returns BEFORE `mountHeroChart`'s `createChart` call,
 * which throws under happy-dom. The real-overlay mount is covered by `hero-chart-mount.spec.ts`
 * (one deliberate smoke test) and the alignment math by `hero-chart-data.spec.ts`.
 */

let nextCurve: EquityCurve = { range: "1M", points: [] };
let nextBars: BarsAnswer = { barsNote: "unset" };
let curveShouldFail = false;
const curveCalls: [string, EquityCurveRange][] = [];
const barsCalls: string[] = [];

rstest.mock("../../src/live/equity-curve", () => ({
  EQUITY_CURVE_RANGES: ["7D", "1M", "3M", "1Y", "YTD", "ALL"] as const,
  daysFor: (range: EquityCurveRange) =>
    ({ "7D": 7, "1M": 31, "3M": 93, "1Y": 366, YTD: 260, ALL: 1825 })[range],
  fetchEquityCurve: (accountId: string, range: EquityCurveRange) => {
    curveCalls.push([accountId, range]);
    return curveShouldFail ? Promise.reject(new Error("down")) : Promise.resolve(nextCurve);
  },
}));
rstest.mock("../../src/live/bars", () => ({
  fetchBars: (symbol: string) => {
    barsCalls.push(symbol);
    return Promise.resolve(nextBars);
  },
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

beforeEach(() => {
  curveCalls.length = 0;
  barsCalls.length = 0;
  nextCurve = { range: "1M", points: [] };
  nextBars = { barsNote: "unset" };
  curveShouldFail = false;
});

describe("HeroChart", () => {
  it("shows a loading note before either fetch resolves", () => {
    render(withClient(<HeroChart accountId="human-eric" />));
    expect(screen.getByText("Loading the chart…")).toBeInTheDocument();
  });

  it("defaults to the 1M range on first render", async () => {
    render(withClient(<HeroChart accountId="human-eric" />));
    await waitFor(() => expect(curveCalls).toEqual([["human-eric", "1M"]]));
    expect(screen.getByRole("button", { name: "1M" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders an honest empty state when the account has no history for this range", async () => {
    render(withClient(<HeroChart accountId="human-eric" />));
    await waitFor(() =>
      expect(screen.getByText("No net worth history for this range yet.")).toBeInTheDocument(),
    );
  });

  it("renders an unreachable note on a curve fetch error, never a blank chart", async () => {
    curveShouldFail = true;
    render(withClient(<HeroChart accountId="human-eric" />));
    await waitFor(() =>
      expect(screen.getByText("Net worth history is unreachable right now.")).toBeInTheDocument(),
    );
  });

  it("re-fetches both series with the new range when a range button is clicked", async () => {
    render(withClient(<HeroChart accountId="human-eric" />));
    await waitFor(() => expect(curveCalls).toEqual([["human-eric", "1M"]]));

    fireEvent.click(screen.getByRole("button", { name: "1Y" }));

    await waitFor(() =>
      expect(curveCalls).toEqual([
        ["human-eric", "1M"],
        ["human-eric", "1Y"],
      ]),
    );
    expect(screen.getByRole("button", { name: "1Y" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "1M" })).toHaveAttribute("aria-pressed", "false");
  });

  it("offers every range from 7D through ALL", () => {
    render(withClient(<HeroChart accountId="human-eric" />));
    for (const r of ["7D", "1M", "3M", "1Y", "YTD", "ALL"]) {
      expect(screen.getByRole("button", { name: r })).toBeInTheDocument();
    }
  });
});

/**
 * The legend's "You" and "S&P 500" figures (#5204): WHEN a change is shown, THE number SHALL carry a
 * real minus for a loss, and WHEN it rounds to zero it SHALL print unsigned AND be toned flat — a
 * red "0.0%" would let the hue claim a loss the words don't (a standing reader is red/green
 * colourblind).
 */
describe("HeroChartLegend", () => {
  const overlay = (portfolio: number, benchmark: number): OverlaySeries =>
    ({
      portfolio: [{ time: "2026-10-16", value: portfolio }],
      benchmark: [{ time: "2026-10-16", value: benchmark }],
    }) as OverlaySeries;

  it("writes a loss with a real minus, toned as a loss", () => {
    render(<HeroChartLegend overlay={overlay(-0.012, 0.035)} />);
    const you = screen.getByText("\u22121.2%");
    expect(you).toHaveClass("tone-neg");
    expect(screen.getByText("+3.5%")).toBeInTheDocument();
  });

  it("writes a move that rounds to zero as an unsigned, flat 0.0% either way", () => {
    const { unmount } = render(<HeroChartLegend overlay={overlay(-0.0004, 0)} />);
    expect(screen.getAllByText("0.0%")[0]).toHaveClass("tone-flat");
    unmount();
    render(<HeroChartLegend overlay={overlay(0.0004, 0)} />);
    expect(screen.getAllByText("0.0%")[0]).toHaveClass("tone-flat");
  });
});

describe("HeroChartFlows (#4563)", () => {
  it("renders nothing when the curve carries no flow", () => {
    const { container } = render(<HeroChartFlows flows={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("names each flow under the chart and says the line is inferred", () => {
    render(
      <HeroChartFlows
        flows={[
          {
            time: "2026-10-05" as never,
            direction: "added",
            label: "Capital added $300,000 on Oct 5 — not a gain",
          },
        ]}
      />,
    );
    expect(screen.getByText("Capital added $300,000 on Oct 5 — not a gain")).toBeTruthy();
    expect(screen.getByText(/inferred from our own records/)).toBeTruthy();
  });
});
