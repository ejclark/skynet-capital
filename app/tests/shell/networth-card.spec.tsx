import { render, screen, within } from "@testing-library/react";
import type { NetWorthStatsView } from "../../src/live/networth";
import { highLineReturn } from "../../src/shell/hero-chart-mount";
import { NetWorthCard } from "../../src/shell/networth-card";

const stats: NetWorthStatsView = {
  value: "$1,047,832.14",
  valueKnown: true,
  dayChange: "+$2,418 · +0.23%",
  dayTone: "pos",
  dayKnown: true,
  cash: "$344,958",
  cashKnown: true,
  positionCount: 8,
  bookedPl: "+$12,480",
  bookedTone: "pos",
  bookedKnown: true,
  onPaper: "-$3,120",
  onPaperTone: "neg",
  onPaperKnown: true,
  windows: [
    {
      label: "1M",
      note: "the last month",
      value: "+4.60%",
      tone: "pos",
      known: true,
      vsBenchmark: "+2.3 pts vs S&P",
      vsBenchmarkTone: "pos",
    },
    { label: "1Y", note: "the last year", value: "—", tone: "flat", known: false },
  ],
  allTimeHigh: { value: "$1,051,200", at: "9/19", aboveNow: 0.0032 },
  toNewHigh: "$3,368",
};

// The Overview's net-worth card (#3689 slice 3), shown here in its "All accounts" form (no chart).
describe("NetWorthCard", () => {
  it("answers 'am I winning' in plain words: today, locked in, on paper", () => {
    render(<NetWorthCard stats={stats} caption="Eric" />);
    expect(screen.getByRole("region", { name: "Net worth · Eric" })).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Locked in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "On paper" })).toBeInTheDocument();
    expect(screen.getByText("-$3,120")).toHaveClass("tone-neg");
  });

  it("sets the cents smaller, beside the whole dollars", () => {
    render(<NetWorthCard stats={stats} caption="Eric" />);
    expect(screen.getByText(".14")).toHaveClass("nw-cents");
  });

  it("scores each window against the S&P, and leaves a blank where there's no comparison", () => {
    render(<NetWorthCard stats={stats} caption="Eric" />);
    const month = screen.getByRole("row", { name: /1M/ });
    expect(within(month).getByText("+2.3 pts vs S&P")).toHaveClass("tone-pos");
    const year = screen.getByRole("row", { name: /1Y/ });
    expect(within(year).queryByText(/vs S&P/)).not.toBeInTheDocument();
  });

  it("shows the gap to a new high, or celebrates being at one", () => {
    const { rerender } = render(<NetWorthCard stats={stats} caption="Eric" />);
    expect(screen.getByText("$3,368")).toBeInTheDocument();
    const { toNewHigh: _gone, ...atHigh } = stats;
    rerender(
      <NetWorthCard
        stats={{ ...atHigh, allTimeHigh: { value: "$1,047,832", at: "9/24", aboveNow: 0 } }}
        caption="Eric"
      />,
    );
    expect(screen.getByText("At a new high ✦")).toBeInTheDocument();
  });

  it("draws no high and no meter when the history is unknown", () => {
    const { allTimeHigh: _h, toNewHigh: _t, ...unknown } = stats;
    const { container } = render(<NetWorthCard stats={unknown} caption="Eric" />);
    expect(container.querySelector(".nw-foot")).toBeNull();
  });
});

describe("highLineReturn", () => {
  it("places the high on the range's own %-return scale", () => {
    // Up 5% over the range, and the high is 1% above today: 1.05 × 1.01 − 1.
    expect(highLineReturn(0.05, 0.01)).toBeCloseTo(0.0605, 10);
    // At a new high, the line sits on today's value.
    expect(highLineReturn(0.05, 0)).toBeCloseTo(0.05, 10);
  });
});
