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
  onPaper: "—",
  onPaperTone: "flat",
  onPaperKnown: false,
  windows: [],
};

describe("NetWorthCondensed", () => {
  it("shows locked-in (booked) P/L once the account has reported one", () => {
    render(
      <NetWorthCondensed
        stats={{ ...base, bookedPl: "+$1,500", bookedTone: "pos", bookedKnown: true }}
        caption="Sauron"
      />,
    );
    expect(screen.getByText("+$1,500")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "locked in" })).toBeInTheDocument();
  });

  it("omits the locked-in P/L line entirely — never a false $0 — when it isn't known yet", () => {
    render(<NetWorthCondensed stats={base} caption="Sauron" />);
    expect(screen.queryByRole("button", { name: "locked in" })).not.toBeInTheDocument();
  });
});
