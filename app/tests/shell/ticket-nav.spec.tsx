import { fireEvent, render, screen } from "@testing-library/react";
import type { PlayInfo } from "../../src/live/options";
import { TicketNav } from "../../src/shell/ticket-nav";

/**
 * The Instrument segment (Eric, 2026-09-22, repeating an earlier ask: "spread is not... it's own
 * instrument... that's because spread is a specific type of option and not it's own instrument —
 * as I've mentioned multiple times now for explicit removal of those toggle"). Spread's own door
 * is now the CTA at the end of the option ticket's own form (`option-gate.tsx`'s `tkt-spread-cta`),
 * not a third Instrument segment here.
 */

const plays: readonly PlayInfo[] = [
  {
    code: "101",
    id: "101",
    name: "Buy stock",
    tldr: "",
    kind: "stock",
    side: "buy",
    gloss: "",
    locked: false,
    earned: true,
  },
  {
    code: "102",
    id: "102",
    name: "Sell stock",
    tldr: "",
    kind: "stock",
    side: "sell",
    gloss: "",
    locked: false,
    earned: true,
  },
  {
    code: "201",
    id: "201",
    name: "Sell a cash-secured put",
    tldr: "",
    kind: "option",
    side: "sell",
    optionType: "put",
    gloss: "",
    locked: false,
    earned: true,
  },
  {
    code: "202",
    id: "202",
    name: "Sell a covered call",
    tldr: "",
    kind: "option",
    side: "sell",
    optionType: "call",
    gloss: "",
    locked: true,
    earned: false,
  },
  {
    code: "301",
    id: "301",
    name: "Buy a put",
    tldr: "",
    kind: "option",
    side: "buy",
    optionType: "put",
    gloss: "",
    locked: true,
    earned: false,
  },
  {
    code: "302",
    id: "302",
    name: "Buy a call",
    tldr: "",
    kind: "option",
    side: "buy",
    optionType: "call",
    gloss: "",
    locked: true,
    earned: false,
  },
];

describe("TicketNav — the Instrument segment", () => {
  it("offers only Stock and Option — never Spread", () => {
    render(<TicketNav plays={plays} code="201" onPreset={() => undefined} />);
    expect(screen.getByRole("button", { name: "Stock" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Option" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Spread" })).not.toBeInTheDocument();
  });

  it("still presets through onPreset for the remaining instruments", () => {
    const presets: string[] = [];
    render(<TicketNav plays={plays} code="201" onPreset={(c) => presets.push(c)} />);
    fireEvent.click(screen.getByRole("button", { name: "Stock" }));
    expect(presets).toEqual(["102"]);
  });
});
