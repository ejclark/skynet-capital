import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { OptionPositions } from "../../src/live/options";
import { decayBySymbol, deltaBySymbol } from "../../src/shell/holding-decay";
import { PositionCards } from "../../src/shell/position-cards";

/**
 * A phone position card opens that position on Trade (#4947): an option lands on the HELD contract
 * — the Orders pane with its Close / Roll row marked — never a new-order preset for the same strike.
 *
 * Its layout is Eric's row spec (#5059, round 2 of #5037). Line 1 is the position now: what it is
 * on the left, its value with today's change in brackets on the right. Line 2 is since it was
 * opened: the size and its breakeven on the left, the total with its return in brackets on the
 * right. An option adds a third line with what time and a $1 move in the stock do to it.
 * Every figure keeps its sign and a real minus (#5049), and the link names each one in words.
 */

// No router here; surface the search each card hands Trade so it's observable.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, search }: { children: ReactNode; search: unknown }) => (
    <a href="/app/trade" data-search={JSON.stringify(search)}>
      {children}
    </a>
  ),
}));

const position = (symbol: string, display: string, extra: Partial<DeskPosition> = {}) =>
  ({
    symbol,
    display,
    isOption: symbol.length > 6,
    quantity: "-1",
    value: "-$550",
    price: "$550.00",
    totalPl: "-$292",
    returnPct: "−111.0%",
    totalTone: "neg",
    dayPl: "+$0",
    dayPct: "+0.00%",
    dayTone: "flat",
    plainName: "",
    ...extra,
  }) as DeskPosition;

const searchOf = (name: string) =>
  JSON.parse(screen.getByRole("link", { name: new RegExp(name) }).dataset.search ?? "{}");

describe("PositionCards — the hand-off to Trade", () => {
  it("opens an option on the held contract, not a new-order preset", () => {
    render(<PositionCards positions={[position("AMD261120P00150000", "AMD put")]} deskId="eric" />);
    expect(searchOf("AMD")).toEqual({
      desk: "eric",
      symbol: "AMD",
      section: "orders",
      manage: "AMD261120P00150000",
    });
  });

  it("opens shares on their ticker", () => {
    render(<PositionCards positions={[position("SPY", "SPY")]} deskId="eric" />);
    expect(searchOf("SPY")).toEqual({ desk: "eric", symbol: "SPY" });
  });
});

/** What a sighted reader sees: the card's text without the words only a screen reader hears. */
function seen(el: HTMLElement): string {
  const copy = el.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll(".visually-hidden")) hidden.remove();
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

const card = (name: string) => screen.getByRole("link", { name: new RegExp(name) });

/** The bot's book in the profile world (scripts/study/worlds/inputs/profile-today.json), as
 *  `/api/desk/sauron` formats it on the pinned Thursday. */
