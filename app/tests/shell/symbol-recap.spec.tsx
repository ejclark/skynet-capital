import { render, screen, within } from "@testing-library/react";
import { type SymbolOutlook, WINDOW_STATES } from "../../../src/research/symbol-outlook-shape";
import { SymbolRecap } from "../../src/shell/symbol-recap";

/**
 * The recap card (#4807 slice 3): the symbol's call, its until-date and its windows, each state a
 * glyph and a word. A call past its until-date says stale in words and is demoted.
 */

const OUTLOOK: SymbolOutlook = {
  symbol: "CRWV",
  asOf: "2026-10-18",
  call: "hold",
  confidence: "medium",
  why: "Nothing changes before the print.",
  until: "2026-11-07",
  falsifier: "A close under $70 before the print.",
  windows: [
    { start: "2026-10-18", end: "2026-11-06", state: "open", reason: "The call applies." },
    {
      start: "2026-11-07",
      end: "2026-11-17",
      state: "protected",
      reason: "CRWV earnings print (estimated 2026-11-12): no new entries.",
    },
    {
      start: "2026-11-18",
      end: "2027-01-16",
      state: "no-view",
      reason: "Past the call's until-date; the next assessment sets the view.",
    },
  ],
  basis: { ledger: "docs/research/events/x.md", callFrom: "ledger" },
};

describe("symbol recap card", () => {
  it("leads with the call, its confidence and when it holds until", () => {
    render(<SymbolRecap outlook={OUTLOOK} />);
    const card = screen.getByRole("region", { name: "CRWV research recap" });
    expect(within(card).getByText("HOLD")).toBeTruthy();
    expect(card.textContent).toMatch(/medium confidence/);
    expect(card.textContent).toMatch(/holds until Nov 7/);
    expect(card.getAttribute("data-stale")).toBe("false");
  });

  it("names every window with its glyph and word, and the falsifier", () => {
    render(<SymbolRecap outlook={OUTLOOK} />);
    const rows = within(screen.getByRole("list", { name: "Windows ahead" })).getAllByRole(
      "listitem",
    );
    expect(rows).toHaveLength(3);
    for (const [row, state] of rows.map((r, i) => [r, OUTLOOK.windows[i]?.state] as const)) {
      const { glyph, word } = WINDOW_STATES[state ?? "open"];
      expect(row.textContent).toContain(`${glyph} ${word}`);
    }
    expect(rows[1]?.textContent).toMatch(/Nov 7.*17.*no new entries/);
    expect(screen.getByText(/A close under \$70 before the print\./)).toBeTruthy();
  });

  it("says stale in words once the until-date has passed, and caps the confidence", () => {
    render(
      <SymbolRecap
        outlook={{ ...OUTLOOK, asOf: "2026-11-09", confidence: "high", until: "2026-11-07" }}
      />,
    );
    const card = screen.getByRole("region", { name: "CRWV research recap" });
    expect(card.getAttribute("data-stale")).toBe("true");
    expect(card.textContent).toMatch(/stale since Nov 7/);
    expect(card.textContent).toMatch(/low confidence/);
    expect(card.textContent).not.toMatch(/holds until/);
  });

  it("stands a stale buy aside and says what the research had said", () => {
    render(<SymbolRecap outlook={{ ...OUTLOOK, call: "buy", asOf: "2026-11-09" }} />);
    expect(screen.getByText("WAIT")).toBeTruthy();
    expect(screen.getByText(/The research said BUY/)).toBeTruthy();
  });

  it("with no research says wait and No view in words, never an empty card", () => {
    const { basis: _none, ...bare } = OUTLOOK;
    render(
      <SymbolRecap
        outlook={{
          ...bare,
          call: "wait",
          confidence: "none",
          why: "No current research covers CRWV, so the house has no call on it.",
          until: "2027-01-16",
          windows: [
            {
              start: "2026-10-18",
              end: "2027-01-16",
              state: "no-view",
              reason: "No current research.",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("WAIT")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Windows ahead" }).textContent).toContain("○ No view");
    expect(screen.queryByText(/confidence/)).toBeNull();
  });

  it("folds windows past the fourth behind a count", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      start: `2026-10-${String(18 + i * 2).padStart(2, "0")}`,
      end: `2026-10-${String(19 + i * 2).padStart(2, "0")}`,
      state: i % 2 ? ("caution" as const) : ("open" as const),
      reason: `window ${i}`,
    }));
    render(<SymbolRecap outlook={{ ...OUTLOOK, windows: many }} />);
    expect(screen.getByText("2 more windows")).toBeTruthy();
  });
});
