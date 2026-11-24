import { marketSession } from "../../app/src/live/market-session";
import {
  buildDraft,
  carriesExit,
  exitFits,
  orderTypeLabel,
  orderTypeNote,
  orderTypesFor,
  priceFieldsFor,
  type TicketFields,
} from "../../app/src/live/ticket";
import {
  EXIT_HOURS_NOTE,
  exitPreviewLines,
  exitReceiptLine,
  signedMoney,
} from "../../app/src/live/ticket-exit";

/** The stock form's model for stop-limit and an exit at entry (#8249 PR 2). With the setting off
 *  every draft is what it was before; admitted, a limit buy can carry its take-profit and stop. */

const fields = (over: Partial<TicketFields> = {}): TicketFields => ({
  symbol: "xle",
  quantity: "3",
  action: "buy",
  orderType: "limit",
  limitPrice: "91",
  stopPrice: "",
  ...over,
});

const OPEN = marketSession(new Date("2026-10-27T15:00:00Z"));
const CLOSED = marketSession(new Date("2026-10-27T00:00:00Z"));

describe("order types the form offers", () => {
  it("offers exactly three with the setting off, and Stop-Limit beside them when admitted", () => {
    expect(orderTypesFor(false)).toEqual(["market", "limit", "stop"]);
    expect(orderTypesFor(true)).toEqual(["market", "limit", "stop", "stop_limit"]);
    expect(orderTypeLabel("stop_limit")).toBe("Stop-Limit");
  });

  it("asks a stop-limit for its stop first, then its limit", () => {
    expect(priceFieldsFor("stop_limit")).toEqual(["stopPrice", "limitPrice"]);
    expect(priceFieldsFor("limit")).toEqual(["limitPrice"]);
    expect(priceFieldsFor("market")).toEqual([]);
  });

  it("says a triggered stop-limit may be left unfilled, and names the open while closed", () => {
    expect(orderTypeNote("stop_limit", OPEN)).toMatch(/or not at all/);
    expect(orderTypeNote("stop_limit", CLOSED)).toMatch(
      /^Market closed — nothing fills before the Tue 9:30 ET open/,
    );
  });
});

describe("buildDraft with an exit (#8249)", () => {
  const exit = { takeProfit: "95", stop: "85" };

  it("sends a draft exactly as before when the setting is off, even with an exit typed", () => {
    expect(buildDraft("d", fields({ exit, timeInForce: "day" }))).toEqual({
      participantId: "d",
      symbol: "XLE",
      quantity: 3,
      action: "buy",
      orderType: "limit",
      limitPrice: 91,
      timeInForce: "day",
    });
  });

  it("carries the exit on an admitted limit buy, and leaves the time in force to the server", () => {
    expect(buildDraft("d", fields({ exit, timeInForce: "day" }), true)).toEqual({
      participantId: "d",
      symbol: "XLE",
      quantity: 3,
      action: "buy",
      orderType: "limit",
      limitPrice: 91,
      exit: { takeProfit: 95, stop: 85 },
    });
  });

  it("leaves a blank exit price out, for the server to name", () => {
    expect(buildDraft("d", fields({ exit: { takeProfit: "95", stop: "" } }), true).exit).toEqual({
      takeProfit: 95,
    });
  });

  it("never sends an exit a sell, a market or a stop-limit entry can't carry", () => {
    for (const over of [
      { action: "sell" as const },
      { orderType: "market" as const },
      { orderType: "stop_limit" as const, stopPrice: "90" },
    ]) {
      const f = fields({ exit, ...over });
      expect(exitFits(f)).toBe(false);
      expect(carriesExit(f, true)).toBe(false);
      expect(buildDraft("d", f, true).exit).toBeUndefined();
    }
  });

  it("sends both prices on a stop-limit", () => {
    const draft = buildDraft(
      "d",
      fields({ orderType: "stop_limit", stopPrice: "92", limitPrice: "92.5" }),
      true,
    );
    expect(draft).toEqual(
      expect.objectContaining({ orderType: "stop_limit", stopPrice: 92, limitPrice: 92.5 }),
    );
  });
});

describe("the exit in words (#8249)", () => {
  it("signs each leg's dollars, so the direction never rides on a colour", () => {
    expect(signedMoney(12)).toBe("+$12.00");
    expect(signedMoney(-18)).toBe("-$18.00");
    expect(
      exitPreviewLines({ takeProfit: 95, stop: 85, takeProfitDollars: 12, stopDollars: -18 }),
    ).toEqual([
      "Take-profit $95.00 · +$12.00 against your limit if it fills",
      "Stop $85.00 · about -$18.00 against your limit (a triggered stop sells at the market)",
    ]);
  });

  it("states a leg's price alone when the server measured no dollars", () => {
    expect(exitPreviewLines({ takeProfit: 95, stop: 85 })).toEqual([
      "Take-profit $95.00",
      "Stop $85.00",
    ]);
  });

  it("names the broker's exits on the receipt and the hours they guard", () => {
    expect(exitReceiptLine({ takeProfit: 95.01, stop: 84.99 })).toMatch(
      /^Exits held by the broker: Take-profit \$95\.01 · Stop \$84\.99\./,
    );
    expect(EXIT_HOURS_NOTE).toBe(
      "Guards regular hours only: the take-profit and stop don't act between 4pm and 9:30am ET.",
    );
  });
});
