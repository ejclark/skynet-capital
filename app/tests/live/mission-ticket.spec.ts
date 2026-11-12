import type { EditionDate } from "../../src/live/edition";
import {
  clampShares,
  FRESH_TICKET,
  MAX_SHARES,
  parseOrderType,
  parseShares,
  reportFor,
  reportLabel,
  reportsDue,
  symbolGroups,
  ticketLine,
  tradeSearch,
  useCampaignTicket,
} from "../../src/live/mission-ticket";

/**
 * Campaign's Trade window (#7487 slice 6): a draft paper ticket that hands to `/trade`'s gate and
 * places nothing. Pinned here: the summary line says the time in force the server will use; the
 * hand-off address is the share ticket (rung 101) with the draft in it; `/trade` keeps only a
 * well-formed draft; the names offered come from real lists, each once, in the group that says why;
 * and a Calendar pill names only a company report really dated on or after today.
 */

const ev = (date: string, what: string): EditionDate => ({ date, what, status: "confirmed" });

// The 2026-11-06 edition's calendar lines, verbatim.
const NEXT: readonly EditionDate[] = [
  ev("2026-11-09", "Cerebras (CBRS) lockup ends for all remaining IPO shares"),
  ev("2026-11-10", "October consumer prices (CPI)"),
  ev("2026-11-10", "CoreWeave (CRWV) Q3 results"),
  ev("2026-11-12", "Nebius (NBIS) Q3 results"),
  ev("2026-11-12", "Cerebras (CBRS) Q3 results"),
  ev("2026-11-17", "NVIDIA (NVDA) Q3 results"),
  ev("2026-11-20", "Monthly options expiration"),
];

describe("ticketLine", () => {
  it("reads like the handoff's line, with the time in force the server defaults to", () => {
    expect(ticketLine({ symbol: "NVDA", shares: 1, orderType: "market" })).toBe(
      "Buy 1 NVDA · market · day",
    );
    // A limit outlives the session it was placed in (`defaultTimeInForce`).
    expect(ticketLine({ symbol: "NVDA", shares: 3, orderType: "limit" })).toBe(
      "Buy 3 NVDA · limit · GTC",
    );
  });

  it("shows a dash, never a made-up name, before a company is picked", () => {
    expect(ticketLine(FRESH_TICKET)).toBe("Buy 1 — · market · day");
  });
});

describe("tradeSearch", () => {
  it("opens the share ticket (rung 101, buy) with the draft in the address", () => {
    expect(tradeSearch({ symbol: "NVDA", shares: 2, orderType: "limit" })).toEqual({
      play: "101",
      symbol: "NVDA",
      shares: 2,
      type: "limit",
    });
  });
});

describe("parseShares / parseOrderType (the /trade route's guards)", () => {
  it("keeps a whole number of shares in range, as a number or a string", () => {
    expect(parseShares(2)).toBe(2);
    expect(parseShares("12")).toBe(12);
    expect(parseShares(MAX_SHARES)).toBe(MAX_SHARES);
  });

  it("drops anything else", () => {
    for (const bad of [0, -1, 1.5, MAX_SHARES + 1, "", "abc", null, undefined, {}, [2]])
      expect(parseShares(bad)).toBeUndefined();
  });

  it("keeps only the two types Campaign drafts", () => {
    expect(parseOrderType("market")).toBe("market");
    expect(parseOrderType("limit")).toBe("limit");
    for (const bad of ["stop", "Market", "", 1, undefined])
      expect(parseOrderType(bad)).toBeUndefined();
  });

  it("clamps the stepper to 1..MAX_SHARES", () => {
    expect(clampShares(0)).toBe(1);
    expect(clampShares(MAX_SHARES + 5)).toBe(MAX_SHARES);
    expect(clampShares(Number.NaN)).toBe(1);
    expect(clampShares(4)).toBe(4);
  });
});

describe("reportsDue", () => {
  it("lists company results dated on or after today, soonest first, one per ticker", () => {
    expect(reportsDue(NEXT, "2026-11-11").map((r) => [r.symbol, r.date])).toEqual([
      ["NBIS", "2026-11-12"],
      ["CBRS", "2026-11-12"],
      ["NVDA", "2026-11-17"],
    ]);
  });

  it("leaves out a line with no ticker, and a ticker's line that is not a report", () => {
    const symbols = reportsDue(NEXT, "2026-11-01").map((r) => r.symbol);
    // CPI names no company; the CBRS lockup is not its results (its results still count).
    expect(symbols).toEqual(["CRWV", "NBIS", "CBRS", "NVDA"]);
  });

  it("is empty when nothing dated is a company report", () => {
    expect(reportsDue([ev("2026-11-20", "Monthly options expiration")], "2026-11-11")).toEqual([]);
  });
});

describe("reportFor / reportLabel", () => {
  const due = reportsDue(NEXT, "2026-11-11");

  it("prefers the ticket's own symbol, else the soonest report", () => {
    expect(reportFor(due, "NVDA")?.symbol).toBe("NVDA");
    expect(reportFor(due, "AAPL")?.symbol).toBe("NBIS");
    expect(reportFor(due, undefined)?.symbol).toBe("NBIS");
    expect(reportFor([], "NVDA")).toBeUndefined();
  });

  it("names the ticker and its day", () => {
    const nvda = due.find((r) => r.symbol === "NVDA");
    expect(nvda && reportLabel(nvda)).toBe("NVDA reports Tue, Nov 17");
  });
});

describe("symbolGroups", () => {
  it("offers each name once, in the first list that has it, under the list's own word", () => {
    expect(
      symbolGroups({
        held: ["NVDA", "msft"],
        watching: ["NVDA", "AMD"],
        reporting: ["AMD", "NBIS"],
      }),
    ).toEqual([
      { label: "Held", symbols: ["NVDA", "MSFT"] },
      { label: "Watching", symbols: ["AMD"] },
      { label: "Reports soon", symbols: ["NBIS"] },
    ]);
  });

  it("drops empty groups and caps each group", () => {
    const many = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const groups = symbolGroups({ held: [], watching: many, reporting: [] });
    expect(groups.map((g) => g.label)).toEqual(["Watching"]);
    expect(groups[0]?.symbols).toHaveLength(6);
  });

  it("always offers the ticket's own symbol, leading when no list has it", () => {
    expect(symbolGroups({ held: [], watching: [], reporting: [], current: "NVDA" })).toEqual([
      { label: "On this ticket", symbols: ["NVDA"] },
    ]);
    // Already in a list: no extra group.
    expect(
      symbolGroups({ held: [], watching: ["NVDA"], reporting: [], current: "NVDA" }).map(
        (g) => g.label,
      ),
    ).toEqual(["Watching"]);
  });

  it("offers nothing when the member has no lists and the calendar no reports", () => {
    expect(symbolGroups({ held: [], watching: [], reporting: [] })).toEqual([]);
  });
});

describe("useCampaignTicket", () => {
  beforeEach(() => useCampaignTicket.setState({ ticket: FRESH_TICKET }));

  it("starts at one share, market, no company", () => {
    expect(useCampaignTicket.getState().ticket).toEqual({ shares: 1, orderType: "market" });
  });

  it("merges a patch and keeps the share count in range", () => {
    const { patch } = useCampaignTicket.getState();
    patch({ symbol: "NVDA" });
    patch({ shares: 0 });
    patch({ orderType: "limit" });
    expect(useCampaignTicket.getState().ticket).toEqual({
      symbol: "NVDA",
      shares: 1,
      orderType: "limit",
    });
  });
});
