import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { OptionPositions } from "../../src/live/options";
import { decayBySymbol, deltaBySymbol } from "../../src/shell/holding-decay";
import { PositionsTable } from "../../src/shell/positions-table";

/**
 * The desk table's ranked columns (#5071; round 2 of #5037, Q2 R2, Eric's pick). Beside the tower
 * the table gets ~806px, and six columns fit it: Position · θ · Δ · Value / Today · P/L / Return ·
 * Model projects · open. WHEN a position is drawn on the desk, THE row SHALL carry the phone card's
 * row spec as two-line cells; the rest of the columns SHALL open in the row. Which columns show at a
 * given width is CSS (a container query) and is measured by `e2e/positions-columns.spec.ts`.
 *
 * The headers mirror each cell's two lines in one word each — the same key the phone card carries
 * (#5076, Eric on #5061: "the title headings mirrored the 2 column two row in the line item in a
 * single word … gains in green, losses in red").
 */

// The row's Guidance link (#3729 step 4) is a router Link; no router here, so render its href.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    search,
  }: {
    children: ReactNode;
    className?: string;
    search: Record<string, string>;
  }) => (
    <a href={`/trade?${new URLSearchParams(search).toString()}`} className={className}>
      {children}
    </a>
  ),
}));

const position = (overrides: Partial<DeskPosition> = {}): DeskPosition =>
  ({
    symbol: "SPY",
    display: "SPY",
    detail: "",
    isOption: false,
    quantity: "199",
    costPerShare: "$500.05",
    price: "$505.00",
    costBasis: "$99,510",
    value: "$100,495",
    dayPl: "+$120",
    dayPct: "+0.1%",
    dayTone: "pos",
    totalPl: "+$985",
    totalPlRaw: 985,
    returnPct: "+1.0%",
    totalTone: "pos",
    weightPct: 20,
    ...overrides,
  }) as DeskPosition;

/** Sauron's book in the profile world, as `/api/desk/sauron` formats it on the pinned Thursday. */
const SOLD_PUT = "CRWV261106P00080000";
const PUT = position({
  symbol: SOLD_PUT,
  display: "CRWV $80 PUT · 6 NOV 26",
  isOption: true,
  quantity: "-1",
  costBasis: "-$255",
  price: "$550.00",
  expiresIn: "29 days",
  expiresInDays: 29,
  breakeven: "$77.45",
  value: "-$550",
  dayPl: "-$60",
  dayTone: "neg",
  totalPl: "-$295",
  totalPlRaw: -295,
  returnPct: "-116%",
  totalTone: "neg",
  plainName: "Sold put · profits if CRWV stays above $80.00",
});
const NVDA = position({
  symbol: "NVDA",
  display: "NVDA",
  quantity: "130",
  price: "$232.10",
  breakeven: "$223.98",
  value: "$30,173",
  dayPl: "+$195",
  dayTone: "pos",
  totalPl: "+$1,056",
  returnPct: "+3.63%",
  totalTone: "pos",
});
const CRWV = position({
  symbol: "CRWV",
  display: "CRWV",
  quantity: "55",
  price: "$82.60",
  breakeven: "$90.10",
  value: "$4,543",
  dayPl: "-$82",
  dayTone: "neg",
  totalPl: "-$412",
  returnPct: "-8.32%",
  totalTone: "neg",
});

/** The option book: the profile world's put, −0.398 delta and −$0.115 theta a share, written once. */
const BOOK = {
  available: true,
  rows: [{ symbol: SOLD_PUT, positionGreeks: { theta: 11.456, delta: 39.836 } }],
} as unknown as OptionPositions;

function renderTable(positions: readonly DeskPosition[] = [PUT, CRWV, NVDA], canTrade = true) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <PositionsTable
        positions={positions}
        deskId="sauron"
        totalCount={positions.length}
        decayBySymbol={decayBySymbol(BOOK)}
        deltaBySymbol={deltaBySymbol(BOOK)}
        canTrade={canTrade}
      />
    </QueryClientProvider>,
  );
}

