import { fireEvent, render, screen } from "@testing-library/react";
import type { ManageCall } from "../../../src/options/position-guidance-types";
import type { DeskSnapshot } from "../../src/live/desk";
import { openCallsOf } from "../../src/live/guidance";
import { focusFrom, manageSearch } from "../../src/live/manage-handoff";
import type { OptionPositions } from "../../src/live/options";
import { GuidanceManage } from "../../src/shell/guidance-manage";

/**
 * "Calls you've sold" (#3729): the account's open covered calls reach the engine with the right
 * units, the section offers "Use this" only where there's something to do, and the hand-off names
 * exactly the contract (and roll target) the Option positions card should open.
 */

const OCC = "CRWV261016C00095000";

describe("openCallsOf — the account's open covered calls", () => {
  const desk = {
    generatedAt: "",
    desk: {
      positions: [
        { symbol: "CRWV", isOption: false, quantity: "400", costPerShare: "$70.00" },
        { symbol: OCC, isOption: true, quantity: "-1,000", costPerShare: "$165.00" },
        { symbol: "CRWV261016P00070000", isOption: true, quantity: "-1", costPerShare: "$110.00" },
        { symbol: "CRWV261016C00100000", isOption: true, quantity: "2", costPerShare: "$90.00" },
        { symbol: "NVDA261016C00200000", isOption: true, quantity: "-1", costPerShare: "$200.00" },
      ],
    },
  } as unknown as DeskSnapshot;
  const quotes = {
    available: true,
    rows: [{ symbol: OCC, bid: 0.7, ask: 0.8 }],
  } as unknown as OptionPositions;

  it("takes short calls on this stock only, premium per share, joined to the card's quotes", () => {
    expect(openCallsOf(desk, "CRWV", quotes)).toEqual([
      {
        occ: OCC,
        strike: 95,
        expiration: "2026-10-16",
        contracts: 1000,
        premium: 1.65,
        bid: 0.7,
        ask: 0.8,
      },
    ]);
  });

  it("still lists a call with no quote yet — the engine then says it has no price", () => {
    expect(openCallsOf(desk, "CRWV")[0]).not.toHaveProperty("ask");
  });
});

const call = (over: Partial<ManageCall>): ManageCall => ({
  occ: OCC,
  strike: 95,
  expiration: "2026-10-16",
  contracts: 1,
  dte: 21,
  call: "KEEP",
  confidence: "medium",
  reasons: [{ rule: "MANAGE", text: "a reason" }],
  provesWrong: "",
  atOpen: false,
  kept: 0.3,
  ...over,
});

describe("GuidanceManage — Use this only where there's something to do", () => {
  it("offers nothing to press on Keep, Let it go or No answer", () => {
    render(
      <GuidanceManage
        manage={[
          call({ call: "KEEP" }),
          call({ occ: "B", call: "LET IT GO" }),
          call({ occ: "C", call: "NO ANSWER", confidence: "none" }),
        ]}
        onManage={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: "Use this" })).toBeNull();
  });

  it("hands the roll back, with what the member is agreeing to shown first", () => {
    const picked: ManageCall[] = [];
    const roll = call({
      call: "ROLL",
      rollTo: { strike: 100, expiration: "2026-10-30", net: 0.45 },
    });
    render(<GuidanceManage manage={[roll]} onManage={(m) => picked.push(m)} />);
    expect(screen.getByText(/sell the \$100\.00 call for Oct 30/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use this" }));
    expect(picked[0]?.rollTo?.strike).toBe(100);
  });
});

describe("the hand-off to the Option positions card", () => {
  it("names the contract and the roll target, and reads them back", () => {
    const next = manageSearch(
      { symbol: "CRWV", section: "guidance" },
      call({ call: "ROLL", rollTo: { strike: 100, expiration: "2026-10-30", net: 0.45 } }),
    );
    expect(next).toMatchObject({ section: "orders", manage: OCC, rollTo: "2026-10-30:100" });
    expect(focusFrom(next.manage, next.rollTo)).toEqual({
      occ: OCC,
      rollTo: { strike: 100, expiration: "2026-10-30" },
    });
  });

  it("drops a stale roll target when the call is a buy-back", () => {
    const next = manageSearch({ rollTo: "2026-10-30:100" }, call({ call: "BUY BACK" }));
    expect(next).not.toHaveProperty("rollTo");
    expect(focusFrom(next.manage, undefined)).toEqual({ occ: OCC });
  });
});

describe("the hand-off — stable across re-renders (#3749 UI review)", () => {
  it("returns the same focus object for the same URL, so the row doesn't re-scroll", () => {
    expect(focusFrom(OCC, "2026-10-30:100")).toBe(focusFrom(OCC, "2026-10-30:100"));
    expect(focusFrom(OCC, "2026-10-30:100")).not.toBe(focusFrom(OCC, "2026-11-06:100"));
  });
});
