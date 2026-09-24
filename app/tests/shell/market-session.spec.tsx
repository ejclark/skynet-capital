import { render, screen } from "@testing-library/react";
import { MarketSession } from "../../src/shell/market-session";

describe("MarketSession", () => {
  it("shows the time left and a now-knob while the market is open", () => {
    const { container } = render(<MarketSession now={new Date("2026-09-24T18:32:00Z")} />);
    expect(
      screen.getByRole("timer", { name: "Market open, 1h 28m left today" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1h 28m")).toBeInTheDocument();
    expect(container.querySelector(".session-knob")).not.toBeNull();
  });

  it("names the next open and drops the knob when closed", () => {
    const { container } = render(<MarketSession now={new Date("2026-09-26T15:00:00Z")} />);
    expect(screen.getByText("Market closed")).toBeInTheDocument();
    expect(screen.getByText("opens Mon 9:30")).toBeInTheDocument();
    expect(container.querySelector(".session-knob")).toBeNull();
  });

  it("counts down to the open pre-market", () => {
    const { container } = render(<MarketSession now={new Date("2026-09-24T12:48:00Z")} />);
    expect(container.querySelector(".session-eyebrow")).toHaveTextContent("Opens in 42m");
    expect(screen.getByText("42m")).toHaveClass("session-eyebrow-time");
  });
});
