import { render } from "@testing-library/react";
import { type SymbolDesk, symbolBook } from "../../src/live/symbol-book";
import { SymbolHead } from "../../src/shell/events-symbol-head";

/**
 * The one-symbol head's money line (#6283): a symbol whose sold options outweigh what it holds
 * nets below zero, and the head says so with its sign — "-$550 in positions", the cockpit head's
 * own wording — never "$550 invested" for a buy-back owed.
 */

const position = (
  symbol: string,
  quantity: string,
  value: string,
  costBasis: string,
  pl: number,
) => ({
  symbol,
  quantity,
  isOption: symbol.length > 6,
  value,
  costBasis,
  totalPlRaw: pl,
});

const desk = (...positions: ReturnType<typeof position>[]): SymbolDesk => ({
  desk: { id: "bot-sauron", positions },
});

const moneyLine = (d: SymbolDesk): string => {
  const book = symbolBook([d], "CRWV");
  if (!book) throw new Error("the desk holds CRWV");
  const { container } = render(<SymbolHead book={book} onClear={() => undefined} />);
  return (
    (container.querySelector(".sym-money b") as HTMLElement).textContent +
    " " +
    (container.querySelector(".sym-money .sym-word") as HTMLElement).textContent
  );
};

describe("SymbolHead — the money in one symbol (#6283)", () => {
  it("says what shares and a sold put net to as invested", () => {
    const wheel = desk(
      position("CRWV", "55", "$4,543", "$4,955", -412),
      position("CRWV261106P00080000", "-1", "-$550", "-$255", -295),
    );
    expect(moneyLine(wheel)).toBe("$3,993 invested");
  });

  it("prints a sold put alone with its sign, in positions — never as money invested", () => {
    const putOnly = desk(position("CRWV261106P00080000", "-1", "-$550", "-$255", -295));
    expect(moneyLine(putOnly)).toBe("-$550 in positions");
  });

  it("prints a sold call worth more than the shares under it with its sign too", () => {
    const covered = desk(
      position("CRWV", "1", "$80", "$80", 0),
      position("CRWV261106C00060000", "-1", "-$3,000", "-$1,200", -1800),
    );
    expect(moneyLine(covered)).toBe("-$2,920 in positions");
  });
});