const NVDA = position("NVDA", "NVDA", {
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
const CRWV = position("CRWV", "CRWV", {
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
const SOLD_PUT = "CRWV261106P00080000";
const CRWV_PUT = position(SOLD_PUT, "CRWV $80 PUT · 6 NOV 26", {
  quantity: "-1",
  expiresInDays: 29,
  breakeven: "$77.45",
  value: "-$550",
  dayPl: "-$60",
  dayTone: "neg",
  totalPl: "-$295",
  returnPct: "-116%",
  totalTone: "neg",
});

const BOUGHT_CALL = "AMD261120C00180000";
const BOUGHT_PUT = "TSLA261120P00132500";
const UNQUOTED = "META261120C00700000";
const AMD_CALL = position(BOUGHT_CALL, "AMD $180 CALL · 20 NOV 26", {
  quantity: "3",
  expiresInDays: 43,
  breakeven: "$186.40",
  value: "$2,310",
  totalPl: "+$390",
  returnPct: "+20.31%",
  totalTone: "pos",
});
const TSLA_PUT = position(BOUGHT_PUT, "TSLA $132.50 PUT · 20 NOV 26", {
  quantity: "1",
  expiresInDays: 0,
  breakeven: "$128.10",
});
const META_CALL = position(UNQUOTED, "META $700 CALL · 20 NOV 26", {
  quantity: "1",
  expiresInDays: 43,
});

/** The option book as `/api/trade/option-positions` answers it: each holding's greeks are the
 *  contract's × signed contracts × 100, so a sold put's theta and delta are both positive. */
const book = (greeksBySymbol: Record<string, { theta?: number; delta?: number } | undefined>) =>
  ({
    available: true,
    rows: Object.entries(greeksBySymbol).map(([symbol, positionGreeks]) => ({
      symbol,
      ...(positionGreeks === undefined ? {} : { positionGreeks }),
    })),
  }) as unknown as OptionPositions;

function renderBook(held: readonly DeskPosition[] = [CRWV_PUT, NVDA, CRWV]) {
  const statement = book({
    // The profile world's put: −0.398 delta and −$0.115 theta a share, written once.
    [SOLD_PUT]: { theta: 11.456, delta: 39.836 },
    [BOUGHT_CALL]: { theta: -12.4, delta: 154.8 },
    [BOUGHT_PUT]: { theta: -0.3, delta: -38.2 },
    [UNQUOTED]: undefined,
  });
  render(
    <PositionCards
      positions={held}
      deskId="sauron"
      decayBySymbol={decayBySymbol(statement)}
      deltaBySymbol={deltaBySymbol(statement)}
    />,
  );
}

describe("PositionCards — shares, in Eric's row spec (#5059)", () => {
  it("puts the symbol and the share price on line 1", () => {
    renderBook();
    expect(seen(card("NVDA"))).toMatch(/^NVDA · \$232\.10 /);
  });

  it("puts the share count and its breakeven on line 2", () => {
    renderBook();
    expect(seen(card("NVDA"))).toContain("130 shares (breakeven $223.98)");
  });

  it("says one share, not one shares", () => {
    renderBook([position("SPY", "SPY", { quantity: "1", breakeven: "$560.00" })]);
    expect(seen(card("SPY"))).toContain("1 share (breakeven $560.00)");
  });

  it("says a short stock position is short", () => {
    renderBook([position("TSLA", "TSLA", { quantity: "-20", breakeven: "$410.00" })]);
    expect(seen(card("TSLA"))).toContain("20 shares short (breakeven $410.00)");
  });

  it("carries no greeks line", () => {
    renderBook();
    expect(seen(card("NVDA"))).not.toMatch(/θ|Δ/);
  });
});

describe("PositionCards — options, in Eric's row spec (#5059)", () => {
  it("names the strike, SHORT or LONG, PUT or CALL, and the days left on line 1", () => {
    renderBook([CRWV_PUT, AMD_CALL]);
    expect(seen(card("CRWV \\$80"))).toMatch(/^CRWV \$80 SHORT PUT · 29d /);
    expect(seen(card("AMD"))).toMatch(/^AMD \$180 LONG CALL · 43d /);
  });

  it("prints a strike with cents when it has them", () => {
    renderBook([TSLA_PUT]);
    expect(seen(card("TSLA"))).toMatch(/^TSLA \$132\.50 LONG PUT /);
  });

  it("says an option expiring today expires today, not 0d", () => {
    renderBook([TSLA_PUT]);
    const tsla = seen(card("TSLA"));
    expect(tsla).toContain("LONG PUT · expires today");
    expect(tsla).not.toContain("0d");
  });

  it("puts the contract count and its breakeven on line 2", () => {
    renderBook([CRWV_PUT, AMD_CALL]);
    expect(seen(card("CRWV \\$80"))).toContain("1 contract (breakeven $77.45)");
    expect(seen(card("AMD"))).toContain("3 contracts (breakeven $186.40)");
  });

  it("says a sold option earns from time and moves with the stock, per $1", () => {
    renderBook();
    expect(seen(card("CRWV \\$80"))).toMatch(/θ earns \$11\/day · Δ \+\$40 per \$1$/);
  });

  it("says a bought option costs to hold", () => {
    renderBook([AMD_CALL]);
    expect(seen(card("AMD"))).toMatch(/θ costs \$12\/day · Δ \+\$155 per \$1$/);
  });

  it("signs a delta that loses as the stock rises with a real minus", () => {
    renderBook([TSLA_PUT]);
    expect(seen(card("TSLA"))).toMatch(/Δ −\$38 per \$1$/);
  });

  it("leaves out a time decay that rounds to $0 rather than printing $0/day", () => {
    renderBook([TSLA_PUT]);
    expect(seen(card("TSLA"))).not.toContain("θ");
  });

  it("never glues a sign to the verb", () => {
    renderBook([CRWV_PUT, AMD_CALL, TSLA_PUT]);
    for (const link of screen.getAllByRole("link")) {
      expect(seen(link)).not.toMatch(/(costs|earns) [+−-]/);
    }
  });

  it("says nothing about greeks for a contract the feed didn't quote", () => {
    renderBook([META_CALL]);
    expect(seen(card("META"))).not.toMatch(/θ|Δ/);
  });
});

describe("PositionCards — the right-hand figures (#5059)", () => {
  it("puts the value now on line 1 with today's change in brackets", () => {
    renderBook();
    expect(seen(card("NVDA"))).toContain("$30,173 (+$195)");
    expect(seen(card("^CRWV ?, \\$82"))).toContain("$4,543 (−$82)");
  });

  it("values a sold option at what it costs to close, a negative", () => {
    renderBook();
    expect(seen(card("CRWV \\$80"))).toContain("−$550 (−$60)");
  });

  it("puts the total on line 2 with its return in brackets", () => {
    renderBook();
    expect(seen(card("NVDA"))).toContain("+$1,056 (+3.63%)");
    expect(seen(card("CRWV \\$80"))).toContain("−$295 (−116%)");
  });

  it("writes every loss with a real minus sign, not a hyphen", () => {
    renderBook();
    for (const link of screen.getAllByRole("link")) expect(seen(link)).not.toMatch(/-\$|-\d/);
  });

  it("reads a flat day as a dash, never a made-up zero", () => {
    renderBook([position("SPY", "SPY", { quantity: "1" })]);
    const spy = seen(card("SPY"));
    expect(spy).toContain("(—)");
    expect(spy).not.toMatch(/\$0\b/);
  });

  it("reads a move that rounds to $0 as flat, not +$0", () => {
    renderBook([position("SPY", "SPY", { quantity: "1", dayPl: "+$0", dayTone: "pos" })]);
    const spy = seen(card("SPY"));
    expect(spy).toContain("(—)");
    expect(spy).not.toMatch(/\+\$0\b/);
  });

  it("leaves out a return the server could not work out", () => {
    renderBook([position(SOLD_PUT, "CRWV $80 PUT · 6 NOV 26", { returnPct: "—" })]);
    const put = seen(card("CRWV"));
    expect(put).toContain("−$292");
    expect(put).not.toMatch(/−\$292 \(|%/);
  });

  it("labels the two right-hand columns once, above the cards", () => {
    renderBook();
    const key = document.querySelector(".pos-cards-key");
    expect(key).toHaveAttribute("aria-hidden", "true");
    expect(seen(key as HTMLElement)).toBe("value (today) total (return)");
    // The key is not a position: the list still holds one item per card.
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("PositionCards — what a screen reader hears", () => {
  it("names every figure on a share card in words", () => {
    renderBook();
    expect(card("NVDA")).toHaveAccessibleName(
      /^NVDA ?, \$232\.10 a share ?, value \$30,173 ?, \+\$195 today ?, 130 shares ?, breakeven \$223\.98 ?, total \+\$1,056 ?, return \+3\.63%$/,
    );
  });

  it("names a sold option's side, days left and return on premium", () => {
    renderBook();
    expect(card("CRWV \\$80")).toHaveAccessibleName(
      /^CRWV \$80 SHORT PUT ?, 29 days left ?, value −\$550 ?, −\$60 today ?, 1 contract ?, breakeven \$77\.45 ?, total −\$295 ?, return on premium −116% ?, θ earns \$11\/day ?, Δ \+\$40 per \$1$/,
    );
  });

  it("says a flat day in words", () => {
    renderBook([position("SPY", "SPY", { quantity: "1", value: "$560" })]);
    expect(card("SPY")).toHaveAccessibleName(/, value \$560 ?, no change today ?,/);
  });
});