/** What a sighted reader sees: text without the words only a screen reader hears. */
function seen(el: Element): string {
  const copy = el.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll(".visually-hidden")) hidden.remove();
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

const row = (symbol: string) => document.getElementById(`pos-${symbol}`) as HTMLElement;
const cell = (symbol: string, column: string) =>
  row(symbol).querySelector(`td.pos-col-${column}`) as HTMLElement;

describe("PositionsTable — the ranked columns (#5071)", () => {
  it("heads six columns in rank order, then the two a wide table adds before the opener", () => {
    renderTable();
    const heads = [...document.querySelectorAll("thead th")].map((th) => th.className);
    expect(heads.map((c) => c.replace(/^num /, ""))).toEqual([
      "pos-col-pos",
      "pos-col-greeks",
      "pos-col-value",
      "pos-col-pl",
      "pos-col-model",
      "pos-col-event",
      "pos-col-best",
      "pos-col-open",
    ]);
    // One <col> per column, each carrying its column's class, so a hidden one's width drops out.
    expect([...document.querySelectorAll("colgroup col")].map((c) => c.className)).toEqual(
      heads.map((c) => c.replace(/^num /, "")),
    );
  });

  it("says each two-line header in one word a line, mirroring the cells under it (#5076)", () => {
    renderTable();
    const head = (key: string) =>
      seen(document.querySelector(`thead th.pos-col-${key}`) as Element);
    expect(head("pos")).toBe("Position");
    expect(head("greeks")).toBe("θ · Δ");
    expect(head("value")).toBe("Value Today");
    expect(head("pl")).toBe("P/L Return");
    expect(head("model")).toBe("Model projects");
  });

  it("names the row's opener, so the empty header still says what the column is", () => {
    renderTable();
    expect(document.querySelector("thead th.pos-col-open")).toHaveAttribute(
      "aria-label",
      "Row detail",
    );
  });

  it("draws Position as the phone card's row spec: the position now, then since it was opened", () => {
    renderTable();
    expect(seen(cell(SOLD_PUT, "pos"))).toBe(
      "CRWV $80 SHORT PUT · 29d 1 contract (breakeven $77.45)",
    );
    expect(seen(cell("NVDA", "pos"))).toBe("NVDA · $232.10 130 shares (breakeven $223.98)");
  });

  it("says what time and a $1 move do to an option, one per line", () => {
    renderTable();
    expect(seen(cell(SOLD_PUT, "greeks"))).toBe("θ earns $11/day · Δ +$40 per $1");
    expect(cell(SOLD_PUT, "greeks").querySelectorAll(".pos-greek")).toHaveLength(2);
  });

  it("says a share has no time decay and moves a dollar a share", () => {
    renderTable();
    expect(seen(cell("NVDA", "greeks"))).toBe("no time decay Δ +$130 per $1");
    expect(seen(cell("CRWV", "greeks"))).toBe("no time decay Δ +$55 per $1");
  });

  it("reads a dash for an option the feed did not quote, never a made-up zero", () => {
    renderTable([position({ ...PUT, symbol: "META261120C00700000", display: "META call" })]);
    expect(seen(cell("META261120C00700000", "greeks"))).toBe("—");
  });

  it("puts the value over today's change, the change signed and toned", () => {
    renderTable();
    expect(seen(cell(SOLD_PUT, "value"))).toBe("−$550 −$60 today");
    expect(seen(cell("NVDA", "value"))).toBe("$30,173 +$195 today");
    expect(cell("NVDA", "value").querySelector(".pos-fig-under")).toHaveClass("tone-pos");
    expect(cell(SOLD_PUT, "value").querySelector(".pos-fig-under")).toHaveClass("tone-neg");
  });

  it("says a flat day in words, never +$0", () => {
    renderTable([position({ dayPl: "+$0", dayTone: "pos" })]);
    expect(seen(cell("SPY", "value"))).toBe("$100,495 no change today");
  });

  it("puts the P/L over its return, gains and losses toned and signed alike", () => {
    renderTable();
    expect(seen(cell("NVDA", "pl"))).toBe("+$1,056 +3.63%");
    expect(cell("NVDA", "pl")).toHaveClass("tone-pos");
    expect(seen(cell("CRWV", "pl"))).toBe("−$412 −8.32%");
    expect(cell("CRWV", "pl")).toHaveClass("tone-neg");
  });

  it("measures a sold option's return on the premium it collected, and says the premium", () => {
    renderTable();
    expect(seen(cell(SOLD_PUT, "pl"))).toBe("−$295 −116% of $255");
  });

  it("writes every loss with a real minus sign, not a hyphen", () => {
    renderTable();
    for (const r of [SOLD_PUT, "CRWV", "NVDA"]) expect(seen(row(r))).not.toMatch(/-\$|-\d/);
  });

  it("holds Model projects at a dash until the guidance model supplies one (#4952)", () => {
    renderTable();
    for (const r of [SOLD_PUT, "CRWV", "NVDA"]) {
      expect(seen(cell(r, "model"))).toBe("—");
      expect(cell(r, "model")).toHaveTextContent("no projection yet");
    }
  });

  it("keeps the closed row to its columns: no Close, no buys, no Guidance until it opens", () => {
    renderTable();
    const closed = row("NVDA");
    expect(within(closed).queryByRole("button", { name: /Close/ })).not.toBeInTheDocument();
    expect(within(closed).queryByRole("link", { name: "Guidance" })).not.toBeInTheDocument();
    expect(within(closed).getAllByRole("button")).toHaveLength(1);
  });
});

