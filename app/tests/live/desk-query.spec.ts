import {
  type DeskPosition,
  matchesFilter,
  parseDeskQuery,
  toggleQualifier,
} from "../../src/live/desk";
import { clearChips } from "../../src/shell/positions-blotter";

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "SPY",
  display: "SPY",
  detail: "",
  isOption: false,
  quantity: "1",
  costPerShare: "$1.00",
  price: "$1.00",
  costBasis: "$1",
  value: "$1",
  dayPl: "+$0",
  dayPct: "+0.0%",
  dayTone: "flat",
  totalPl: "+$0",
  totalPlRaw: 10,
  returnPct: "+0.0%",
  totalTone: "pos",
  weightPct: 1,
  ...over,
});

const soon = pos({
  symbol: "TSLA261017P00400000",
  display: "TSLA put",
  isOption: true,
  expiresInDays: 20,
});
const later = pos({
  symbol: "NVDA261218C00130000",
  display: "NVDA call",
  isOption: true,
  expiresInDays: 85,
});
const shares = pos({ symbol: "AAPL", display: "AAPL", expiresIn: "no expiry" });

// The positions filter grammar (#3689 slice 6b adds `dte:`).
describe("parseDeskQuery / matchesFilter", () => {
  it("keeps only what expires within the window, and never shares", () => {
    const f = parseDeskQuery("dte:<21");
    expect(f.maxDays).toBe(20);
    expect([soon, later, shares].filter((p) => matchesFilter(p, f))).toEqual([soon]);
  });

  it("reads dte:<=N as inclusive", () => {
    expect(parseDeskQuery("dte:<=21").maxDays).toBe(21);
  });

  it("combines with search words", () => {
    const f = parseDeskQuery("nvda dte:<90");
    expect([soon, later, shares].filter((p) => matchesFilter(p, f))).toEqual([later]);
  });
});

describe("toggleQualifier", () => {
  it("makes Options, Shares and Expiring replace one another", () => {
    expect(toggleQualifier("is:option", "dte:<21")).toBe("dte:<21");
    expect(toggleQualifier("dte:<21", "is:share")).toBe("is:share");
  });
});

describe("clearChips", () => {
  it("is the All chip: drops every chip qualifier and keeps the search words", () => {
    expect(clearChips("nvda is:option pl:>0 dte:<21")).toBe("nvda");
    expect(clearChips("")).toBe("");
  });
});

// `event:before-expiry` — the "Earnings before expiry" chip (#3689 follow-up).
describe("event:before-expiry", () => {
  const printing = pos({
    symbol: "MSFT261120C00500000",
    display: "MSFT call",
    isOption: true,
    nextEvent: { label: "Earnings Oct 27", at: "2026-10-27", beforeExpiry: true, scope: "stock" },
  });
  const fedOnly = pos({
    symbol: "SPY261120C00600000",
    display: "SPY call",
    isOption: true,
    nextEvent: {
      label: "Fed meeting Oct 28",
      at: "2026-10-28",
      beforeExpiry: true,
      scope: "market",
    },
  });

  it("keeps options whose own stock prints before they expire, not a Fed date", () => {
    const f = parseDeskQuery("event:before-expiry");
    expect([printing, fedOnly, soon, shares].filter((p) => matchesFilter(p, f))).toEqual([
      printing,
    ]);
  });

  it("replaces the other instrument chips and clears with All", () => {
    expect(toggleQualifier("is:share", "event:before-expiry")).toBe("event:before-expiry");
    expect(clearChips("msft event:before-expiry")).toBe("msft");
  });
});

// Today's change versus lifetime (#5042). Members tapped "Losing" for what is down TODAY; the chip
// filtered on lifetime P/L and came back empty while MSFT was −$76 on the day (+$414 overall).
describe("day:<0 / day:>0 — today's change, apart from pl: (lifetime against cost)", () => {
  const msft = pos({
    symbol: "MSFT",
    display: "MSFT",
    dayPl: "−$76",
    dayTone: "neg",
    totalPl: "+$414",
    totalPlRaw: 414,
    totalTone: "pos",
  });
  const crwv = pos({
    symbol: "CRWV",
    display: "CRWV",
    dayPl: "+$31",
    dayTone: "pos",
    totalPl: "−$412",
    totalPlRaw: -412,
    totalTone: "neg",
  });
  const unpriced = pos({ symbol: "AAPL", display: "AAPL", dayTone: "flat", totalPlRaw: 0 });
  const book = [msft, crwv, unpriced];
  const keep = (q: string) => book.filter((p) => matchesFilter(p, parseDeskQuery(q)));

  it("keeps what is down today even when it is above cost", () => {
    expect(keep("day:<0")).toEqual([msft]);
    expect(keep("pl:<0"), "the lifetime filter is a different question").toEqual([crwv]);
  });

  it("keeps what is up today, and a flat or unpriced day matches neither", () => {
    expect(keep("day:>0")).toEqual([crwv]);
    expect(keep("day:<0")).not.toContain(unpriced);
    expect(keep("day:>0")).not.toContain(unpriced);
  });

  it("stacks with the lifetime pair: down today but above cost", () => {
    expect(keep("day:<0 pl:>0")).toEqual([msft]);
    expect(keep("day:<0 pl:<0")).toEqual([]);
  });

  it("makes day:>0 and day:<0 replace each other, and leaves pl: alone", () => {
    expect(toggleQualifier("day:>0", "day:<0")).toBe("day:<0");
    expect(toggleQualifier("pl:>0", "day:<0")).toBe("pl:>0 day:<0");
    expect(toggleQualifier("day:<0 pl:>0", "pl:<0")).toBe("day:<0 pl:<0");
  });

  it("clears with All, keeping the search words", () => {
    expect(clearChips("msft day:<0 pl:<0")).toBe("msft");
  });
});
