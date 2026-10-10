import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { OptionPositions } from "../../src/live/options";
import { decayBySymbol } from "../../src/shell/holding-decay";
import { PositionCards } from "../../src/shell/position-cards";

/**
 * A phone position card opens that position on Trade (#4947): an option lands on the HELD contract
 * — the Orders pane with its Close / Roll row marked — never a new-order preset for the same strike.
 * Its plain line says time decay in a word that follows the holder's side (#5023). It carries the
 * day's change beside the lifetime total, each named in a word (#5041) — on a phone the card is the
 * only positions view, so without "today" a member can't find the holding that moved.
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
    expect(searchOf("AMD put")).toEqual({
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

/** The option book as `/api/trade/option-positions` answers it: each holding's theta is the
 *  contract's × signed contracts × 100, so a sold contract's is positive. Undefined = not quoted. */
const book = (thetaBySymbol: Record<string, number | undefined>) =>
  ({
    available: true,
    rows: Object.entries(thetaBySymbol).map(([symbol, theta]) => ({
      symbol,
      ...(theta === undefined ? {} : { positionGreeks: { theta } }),
    })),
  }) as unknown as OptionPositions;

const SOLD_PUT = "CRWV261106P00080000";
const SOLD_CALL = "NVDA261120C00210000";
const BOUGHT_CALL = "AMD261120C00180000";
const UNQUOTED = "TSLA261120C00500000";

function renderBook() {
  const held = [
    position(SOLD_PUT, "CRWV $80 PUT · 6 NOV 26", { expiresIn: "29 days" }),
    position(SOLD_CALL, "NVDA $210 CALL · 20 NOV 26", { expiresIn: "43 days" }),
    position(BOUGHT_CALL, "AMD $180 CALL · 20 NOV 26", { expiresIn: "43 days" }),
    position(UNQUOTED, "TSLA $500 CALL · 20 NOV 26", { expiresIn: "43 days" }),
  ];
  const decay = decayBySymbol(
    book({ [SOLD_PUT]: 11.2, [SOLD_CALL]: 23, [BOUGHT_CALL]: -12.4, [UNQUOTED]: undefined }),
  );
  render(<PositionCards positions={held} deskId="sauron" decayBySymbol={decay} />);
}

const card = (name: string) => screen.getByRole("link", { name: new RegExp(name) });

describe("PositionCards — time decay in a word (#5023)", () => {
  it("says a sold put earns from time decay", () => {
    renderBook();
    expect(card("CRWV \\$80 PUT")).toHaveTextContent(
      "Expires in 29 days · earns ~$11/day from time",
    );
  });

  it("says a sold call earns from time decay", () => {
    renderBook();
    expect(card("NVDA \\$210 CALL")).toHaveTextContent(
      "Expires in 43 days · earns ~$23/day from time",
    );
  });

  it("says a bought option loses to time decay", () => {
    renderBook();
    expect(card("AMD \\$180 CALL")).toHaveTextContent(
      "Expires in 43 days · loses ~$12/day to time",
    );
  });

  it("never glues a sign to the verb", () => {
    renderBook();
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveTextContent(/(loses|earns) ~[+−-]/);
    }
  });

  it("says nothing about decay for a contract the feed didn't quote", () => {
    renderBook();
    const unquoted = card("TSLA \\$500 CALL");
    expect(unquoted).toHaveTextContent("Expires in 43 days");
    expect(unquoted).not.toHaveTextContent(/loses|earns/);
  });
});

/** What a sighted reader sees: the card's text without the words only a screen reader hears. */
function seen(el: HTMLElement): string {
  const copy = el.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll(".visually-hidden")) hidden.remove();
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** The profile world's book (scripts/study/worlds/inputs/profile-today.json), as `/api/desk/eric`
 *  formats it: MSFT down on the day and up over its life, AAPL up on both. */
const MSFT = position("MSFT", "MSFT", {
  plainName: "Shares · profits if MSFT rises",
  totalPl: "+$414",
  returnPct: "+1.85%",
  totalTone: "pos",
  dayPl: "-$76",
  dayPct: "-0.33%",
  dayTone: "neg",
});
const AAPL = position("AAPL", "AAPL", {
  plainName: "Shares · profits if AAPL rises",
  totalPl: "+$462",
  returnPct: "+3.37%",
  totalTone: "pos",
  dayPl: "+$72",
  dayPct: "+0.51%",
  dayTone: "pos",
});

describe("PositionCards — today's change beside the total (#5041)", () => {
  it("shows a holding down today and up overall, each figure named", () => {
    render(<PositionCards positions={[MSFT, AAPL]} deskId="eric" />);
    const msft = seen(card("MSFT"));
    expect(msft).toContain("+$414 · +1.85% total");
    expect(msft).toContain("▼ −$76 today");
  });

  it("marks an up day with ▲ and a plus sign, never hue alone", () => {
    render(<PositionCards positions={[MSFT, AAPL]} deskId="eric" />);
    expect(seen(card("AAPL"))).toContain("▲ +$72 today");
  });

  it("writes a loss with a real minus sign, not a hyphen", () => {
    render(
      <PositionCards
        positions={[
          position("CRWV", "CRWV", {
            totalPl: "-$412",
            returnPct: "-8.32%",
            dayPl: "-$82",
            dayTone: "neg",
          }),
        ]}
        deskId="sauron"
      />,
    );
    const crwv = seen(card("CRWV"));
    expect(crwv).toContain("−$412 · −8.32% total");
    expect(crwv).toContain("▼ −$82 today");
    expect(crwv).not.toMatch(/-\$/);
  });

  it("reads a flat day as a dash, never a made-up zero", () => {
    render(<PositionCards positions={[position("SPY", "SPY")]} deskId="eric" />);
    const spy = seen(card("SPY"));
    expect(spy).toContain("— today");
    expect(spy).not.toMatch(/\$0|▲|▼/);
  });

  it("reads a move that rounds to $0 as flat, not ▲ +$0", () => {
    render(
      <PositionCards
        positions={[position("SPY", "SPY", { dayPl: "+$0", dayTone: "pos" })]}
        deskId="eric"
      />,
    );
    const spy = seen(card("SPY"));
    expect(spy).toContain("— today");
    expect(spy).not.toMatch(/\$0|▲/);
  });

  it("leaves out a return the server could not work out", () => {
    render(
      <PositionCards
        positions={[position(SOLD_PUT, "CRWV $80 PUT · 6 NOV 26", { returnPct: "—" })]}
        deskId="sauron"
      />,
    );
    expect(seen(card("CRWV \\$80 PUT"))).toContain("−$292 total");
  });
});

describe("PositionCards — what a screen reader hears", () => {
  it("names the total and the return on the first line", () => {
    render(<PositionCards positions={[MSFT]} deskId="eric" />);
    // The name algorithm pads a block-level child with a space ("MSFT , total"); speech ignores it.
    expect(card("MSFT")).toHaveAccessibleName(/^MSFT ?, total \+\$414 ?, return \+1\.85% /);
  });

  it("separates the plain line from today's change", () => {
    render(<PositionCards positions={[MSFT]} deskId="eric" />);
    // Without the pause a reader hears "profits if MSFT rises −$76" (#5023's lesson).
    expect(card("MSFT")).toHaveAccessibleName(/profits if MSFT rises ?, −\$76 today$/);
  });

  it("says a flat day in words", () => {
    render(<PositionCards positions={[position("SPY", "SPY")]} deskId="eric" />);
    expect(card("SPY")).toHaveAccessibleName(/, no change today$/);
  });
});
