import { render, screen } from "@testing-library/react";
import type { LongCallCall } from "../../../src/options/position-guidance-types";
import { GuidanceLongCalls, LongCallGlanceLine } from "../../src/shell/guidance-long-call";

/**
 * "Calls you hold" (#5709 slice 2): the house's exit rules offered on a call the member bought. It
 * names the contract, the verdict (a glyph and a word — never hue alone) and the day it is next
 * due, and it never carries an action: a rule is offered, nothing sells from here.
 */

const call = (over: Partial<LongCallCall> = {}): LongCallCall => ({
  strike: 190,
  expiration: "2026-11-20",
  contracts: 4,
  dte: 56,
  call: "TAKE PROFIT",
  confidence: "medium",
  reasons: [{ rule: "EXIT-PROFIT", text: "The bid is $24.00 against the $12.00 you paid." }],
  provesWrong: "If the stock keeps climbing, holding would make more.",
  until: { date: "2026-10-06", why: "the time stop falls due" },
  atOpen: false,
  multiple: 2,
  ...over,
});

describe("GuidanceLongCalls", () => {
  it("renders nothing for a member who holds no long call", () => {
    const { container } = render(<GuidanceLongCalls longCalls={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the contract, a glyph-and-word verdict, the reasons and the due day — with no button", () => {
    render(<GuidanceLongCalls longCalls={[call()]} />);
    expect(screen.getByRole("region", { name: "Calls you hold" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Your \$190\.00 call/ })).toBeTruthy();
    expect(screen.getByText(/Take profit/)).toBeTruthy();
    expect(screen.getByText(/against the \$12\.00 you paid/)).toBeTruthy();
    expect(screen.getByText(/the time stop falls due/)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("says a plan for the open when the market is closed", () => {
    render(<GuidanceLongCalls longCalls={[call({ atOpen: true })]} />);
    expect(screen.getByText(/Take profit at the open/)).toBeTruthy();
  });
});

describe("LongCallGlanceLine", () => {
  it("carries the multiple beside the verdict", () => {
    render(
      <ul>
        <LongCallGlanceLine m={call({ call: "HOLD", multiple: 0.5 })} />
      </ul>,
    );
    expect(screen.getByText(/Hold/)).toBeTruthy();
    expect(screen.getByText("0.5× what you paid")).toBeTruthy();
  });
});
