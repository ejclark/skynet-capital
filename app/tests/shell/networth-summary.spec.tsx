import { render, screen } from "@testing-library/react";
import type { NetWorthStatsView } from "../../src/live/networth";
import { NetWorthCondensed } from "../../src/shell/networth-summary";

const base: NetWorthStatsView = {
  value: "$101,000",
  valueKnown: true,
  dayChange: "+$1,000 · +1.00%",
  dayTone: "pos",
  dayKnown: true,
  cash: "$50,000",
  cashKnown: true,
  positionCount: 3,
  bookedPl: "—",
  bookedTone: "flat",
  bookedKnown: false,
  windows: [],
};

describe("NetWorthCondensed", () => {
  it("shows booked P/L once the account has reported one", () => {
    render(
      <NetWorthCondensed
        stats={{ ...base, bookedPl: "+$1,500", bookedTone: "pos", bookedKnown: true }}
        caption="Sauron"
      />,
    );
    expect(screen.getByText("+$1,500")).toBeInTheDocument();
    expect(screen.getByText("booked P/L")).toBeInTheDocument();
  });

  it("omits the booked P/L line entirely — never a false $0 — when it isn't known yet", () => {
    render(<NetWorthCondensed stats={base} caption="Sauron" />);
    expect(screen.queryByText("booked P/L")).not.toBeInTheDocument();
  });
});
