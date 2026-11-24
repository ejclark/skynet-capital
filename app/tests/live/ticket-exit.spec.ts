import { exitWords } from "../../src/live/order-receipt";
import {
  buildDraft,
  EXIT_HOURS_NOTE,
  exitLines,
  orderTypeLabel,
  orderTypesFor,
  type TicketFields,
} from "../../src/live/ticket";

// #8249: the form's pure decisions. What goes over the wire, and the words the review and the
// receipt use for a bracket's exits; every number in them is the server's or the broker's.

const base: TicketFields = {
  symbol: " xle ",
  quantity: "3",
  action: "buy",
  orderType: "limit",
  limitPrice: "91",
  stopPrice: "",
};

describe("the ticket model — stop-limit and an exit (#8249)", () => {
  it("offers Stop-Limit only to an admitted session", () => {
    expect(orderTypesFor(false)).toEqual(["market", "limit", "stop"]);
    expect(orderTypesFor(true)).toEqual(["market", "limit", "stop", "stop_limit"]);
    expect(orderTypeLabel("stop_limit")).toBe("Stop-Limit");
  });

  it("sends a draft without an exit exactly as before", () => {
    expect(buildDraft("p", base)).toEqual({
      participantId: "p",
      symbol: "XLE",
      quantity: 3,
      action: "buy",
      orderType: "limit",
      limitPrice: 91,
    });
  });

  it("sends the exit only on a limit buy with 'Add an exit' on", () => {
    const on = { ...base, withExit: true, takeProfit: "95", exitStop: "85" };
    expect(buildDraft("p", on).exit).toEqual({ takeProfit: 95, stop: 85 });
    expect(buildDraft("p", { ...on, withExit: false }).exit).toBeUndefined();
    expect(buildDraft("p", { ...on, action: "sell" }).exit).toBeUndefined();
    expect(buildDraft("p", { ...on, orderType: "market" }).exit).toBeUndefined();
  });

  it("sends a blank exit price as absent, for the server to name", () => {
    const draft = buildDraft("p", { ...base, withExit: true, takeProfit: "95", exitStop: "" });
    expect(draft.exit).toEqual({ takeProfit: 95 });
  });

  it("sends a stop-limit's two prices", () => {
    const draft = buildDraft("p", {
      ...base,
      orderType: "stop_limit",
      stopPrice: "92",
      limitPrice: "92.50",
    });
    expect(draft).toMatchObject({ orderType: "stop_limit", stopPrice: 92, limitPrice: 92.5 });
  });

  it("names each exit in words, with the server's dollars and the stop's 'about'", () => {
    expect(
      exitLines({ takeProfit: 95, stop: 85, takeProfitDollars: 12, stopDollars: -18 }),
    ).toEqual([
      "Take-profit $95.00 · $12.00 gained against your limit",
      "Stop $85.00 · about $18.00 lost against your limit",
    ]);
    expect(EXIT_HOURS_NOTE).toBe(
      "Guards regular hours only: the take-profit and stop don't act between 4pm and 9:30am ET.",
    );
  });

  it("names the broker's echoed exits on the receipt", () => {
    expect(exitWords({ takeProfit: 95, stop: 85 })).toBe(
      "Exits held by the broker · Take-profit $95.00 · Stop $85.00",
    );
  });
});
