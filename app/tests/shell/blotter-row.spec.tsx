import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { ROLL_UNAVAILABLE_REASON } from "../../../src/trading/order-ticket";
import type { DeskPosition } from "../../src/live/desk";
import { BlotterRow } from "../../src/shell/blotter-row";

/**
 * One desk row (#738 phase 2c; ranked columns #5071). WHEN its chevron is opened, THE row SHALL
 * show, in place under it, what its columns leave out: the plain words, cost, expiry, best / worst,
 * the next event, the buys that make up the position (each closable on its own, #3186 slice 1) and
 * the position's own Close. One disclosure per row: the symbol-header lots accordion and the action
 * column retired into it so the closed row fits beside the tower.
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

const opener = (display = "SPY") => screen.getByRole("button", { name: `Detail for ${display}` });
const opened = () => document.querySelector(".row-open") as HTMLElement;

describe("BlotterRow", () => {
  it("shows the position in its columns", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    expect(screen.getByText("SPY")).toBeInTheDocument();
    expect(screen.getByText("$100,495")).toBeInTheDocument();
    expect(screen.getByText("+$985")).toBeInTheDocument();
  });

  it("starts closed — nothing opened until the chevron is", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    expect(opener()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Cost basis")).not.toBeInTheDocument();
  });

  it("opens in place under the row when the chevron is clicked", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    fireEvent.click(opener());

    // The fold carries what the columns leave out (#3689 slice 6, #5071).
    expect(screen.getByText("Cost basis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Best / worst case" })).toBeInTheDocument();
    expect(opener()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes again on a second click of the same chevron", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    fireEvent.click(opener());
    fireEvent.click(opener());

    expect(screen.queryByText("Cost basis")).not.toBeInTheDocument();
  });

  it("shows no buys when the position carries none", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));
    fireEvent.click(opener());
    expect(screen.queryByRole("region", { name: /buys? for SPY/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("keeps a short stock's Close off with its reason as text, never a sell (#5086)", () => {
    render(inTable(<BlotterRow position={position({ quantity: "-1,000" })} deskId="sauron" />));
    fireEvent.click(opener());

    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toBeDisabled();
    // Visible words, not a title a phone cannot hover — the Roll pattern (#3807 slice 2e).
    expect(close).not.toHaveAttribute("title");
    expect(close).toHaveAccessibleDescription(/short 1,000 shares/);
    expect(within(opened()).getByText(/a sell would add to the short/i)).toBeVisible();
    fireEvent.click(close);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  describe("the buys, opened in the row (#3186 slice 1)", () => {
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

    it("keeps the buys closed with the row", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      expect(screen.queryByText("$49,995")).not.toBeInTheDocument();
    });

    it("lists each buy when the row opens: when, how many at what, worth now, P/L since", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      fireEvent.click(opener());

      const buys = screen.getByRole("region", { name: "2 buys for SPY" });
      const items = within(buys).getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("2026-08-28 14:00 UTC");
      expect(items[0]).toHaveTextContent("99 shares at $495.00");
      expect(items[0]).toHaveTextContent("$49,995");
      expect(items[0]).toHaveTextContent("+$990 (+2.0%)");
      expect(within(buys).getByText("$50,500")).toBeInTheDocument();
      // Only what's still on the ledger: no raw fill history (BUY/SELL), no "lots" jargon.
      expect(screen.queryByText("BUY")).not.toBeInTheDocument();
      expect(screen.queryByText(/lots/i)).not.toBeInTheDocument();
      // The position's own close says it closes every buy.
      expect(screen.getByRole("button", { name: "Close all" })).toBeInTheDocument();
    });

    it("sums the buys back to the position", () => {
      const sum = (a: string, b: string) =>
        Number(a.replace(/[^0-9.-]/g, "")) + Number(b.replace(/[^0-9.-]/g, ""));

      expect(sum(lots.lots?.[0]?.quantity ?? "0", lots.lots?.[1]?.quantity ?? "0")).toBe(199);
      expect(sum(lots.lots?.[0]?.costBasis ?? "0", lots.lots?.[1]?.costBasis ?? "0")).toBe(99_500);
      expect(sum(lots.lots?.[0]?.totalPl ?? "0", lots.lots?.[1]?.totalPl ?? "0")).toBe(995);
    });

    it("opens a buy-scoped close panel from Close this buy, independent of the other buy", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      fireEvent.click(opener());

      const closeBuy = screen.getAllByRole("button", { name: "Close this buy" });
      expect(closeBuy).toHaveLength(2);
      fireEvent.click(closeBuy[0] as HTMLElement);

      // The close panel scopes to the first buy's own 99 shares, not the full 199.
      expect(screen.getByRole("spinbutton")).toHaveValue(99);
      expect(closeBuy[1]).toHaveAttribute("aria-expanded", "false");
    });

    it("renders no Roll on a stock's buys — rolling only exists for options", () => {
      render(inTable(<BlotterRow position={lots} deskId="sauron" />));
      fireEvent.click(opener());

      expect(screen.queryByRole("button", { name: /Roll/ })).not.toBeInTheDocument();
    });
  });

  describe("the buys of an option position", () => {
    const optionLots = position({
      symbol: "NVDA261218C00130000",
      display: "NVDA Dec 18 130 Call",
      isOption: true,
      lots: [
        {
          lotId: "NVDA-0-a",
          openedAt: "2026-08-28 14:00 UTC",
          quantity: "2",
          costPerShare: "$5.00",
          price: "$7.42",
          costBasis: "$1,000",
          value: "$1,484",
          dayPl: "+$34",
          dayTone: "pos",
          totalPl: "+$484",
          returnPct: "+48.40%",
          totalTone: "pos",
        },
      ],
    });

    it("renders Roll disabled with the reason, never a silent no-op button", () => {
      render(inTable(<BlotterRow position={optionLots} deskId="sauron" />));
      fireEvent.click(opener("NVDA Dec 18 130 Call"));

      const rollButtons = screen.getAllByRole("button", { name: "Roll" });
      expect(rollButtons).toHaveLength(1);
      // Dead end 8 (#3807 slice 2e): the reason is visible text under the buys, and every Roll
      // is described by it — never a title a phone cannot hover.
      expect(screen.getByText(ROLL_UNAVAILABLE_REASON)).toBeVisible();
      for (const button of rollButtons) {
        expect(button).toBeDisabled();
        expect(button).toHaveAccessibleDescription(ROLL_UNAVAILABLE_REASON);
        expect(button).not.toHaveAttribute("title");
      }
    });

    it("counts contracts, not shares", () => {
      render(inTable(<BlotterRow position={optionLots} deskId="sauron" />));
      fireEvent.click(opener("NVDA Dec 18 130 Call"));
      expect(opened()).toHaveTextContent("2 contracts at $5.00");
    });
  });
});

describe("BlotterRow — the opened row's plain figures (#3689 slice 6)", () => {
  const put = {
    symbol: "TSLA261017P00400000",
    display: "TSLA Oct 17 400 Put",
    detail: "8 ct",
    isOption: true,
    quantity: "8",
    costPerShare: "$1,410.00",
    price: "$630.00",
    costBasis: "$11,280",
    value: "$5,040",
    dayPl: "-$320",
    dayPct: "-6.0%",
    dayTone: "neg" as const,
    totalPl: "-$6,240",
    totalPlRaw: -6240,
    returnPct: "-55.3%",
    totalTone: "neg" as const,
    weightPct: 2,
    plainName: "Put option · profits if TSLA falls",
    expiresIn: "24 days",
    expiresInDays: 24,
    breakeven: "$385.90",
    best: "+$308,720",
    worst: "−$11,280",
  };

  it("says what the position bets on, when it expires, and its best and worst case", () => {
    render(inTable(<BlotterRow position={put} deskId="eric" />));
    fireEvent.click(opener("TSLA Oct 17 400 Put"));
    const open = within(opened());
    expect(open.getByText("Put option · profits if TSLA falls")).toBeInTheDocument();
    expect(open.getByText("24 days")).toBeInTheDocument();
    expect(open.getByText("+$308,720")).toHaveClass("tone-pos");
    expect(open.getByText("−$11,280")).toHaveClass("tone-neg");
  });

  it("says when the stock's own event lands before expiry, in words as well as tone", () => {
    render(
      inTable(
        <BlotterRow
          position={{
            ...put,
            nextEvent: {
              label: "Earnings Oct 15",
              at: "2026-10-15",
              beforeExpiry: true,
              scope: "stock",
            },
          }}
          deskId="eric"
        />,
      ),
    );
    fireEvent.click(opener("TSLA Oct 17 400 Put"));
    const event = opened().querySelector(".pos-more-event dd") as HTMLElement;
    // The date glued to its month, so a wrap never splits "Oct / 15".
    expect(event.querySelector(".next-event-label")?.textContent).toBe("Earnings Oct 15");
    expect(event.querySelector(".next-event-when")).toHaveTextContent("before expiry");
  });
});

describe("the Guidance link (#3729 step 4)", () => {
  it("links a stock row to its guidance with the symbol and account, never the stake", () => {
    render(inTable(<BlotterRow position={position({ symbol: "CRWV" })} deskId="desk-1" />));
    fireEvent.click(opener());
    const href = screen.getByRole("link", { name: "Guidance" }).getAttribute("href") ?? "";
    expect(href).toBe("/trade?desk=desk-1&symbol=CRWV&section=guidance");
  });
});
