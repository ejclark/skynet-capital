import { openedBy } from "../../src/observatory/position-opened-by.js";
import type { OpenLot } from "../../src/trading/round-trips.js";

/** Which playbook opened a position (#5073 slice 4b): said only when it is the whole truth. */

const lot = (over: Partial<OpenLot>): OpenLot => ({
  symbol: "CRWV",
  quantity: 100,
  price: 80,
  at: "2026-10-20T15:00:00.000Z",
  ...over,
});

describe("openedBy", () => {
  it("names the playbook, and its mode, when its lots are the whole position", () => {
    const lots = [
      lot({ playbookId: "CRWV-WHEEL", playbookMode: "aggressive" }),
      lot({ playbookId: "CRWV-WHEEL", playbookMode: "aggressive", quantity: 50 }),
    ];
    expect(openedBy("CRWV", 150, lots)).toEqual({
      playbookId: "CRWV-WHEEL",
      playbookMode: "aggressive",
    });
  });

  it("counts a written lot against a short position", () => {
    const put = "CRWV261106P00080000";
    const lots = [lot({ symbol: put, quantity: 1, short: true, playbookId: "CRWV-WHEEL" })];
    expect(openedBy(put, -1, lots)).toEqual({ playbookId: "CRWV-WHEEL" });
    expect(openedBy(put, 1, lots)).toBeUndefined();
  });

  it("leaves the mode out when the lots ran in different ones", () => {
    const lots = [
      lot({ playbookId: "S1-NVDA", playbookMode: "conservative" }),
      lot({ playbookId: "S1-NVDA", playbookMode: "aggressive" }),
    ];
    expect(openedBy("CRWV", 200, lots)).toEqual({ playbookId: "S1-NVDA" });
  });

  it("names nothing when two rules, or a rule and an untagged order, opened it", () => {
    expect(
      openedBy("CRWV", 200, [lot({ playbookId: "CRWV-WHEEL" }), lot({ playbookId: "S1-NVDA" })]),
    ).toBeUndefined();
    expect(openedBy("CRWV", 200, [lot({ playbookId: "CRWV-WHEEL" }), lot({})])).toBeUndefined();
  });

  it("names nothing when the lots fall short of the position (the window starts mid-holding)", () => {
    expect(openedBy("CRWV", 155, [lot({ playbookId: "CRWV-WHEEL" })])).toBeUndefined();
  });

  it("names nothing with no ledger, or no lot of this symbol", () => {
    expect(openedBy("CRWV", 100, undefined)).toBeUndefined();
    expect(openedBy("NVDA", 100, [lot({ playbookId: "CRWV-WHEEL" })])).toBeUndefined();
  });
});
