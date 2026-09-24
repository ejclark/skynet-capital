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
