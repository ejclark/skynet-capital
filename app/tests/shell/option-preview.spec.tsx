import { fireEvent, render, screen } from "@testing-library/react";
import type { OptionPreview } from "../../src/live/options";
import {
  GateAction,
  OptionPreviewBody,
  percent,
  signedMoney,
} from "../../src/shell/option-preview";

/**
 * The option review body (#3407 P2 slice 2): chance of profit renders only beside expected
 * value, the greeks as one line with "—" where the feed had none, and the sign of the expected
 * value is written, never carried by hue alone.
 */

const preview: OptionPreview = {
  code: "201",
  underlying: "NVDA",
  occSymbol: "NVDA261016P00175000",
  optionType: "put",
  side: "sell",
  positionIntent: "sell_to_open",
  contracts: 1,
  strike: 175,
  expiration: "2026-10-16",
  orderType: "limit",
  limitPrice: 1.5,
  timeInForce: "day",
  ok: true,
  estPremium: 1.5,
  estNotional: 150,
  maxProfit: 150,
  maxLoss: 17_350,
  breakeven: 173.5,
  refusals: [],
  warnings: [],
};

describe("OptionPreviewBody — odds and greeks", () => {
  it("shows chance of profit beside expected value, and the greeks line", () => {
    render(
      <OptionPreviewBody
        preview={{
          ...preview,
          greeks: { delta: -0.31, theta: -0.06 },
          impliedVol: 0.42,
          chanceOfProfit: 0.72,
          expectedValue: 18.4,
        }}
      />,
    );
    expect(screen.getByText("Chance of profit")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("Expected value")).toBeInTheDocument();
    expect(screen.getByText("+$18.40")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText(/Δ -0\.31 · Γ — · Θ -0\.06 · V —/)).toBeInTheDocument();
  });

  it("never prints chance of profit without its expected value", () => {
    render(<OptionPreviewBody preview={{ ...preview, chanceOfProfit: 0.72 }} />);
    expect(screen.queryByText("Chance of profit")).not.toBeInTheDocument();
  });

  it("formats percents and signed dollars for a reader who can't rely on colour", () => {
    expect(percent(0.72)).toBe("72%");
    expect(percent(0.004)).toBe("0.4%");
    expect(percent(0)).toBe("0%");
    expect(signedMoney(18.4)).toBe("+$18.40");
    expect(signedMoney(-5)).toBe("-$5.00");
  });
});

const noop = (): void => undefined;

describe("GateAction — the Review press keeps focus where it is (#3407 P0)", () => {
  it("prevents the mousedown default so a blur-commit can't steal the click", () => {
    let reviewed = 0;
    render(
      <GateAction
        state={{ step: "draft" }}
        drafted={true}
        onReview={() => {
          reviewed += 1;
        }}
        onSubmit={noop}
        onReset={noop}
      />,
    );
    const button = screen.getByRole("button", { name: "Review order" });
    const prevented = !fireEvent.mouseDown(button);
    expect(prevented).toBe(true);
    fireEvent.click(button);
    expect(reviewed).toBe(1);
  });
});
