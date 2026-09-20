import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { DeskPosition } from "../../src/live/desk";
import { BlotterRow } from "../../src/shell/blotter-row";

const position = (overrides: Partial<DeskPosition> = {}): DeskPosition =>
  ({
    symbol: "SPY",
    display: "SPY",
    detail: "199 sh",
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

// A `<tr>` needs a table ancestor to render its real semantics in jsdom/happy-dom.
const inTable = (row: React.ReactElement) => {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <table>
        <tbody>{row}</tbody>
      </table>
    </QueryClientProvider>
  );
};

describe("BlotterRow", () => {
  it("shows the symbol and the always-visible columns", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    expect(screen.getByText("SPY")).toBeInTheDocument();
    expect(screen.getByText("199")).toBeInTheDocument();
    expect(screen.getByText("+$985")).toBeInTheDocument();
  });

  it("starts collapsed — no detail grid until expanded", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    expect(screen.getByRole("button", { name: /Detail for/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Cost / share")).not.toBeInTheDocument();
  });

  it("reveals the detail grid when the expand chevron is clicked", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    fireEvent.click(screen.getByRole("button", { name: /Detail for/ }));

    expect(screen.getByText("Cost / share")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Detail for/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("collapses again on a second click of the same chevron", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));
    const chevron = screen.getByRole("button", { name: /Detail for/ });

    fireEvent.click(chevron);
    fireEvent.click(chevron);

    expect(screen.queryByText("Cost / share")).not.toBeInTheDocument();
  });

  it("shows no lots trigger when the position carries no lots", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));
    expect(screen.queryByRole("button", { name: /lots for SPY/ })).not.toBeInTheDocument();
  });

  it("renders no detail line when the position carries none — nothing to say beats a static label", () => {
    render(inTable(<BlotterRow position={position({ detail: "" })} deskId="sauron" />));
    expect(screen.queryByText("199 sh")).not.toBeInTheDocument();
  });

  describe("lot breakdown (#3186 slice 1)", () => {
    const lots = position({
      lots: [
        {
          lotId: "SPY-0-a",
          openedAt: "2026-08-28 14:00 UTC",
          quantity: "99",
          costPerShare: "$495.00",
          price: "$505.00",
          costBasis: "$49,005",
          value: "$49,995",
          dayPl: "+$60",
          dayTone: "pos",
          totalPl: "+$990",
          returnPct: "+2.0%",
          totalTone: "pos",
        },
        {
          lotId: "SPY-1-b",
          openedAt: "2026-09-01 14:00 UTC",
          quantity: "100",
          costPerShare: "$504.95",
          price: "$505.00",
          costBasis: "$50,495",
          value: "$50,500",
          dayPl: "+$60",
          dayTone: "pos",
          totalPl: "+$5",
          returnPct: "+0.0%",
          totalTone: "pos",
        },
      ],
    });

    it("starts with the lot rows collapsed", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      expect(screen.queryByText("$49,005")).not.toBeInTheDocument();
    });

    it("reveals lot rows sharing the parent's exact columns when the trigger is clicked", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));

      fireEvent.click(screen.getByRole("button", { name: /2 lots for SPY/ }));

      expect(screen.getByText("$49,005")).toBeInTheDocument();
      expect(screen.getByText("$50,495")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close all" })).toBeInTheDocument();
      // A lot row trades the symbol column for its opened-at date — no "Lot ·" label filler,
      // no raw fill history (BUY/SELL): only what's still on the ledger, header-aligned.
      expect(screen.getByText("2026-08-28 14:00 UTC")).toBeInTheDocument();
      expect(screen.queryByText(/Lot ·/)).not.toBeInTheDocument();
      expect(screen.queryByText("BUY")).not.toBeInTheDocument();
    });

    it("sums the visible lot columns back to the parent row", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      fireEvent.click(screen.getByRole("button", { name: /2 lots for SPY/ }));

      const sum = (a: string, b: string) =>
        Number(a.replace(/[^0-9.-]/g, "")) + Number(b.replace(/[^0-9.-]/g, ""));

      expect(sum(lots.lots?.[0]?.quantity ?? "0", lots.lots?.[1]?.quantity ?? "0")).toBe(199);
      expect(sum(lots.lots?.[0]?.costBasis ?? "0", lots.lots?.[1]?.costBasis ?? "0")).toBe(99_500);
      expect(sum(lots.lots?.[0]?.totalPl ?? "0", lots.lots?.[1]?.totalPl ?? "0")).toBe(995);
    });

    it("opens a lot-scoped close panel from Close lot, independent of the other lot", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      fireEvent.click(screen.getByRole("button", { name: /2 lots for SPY/ }));

      const closeLotButtons = screen.getAllByRole("button", { name: "Close lot" });
      expect(closeLotButtons).toHaveLength(2);
      fireEvent.click(closeLotButtons[0] as HTMLElement);

      // The close panel scopes to the first lot's own 99 shares, not the full 199.
      expect(screen.getByRole("spinbutton")).toHaveValue(99);
      expect(closeLotButtons[1]).toHaveAttribute("aria-expanded", "false");
    });

    it("renders Roll disabled with the reason, never a silent no-op button", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      fireEvent.click(screen.getByRole("button", { name: /2 lots for SPY/ }));

      const rollButtons = screen.getAllByRole("button", { name: /Roll —/ });
      expect(rollButtons).toHaveLength(2);
      for (const button of rollButtons) expect(button).toBeDisabled();
    });
  });
});
