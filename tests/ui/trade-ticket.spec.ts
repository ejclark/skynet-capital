import {
  buildDraft,
  ORDER_TYPE_LABELS,
  orderTypeLabel,
  orderTypeNote,
  priceFieldFor,
  type TicketFields,
} from "../../app/src/live/ticket";

/** The trade ticket's order-type model (#716 slice 1) — the only part of the gate that decides
 *  anything, so the only part with a spec. The component renders the server's answer verbatim. */

const fields = (over: Partial<TicketFields> = {}): TicketFields => ({
  symbol: "aapl",
  quantity: "10",
  action: "buy",
  orderType: "market",
  limitPrice: "",
  stopPrice: "",
  ...over,
});

describe("priceFieldFor", () => {
  it("asks for no price on a market order", () => {
    expect(priceFieldFor("market")).toBeUndefined();
  });

  it("asks for the one price each priced class actually uses", () => {
    expect(priceFieldFor("limit")).toBe("limitPrice");
    expect(priceFieldFor("stop")).toBe("stopPrice");
  });
});

describe("order type labels", () => {
  it("names a stop order Stop-Market, never bare 'Stop' — the member's own ask", () => {
    expect(ORDER_TYPE_LABELS.stop).toBe("Stop-Market");
    expect(orderTypeLabel("stop")).toBe("Stop-Market");
  });

  it("renders an unrecognized server type as itself rather than guessing", () => {
    expect(orderTypeLabel("stop_limit")).toBe("stop_limit");
  });
});

describe("orderTypeNote", () => {
  it("says out loud that a triggered stop fills at the market price", () => {
    const note = orderTypeNote("stop");
    expect(note).toContain("market order");
    expect(note.toLowerCase()).toContain("past your stop");
  });

  it("says a limit order may never fill at all", () => {
    expect(orderTypeNote("limit").toLowerCase()).toContain("or not at all");
  });

  it("keeps the market-order sentence about immediacy", () => {
    expect(orderTypeNote("market").toLowerCase()).toContain("immediately");
  });
});

describe("buildDraft", () => {
  it("normalizes the symbol and omits orderType entirely for a market order", () => {
    const draft = buildDraft("tony", fields());
    expect(draft).toEqual({
      participantId: "tony",
      symbol: "AAPL",
      quantity: 10,
      action: "buy",
    });
  });

  it("carries the stop price on a stop order", () => {
    const draft = buildDraft("tony", fields({ orderType: "stop", stopPrice: "40" }));
    expect(draft.orderType).toBe("stop");
    expect(draft.stopPrice).toBe(40);
    expect(draft.limitPrice).toBeUndefined();
  });

  it("carries the limit price on a limit order", () => {
    const draft = buildDraft("tony", fields({ orderType: "limit", limitPrice: "39.5" }));
    expect(draft.orderType).toBe("limit");
    expect(draft.limitPrice).toBe(39.5);
    expect(draft.stopPrice).toBeUndefined();
  });

  it("drops a price the chosen class does not use — a leftover edit never rides along", () => {
    const stale = fields({ orderType: "market", stopPrice: "40", limitPrice: "39" });
    expect(buildDraft("tony", stale).stopPrice).toBeUndefined();
    expect(buildDraft("tony", stale).limitPrice).toBeUndefined();

    const stopWithStaleLimit = fields({ orderType: "stop", stopPrice: "40", limitPrice: "39" });
    expect(buildDraft("tony", stopWithStaleLimit).limitPrice).toBeUndefined();
  });

  it("sends a blank price as absent, so the desk refuses with its own sentence", () => {
    const draft = buildDraft("tony", fields({ orderType: "stop", stopPrice: "  " }));
    expect(draft.orderType).toBe("stop");
    expect(draft.stopPrice).toBeUndefined();
  });
});
