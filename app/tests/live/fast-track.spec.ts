import {
  carriedPlan,
  eventDateLine,
  PLAN_TEXT_MAX,
  planSearch,
  ticketSearch,
} from "../../src/live/fast-track";

// The fast track's hand-off to the trade form (#7034 slice 2): the stop and the exit ride in the URL
// and come back only whole, only for the name they were written for.

const ticket = {
  kind: "ticket" as const,
  eventId: "nvda",
  symbol: "NVDA",
  stop: { text: "A guide below consensus", source: "ledger" as const },
  exit: {
    text: "Close before it, by the close on Nov 18",
    source: "calendar" as const,
    by: "2026-11-18",
  },
  notes: ["I hold it into Ignite", "small size"],
  firedBy: "owner" as const,
};

describe("ticketSearch", () => {
  it("carries the symbol, the stop, the exit, its day and the notes", () => {
    expect(ticketSearch(ticket)).toEqual({
      symbol: "NVDA",
      plan: "NVDA",
      stop: "A guide below consensus",
      exit: "Close before it, by the close on Nov 18",
      by: "2026-11-18",
      note: "I hold it into Ignite · small size",
    });
  });

  it("caps a long answer so the link stays usable", () => {
    const long = { ...ticket, stop: { text: "x".repeat(900), source: "member" as const } };
    expect(ticketSearch(long).stop).toHaveLength(PLAN_TEXT_MAX);
  });
});

describe("planSearch", () => {
  it("round-trips what ticketSearch wrote", () => {
    const { symbol: _symbol, ...search } = ticketSearch(ticket);
    expect(planSearch(search)).toEqual(search);
  });

  it("keeps nothing unless the symbol, the stop and the exit all read", () => {
    expect(planSearch({ plan: "NVDA", stop: "a" })).toEqual({});
    expect(planSearch({ plan: "not a ticker!", stop: "a", exit: "b" })).toEqual({});
    expect(planSearch({ plan: "NVDA", stop: "a", exit: "x".repeat(PLAN_TEXT_MAX + 1) })).toEqual(
      {},
    );
  });

  it("drops a malformed day rather than showing it", () => {
    expect(planSearch({ plan: "nvda", stop: "a", exit: "b", by: "soon" })).toEqual({
      plan: "NVDA",
      stop: "a",
      exit: "b",
    });
  });
});

describe("carriedPlan", () => {
  const search = { plan: "NVDA", stop: "a", exit: "b" };
  it("shows the plan while the ticket is on its name", () => {
    expect(carriedPlan(search, "NVDA")).toEqual({ symbol: "NVDA", stop: "a", exit: "b" });
  });
  it("shows nothing once the member switches to another name", () => {
    expect(carriedPlan(search, "AAPL")).toBeUndefined();
    expect(carriedPlan(search, undefined)).toBeUndefined();
  });
});

it("words an event's day and whether it is known", () => {
  expect(eventDateLine("2026-11-19", "date is an estimate")).toBe("Nov 19 · date is an estimate");
});
