import { fireEvent, render, screen, within } from "@testing-library/react";
import type { BoardCompare } from "../../src/live/board";
import { HeadToHead, headToHeadLines } from "../../src/shell/head-to-head";

/**
 * The Leaderboard's head-to-head, side by side (#5057, Eric's pick on #5037 question 8: "side by
 * side comparisons are way easier to understand and cross examine at the line item level than top
 * vs bottom"). One row per line item — the label between the two accounts' values — so cash sits
 * beside cash on a phone, not a card's height away. Every figure is the server's own string.
 */

const COMPARE: BoardCompare = {
  a: {
    key: "sauron",
    name: "Sauron",
    kind: "bot",
    equity: "$578,110",
    cash: "$120,000",
    invested: "$458,110",
    unrealized: "+$19,652",
    unrealizedTone: "pos",
    realized: "+$4,100",
    realizedTone: "pos",
    returnPct: "+34.51%",
    returnTone: "pos",
  },
  b: {
    key: "eric",
    name: "Eric",
    kind: "human",
    equity: "$102,570",
    cash: "$40,000",
    invested: "$62,570",
    unrealized: "+$1,050",
    unrealizedTone: "pos",
    realized: "+$4,100",
    realizedTone: "pos",
    returnPct: "+3.21%",
    returnTone: "pos",
  },
  deltas: [
    { label: "Equity", lead: "a", amount: "$475,540" },
    { label: "Unrealized", lead: "b", amount: "+$18,602" },
    { label: "Realized", lead: "tie", amount: "+$0" },
    { label: "Return", lead: "a", amount: "+31.30%" },
  ],
  holdings: [
    { symbol: "NVDA", aValue: "$10,000", bValue: "$2,000", shared: true, heavier: "a" },
    { symbol: "TSLA", aValue: "$5,000", shared: false, heavier: "a" },
  ],
};

/** The body row whose row header is `label`, as its three cells' text. */
function line(label: string): { a: string; mid: string; b: string } {
  const header = screen.getByRole("rowheader", { name: new RegExp(`^${label}`) });
  const row = header.closest("tr") as HTMLTableRowElement;
  const [a = "", mid = "", b = ""] = [...row.cells].map((cell) => cell.textContent ?? "");
  return { a, mid, b };
}

describe("the head-to-head lays the pair side by side (#5057)", () => {
  it("orders the line items by what a phone shows first: equity, return, P/L, then cash and invested", () => {
    expect(headToHeadLines(COMPARE).map((l) => l.label)).toEqual([
      "Equity",
      "Return",
      "Unrealized",
      "Realized",
      "Cash",
      "Invested",
    ]);
  });

  it("gives every line item one row: each account's value in its own column, the label between", () => {
    render(<HeadToHead compare={COMPARE} onClear={() => undefined} />);
    expect(line("Cash")).toEqual({ a: "$120,000", mid: "Cash", b: "$40,000" });
    expect(line("Invested")).toEqual({ a: "$458,110", mid: "Invested", b: "$62,570" });
    expect(line("Equity").a).toContain("$578,110");
    expect(line("Equity").b).toContain("$102,570");
    expect(line("Return").b).toContain("+3.21%");
  });

  it("heads each column with the account's name and its kind as a word", () => {
    render(<HeadToHead compare={COMPARE} onClear={() => undefined} />);
    const [aHead, , bHead] = screen.getAllByRole("columnheader");
    expect(aHead).toHaveTextContent("Sauron");
    expect(aHead).toHaveTextContent("BOT");
    expect(bHead).toHaveTextContent("Eric");
    expect(bHead).toHaveTextContent("HUMAN");
  });

  it("marks the leader on a line with a glyph and the word 'leads', never colour alone", () => {
    render(<HeadToHead compare={COMPARE} onClear={() => undefined} />);
    const equity = line("Equity");
    expect(equity.a).toContain("leads");
    expect(equity.b).not.toContain("leads");
    expect(equity.mid).toContain("◀");
    expect(equity.mid).toContain("$475,540");

    const unrealized = line("Unrealized");
    expect(unrealized.b).toContain("leads");
    expect(unrealized.a).not.toContain("leads");
    expect(unrealized.mid).toContain("▶");
    // The glyph is decoration to a screen reader; the row says who leads in words.
    expect(screen.getByRole("rowheader", { name: /^Unrealized/ })).toHaveAccessibleName(
      /Eric leads by \+\$18,602/,
    );
  });

  it("says 'even' on a tie and names no leader", () => {
    render(<HeadToHead compare={COMPARE} onClear={() => undefined} />);
    const realized = line("Realized");
    expect(realized.mid).toContain("even");
    expect(realized.a).not.toContain("leads");
    expect(realized.b).not.toContain("leads");
  });

  it("ranks no one on cash or invested, which the server does not rank", () => {
    const lines = headToHeadLines(COMPARE);
    expect(lines.find((l) => l.label === "Cash")?.lead).toBeUndefined();
    expect(lines.find((l) => l.label === "Invested")?.lead).toBeUndefined();
  });

  it("drops the lead, not the line, when the server could not rank it", () => {
    // Realized has no delta when either side's realized P/L is unknown — "a lead over an unknown
    // would be invented" (standingsCompareView). The figures still line up.
    const unknown = { ...COMPARE, deltas: COMPARE.deltas.filter((d) => d.label !== "Realized") };
    const realized = headToHeadLines(unknown).find((l) => l.label === "Realized");
    expect(realized?.lead).toBeUndefined();
    expect(realized?.a.text).toBe("+$4,100");
  });

  it("lines the holdings up in the same three columns, a shared symbol tagged SHARED", () => {
    render(<HeadToHead compare={COMPARE} onClear={() => undefined} />);
    expect(line("NVDA")).toEqual({ a: "$10,000", mid: "NVDASHARED", b: "$2,000" });
    expect(line("TSLA")).toEqual({ a: "$5,000", mid: "TSLA", b: "·" });
  });

  it("says so when neither holds a position", () => {
    render(<HeadToHead compare={{ ...COMPARE, holdings: [] }} onClear={() => undefined} />);
    expect(screen.getByText("Neither holds an open position yet.")).toBeInTheDocument();
  });

  it("names the pair, offers Clear, and its heading can take focus", () => {
    const onClear = rstest.fn();
    render(<HeadToHead compare={COMPARE} onClear={onClear} />);
    expect(screen.getByRole("region", { name: "Sauron versus Eric" })).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("tabindex", "-1");
    heading.focus();
    expect(heading).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /Clear/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(within(screen.getByRole("table")).getAllByRole("row").length).toBeGreaterThan(6);
  });
});
