import { fireEvent, render, screen } from "@testing-library/react";
import type { DraftLeg } from "../../src/live/draft-order";
import { LegRow, parsePremium } from "../../src/shell/draft-leg-row";

/**
 * A leg's premium is a field (#3407 P3 slice 4): committed on blur or Enter through the parent's
 * reprice, emptied means at market, garbage reverts, and a value the draft already carries never
 * fires a reprice.
 */

const leg: DraftLeg = {
  id: "leg-1",
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 2,
  limitPrice: 4.2,
};

describe("parsePremium", () => {
  it("reads a price, an empty field as at-market, and anything else as no price at all", () => {
    expect(parsePremium(" 4.35 ")).toBe(4.35);
    expect(parsePremium("")).toBeUndefined();
    expect(parsePremium("0")).toBeNull();
    expect(parsePremium("abc")).toBeNull();
  });
});

describe("LegRow", () => {
  it("reprices on Enter with the typed premium and on blur when emptied", () => {
    const repriced: Array<number | undefined> = [];
    render(
      <LegRow
        leg={leg}
        busy={false}
        onRemove={() => undefined}
        onReprice={(p) => repriced.push(p)}
      />,
    );
    const field = screen.getByLabelText(/Premium per share for Sell 2 NVDA/);
    fireEvent.change(field, { target: { value: "4.35" } });
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.change(field, { target: { value: "" } });
    fireEvent.blur(field);
    expect(repriced).toEqual([4.35, undefined]);
  });

  it("reverts garbage and never reprices to the value the leg already carries", () => {
    const repriced: Array<number | undefined> = [];
    render(
      <LegRow
        leg={leg}
        busy={false}
        onRemove={() => undefined}
        onReprice={(p) => repriced.push(p)}
      />,
    );
    const field = screen.getByLabelText(/Premium per share/) as HTMLInputElement;
    // A number input never carries letters (jsdom blanks them), so "not a price" is a zero.
    fireEvent.change(field, { target: { value: "0" } });
    fireEvent.blur(field);
    expect(field.value).toBe("4.2");
    fireEvent.change(field, { target: { value: "4.20" } });
    fireEvent.blur(field);
    expect(repriced).toEqual([]);
  });

  it("renders the price as text when no reprice handler is wired", () => {
    render(<LegRow leg={leg} busy={false} onRemove={() => undefined} />);
    expect(screen.queryByLabelText(/Premium per share/)).not.toBeInTheDocument();
    expect(screen.getByText("$4.20/sh")).toBeInTheDocument();
  });
});