describe("PositionsTable — the rest opens in the row (#5071)", () => {
  const open = (display: string) =>
    fireEvent.click(screen.getByRole("button", { name: `Detail for ${display}` }));
  const opened = () => document.querySelector(".row-open") as HTMLElement;
  /** The opened row's figure under a label, as a sighted reader sees it. */
  const fact = (label: string) => {
    const dt = [...opened().querySelectorAll("dt")].find((d) => seen(d) === label);
    return dt?.nextElementSibling ? seen(dt.nextElementSibling) : undefined;
  };

  it("opens one row in place, under the row, with what the columns leave out", () => {
    renderTable();
    const opener = screen.getByRole("button", { name: `Detail for ${PUT.display}` });
    expect(opener).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(opener);
    expect(opener).toHaveAttribute("aria-expanded", "true");
    expect(row(SOLD_PUT).nextElementSibling).toBe(opened());
    expect(seen(opened())).toContain("Sold put · profits if CRWV stays above $80.00");
    expect(fact("Cost basis")).toBe("−$255");
    expect(fact("Expires in")).toBe("29 days");
    expect(fact("Best / worst case")).toBe("—");
    expect(fact("Next event")).toBe("—");
  });

  it("carries the figures a narrow table hides, so a stepped-aside column is one tap away", () => {
    renderTable();
    open(PUT.display);
    expect(fact("θ · Δ")).toBe("θ earns $11/day · Δ +$40 per $1");
    expect(fact("Model projects")).toBe("—");
    // Each sits in a block the container query hides while its own column is showing.
    expect(opened().querySelector(".pos-more-greeks dt")).toHaveTextContent("θ · Δ");
    expect(opened().querySelector(".pos-more-model dt")).toHaveTextContent("Model projects");
  });

  it("closes again from the same chevron", () => {
    renderTable();
    open(PUT.display);
    open(PUT.display);
    expect(opened()).toBeNull();
  });

  it("offers the position's Close and a share's Guidance inside the opened row", () => {
    renderTable();
    open("NVDA");
    expect(within(opened()).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(within(opened()).getByRole("link", { name: "Guidance" })).toHaveAttribute(
      "href",
      "/trade?desk=sauron&symbol=NVDA&section=guidance",
    );
  });
});

describe("PositionsTable — empty states", () => {
  it("shows the zero-positions note when there are none open at all", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PositionsTable positions={[]} deskId="sauron" totalCount={0} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("No open positions — waiting is a position.")).toBeInTheDocument();
  });

  it("shows the filtered-to-zero note when positions exist but none match", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PositionsTable positions={[]} deskId="sauron" totalCount={3} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("No positions match this filter.")).toBeInTheDocument();
  });
});
