import { marketSession } from "../../app/src/live/market-session";
import {
  buildDraft,
  ORDER_TYPE_LABELS,
  orderTypeLabel,
  orderTypeNote,
  priceFieldFor,
  type TicketFields,
  tifNote,
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

// The clock pinned (#6257): Tue 2026-10-27 11:00 ET mid-session; Mon 2026-10-26 8:00 p.m. ET after
// the close; Tue 8:00 a.m. ET before the bell; Sat 2026-10-31 noon ET on a weekend.
const OPEN = marketSession(new Date("2026-10-27T15:00:00Z"));
const CLOSED = marketSession(new Date("2026-10-27T00:00:00Z"));
const PRE = marketSession(new Date("2026-10-27T12:00:00Z"));
const WEEKEND = marketSession(new Date("2026-10-31T16:00:00Z"));

describe("orderTypeNote", () => {
  it("says out loud that a triggered stop fills at the market price", () => {
    const note = orderTypeNote("stop", OPEN);
    expect(note).toContain("market order");
    expect(note.toLowerCase()).toContain("past your stop");
  });

  it("says a limit order may never fill at all", () => {
    expect(orderTypeNote("limit", OPEN).toLowerCase()).toContain("or not at all");
  });

  it("keeps the market-order sentence about immediacy while the session runs", () => {
    expect(orderTypeNote("market", OPEN).toLowerCase()).toContain("immediately");
  });

  // #6257: the form said "fills immediately" for the ~81% of the week the market is shut.
  it("never says immediately while the market is closed, and names the open it waits for", () => {
    for (const market of [CLOSED, PRE, WEEKEND]) {
      for (const type of ["market", "limit", "stop"] as const) {
        expect(orderTypeNote(type, market).toLowerCase()).not.toContain("immediately");
      }
    }
    expect(orderTypeNote("market", CLOSED)).toBe(
      "Market closed — this order waits for the Tue 9:30 ET open, then fills at the best price on offer.",
    );
    expect(orderTypeNote("market", WEEKEND)).toContain("the Mon 9:30 ET open");
    expect(orderTypeNote("market", PRE)).toContain(
      "Pre-market — this order waits for today's 9:30 ET open",
    );
  });

  it("leads a priced order with the same wait, then keeps its own rule", () => {
    const limit = orderTypeNote("limit", CLOSED);
    expect(limit.startsWith("Market closed — nothing fills before the Tue 9:30 ET open.")).toBe(
      true,
    );
    expect(limit).toContain("or not at all");
    expect(orderTypeNote("stop", OPEN).startsWith("Stays dormant")).toBe(true);
  });
});

describe("tifNote", () => {
  it("ties a Day order to today's session while the market trades or before the bell", () => {
    expect(tifNote("day", OPEN)).toContain("cancelled when today's session closes");
    expect(tifNote("day", PRE)).toContain("cancelled when today's session closes");
  });

  it("ties a Day order placed after the close to the next session, never 'today's'", () => {
    expect(tifNote("day", CLOSED)).toBe(
      "Day: waits for the Tue 9:30 ET open; anything unfilled is cancelled when that session closes.",
    );
  });

  it("says GTC the same whatever the clock", () => {
    expect(tifNote("gtc", CLOSED)).toBe(tifNote("gtc", OPEN));
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

  it("carries the member's own time in force, and nothing when they left the default (#3407)", () => {
    expect(buildDraft("tony", fields()).timeInForce).toBeUndefined();
    expect(buildDraft("tony", fields({ timeInForce: "gtc" })).timeInForce).toBe("gtc");
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
