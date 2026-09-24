import { fireEvent, render, screen } from "@testing-library/react";
import type { DeskAllocation, DeskPosition } from "../../src/live/desk";
import { LensSwitch, MapLens, parseLens, RunwayLens } from "../../src/shell/positions-lens";

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "AAPL",
  display: "AAPL",
  detail: "",
  isOption: false,
  quantity: "100",
  costPerShare: "$190.00",
  price: "$200.00",
  costBasis: "$19,000",
  value: "$20,000",
  dayPl: "+$100",
  dayPct: "+0.5%",
  dayTone: "pos",
  totalPl: "+$1,000",
  totalPlRaw: 1000,
  returnPct: "+5.26%",
  totalTone: "pos",
  weightPct: 80,
  ...over,
});

const call = pos({
  symbol: "NVDA261218C00130000",
  display: "NVDA Dec 18 130 Call",
  isOption: true,
  value: "$5,000",
  returnPct: "-12.00%",
  totalTone: "neg",
  weightPct: 20,
  expiresIn: "85 days",
  expiresInDays: 85,
});
const put = pos({
  symbol: "TSLA261017P00400000",
  display: "TSLA Oct 17 400 Put",
  isOption: true,
  expiresIn: "24 days",
  expiresInDays: 24,
});

const allocation: DeskAllocation = {
  shares: "$20,000",
  options: "$5,000",
  cash: "$25,000",
  sharesPct: 40,
  optionsPct: 10,
  cashPct: 50,
  cashShare: "50.0%",
  shareCount: 100,
};

// The positions lenses (#3689 slices 9–10).
describe("parseLens", () => {
  it("accepts the three lenses and nothing else", () => {
    expect(parseLens("map")).toBe("map");
    expect(parseLens("runway")).toBe("runway");
    expect(parseLens("grid")).toBeUndefined();
  });
});

describe("LensSwitch", () => {
  it("presses the current lens and reports the next", () => {
    const seen: string[] = [];
    render(<LensSwitch lens="list" onChange={(l) => seen.push(l)} />);
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    expect(seen).toEqual(["map"]);
  });
});

describe("MapLens", () => {
  it("tiles cash and shares, gives options their strip, and says how much it's scaled up", () => {
    render(<MapLens positions={[pos({}), call]} allocation={allocation} decisions={[]} />);
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("NVDA Dec 18 130 Call")).toBeInTheDocument();
    expect(screen.getByText(/true share of your account is 10.0%/)).toBeInTheDocument();
  });
});

describe("RunwayLens", () => {
  it("lines up options by expiry, soonest first, and says why shares aren't on it", () => {
    render(<RunwayLens positions={[call, pos({}), put]} />);
    const names = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(names[0]).toMatch(/TSLA Oct 17 400 Put/);
    expect(names[1]).toMatch(/NVDA Dec 18 130 Call/);
    expect(screen.getByText(/1 share position not shown: shares don't expire/)).toBeInTheDocument();
  });

  it("has a plain empty state with no options", () => {
    render(<RunwayLens positions={[pos({})]} />);
    expect(screen.getByText(/Nothing expires in your book/)).toBeInTheDocument();
  });
});
