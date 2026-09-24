import type { BoardRow } from "../../src/live/board";
import { formatGap, readLeague } from "../../src/shell/league-data";

const row = (key: string, sortValue: number, kind: "human" | "bot" = "bot"): BoardRow => ({
  key,
  name: key[0]?.toUpperCase() + key.slice(1),
  kind,
  value: String(sortValue),
  tone: "pos",
  bar: 0,
  sortValue,
});

// A 9-entry field; Eric owns himself (#3) and two bots, Futurist (#2) and Sauron (#9).
const field = [
  row("sauron", 10),
  row("apex", 900),
  row("futurist", 800),
  row("eric", 796, "human"),
  row("atlas", 700),
  row("nova", 600),
  row("orion", 500),
  row("vega", 400),
  row("lyra", 300),
];
const owned = ["eric", "futurist", "sauron"];

describe("readLeague", () => {
  it("ranks the field, shows the top five, then only the owned rows below them", () => {
    const l = readLeague(field, owned, "return", 5, "eric");
    expect(l.top.map((x) => [x.rank, x.row.key, x.owned])).toEqual([
      [1, "apex", false],
      [2, "futurist", true],
      [3, "eric", true],
      [4, "atlas", false],
      [5, "nova", false],
    ]);
    expect(l.below.map((x) => [x.rank, x.row.key])).toEqual([[9, "sauron"]]);
  });

  it("measures the viewer's gap to the entry just above, and says when that's their own bot", () => {
    const l = readLeague(field, owned, "return", 5, "eric");
    expect(l.gap).toEqual({
      leading: false,
      amount: "4.0 pts",
      aheadName: "Futurist",
      aheadOwned: true,
    });
  });

  it("says the viewer leads when nobody is above them", () => {
    expect(readLeague(field, ["apex"], "equity", 5, "apex").gap).toEqual({ leading: true });
  });

  it("has no gap sentence when the viewer isn't on the board", () => {
    expect(readLeague(field, ["ghost"], "equity").gap).toBeUndefined();
  });
});

describe("formatGap", () => {
  it("speaks the metric's unit: whole dollars rounded up to actually pass, points for return %", () => {
    expect(formatGap(3999.2, "equity")).toBe("$4,000");
    expect(formatGap(0.42, "return")).toBe("0.4 pts");
  });
});

describe("readLeague on the 1M return", () => {
  it("names who's ahead but gives no amount when either side hasn't synced", () => {
    const rows = [row("apex", 4.2), row("eric", -1e9, "human")];
    const l = readLeague(rows, ["eric"], "month", 5, "eric");
    expect(l.gap).toEqual({ leading: false, aheadName: "Apex", aheadOwned: false });
  });

  it("measures the gap in points", () => {
    expect(formatGap(2.25, "month")).toBe("2.3 pts");
  });
});
