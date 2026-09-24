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
