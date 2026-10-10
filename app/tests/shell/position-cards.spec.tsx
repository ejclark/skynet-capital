import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { OptionPositions } from "../../src/live/options";
import { decayBySymbol } from "../../src/shell/holding-decay";
import { PositionCards } from "../../src/shell/position-cards";

/**
 * A phone position card opens that position on Trade (#4947): an option lands on the HELD contract
 * — the Orders pane with its Close / Roll row marked — never a new-order preset for the same strike.
 * Its plain line says time decay in a word that follows the holder's side (#5023), and a screen
 * reader hears that line apart from the return figure.
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

describe("PositionCards — what a screen reader hears", () => {
  it("separates the plain line from the return figure", () => {
    render(
      <PositionCards
        positions={[
          position("CRWV", "CRWV", {
            plainName: "Shares · profits if CRWV rises",
            returnPct: "−8.32%",
            totalPl: "-$412",
          }),
        ]}
        deskId="sauron"
      />,
    );
    // The name algorithm pads a block-level child with a space ("rises , return"); speech ignores it.
    expect(card("CRWV")).toHaveAccessibleName(/profits if CRWV rises ?, return −8\.32%$/);
  });
});
