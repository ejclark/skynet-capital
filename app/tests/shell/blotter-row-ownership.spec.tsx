import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskPosition, PositionLot } from "../../src/live/desk";
import { BlotterRow } from "../../src/shell/blotter-row";

// The row's Guidance link is a router Link; no router here, so render its href.
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

/**
 * Ownership decides the write controls (#3807 slice 2d, dead end 4). The server refuses any order
 * on an account the requester does not own (`account-identity-gate.ts`: "You can only trade your
 * own account."), so on another member's account the row renders no Close, no Close this buy and
 * no Roll — Guidance is a read and stays. WHEN the viewer owns the account, THE row SHALL offer
 * every write; WHEN the viewer does not, THE row SHALL offer none of them.
 */

const lot = (lotId: string, openedAt: string): PositionLot => ({
  lotId,
  openedAt,
  quantity: "1",
  costPerShare: "$1.40",
  price: "$1.50",
  costBasis: "$140",
  value: "$150",
  dayPl: "+$5",
  dayTone: "pos",
  totalPl: "+$10",
  returnPct: "+7%",
  totalTone: "pos",
});

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

const option = (): DeskPosition =>
  position({
    symbol: "SPY261016C00600000",
    display: "SPY Oct 16 $600 call",
    isOption: true,
    quantity: "2",
    lots: [lot("a", "2026-09-01"), lot("b", "2026-09-10")],
  });

const inTable = (row: ReactElement) => (
  <QueryClientProvider client={new QueryClient()}>
    <table>
      <tbody>{row}</tbody>
    </table>
  </QueryClientProvider>
);

describe("BlotterRow — ownership gates the writes", () => {
  it("offers Close and Guidance on an account the viewer owns", () => {
    render(inTable(<BlotterRow position={position()} deskId="human-eric" canTrade />));

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Guidance" })).toBeInTheDocument();
  });

  it("offers Close by default — the Profile page only ever shows the viewer's own accounts", () => {
    render(inTable(<BlotterRow position={position()} deskId="human-eric" />));

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("renders no Close on an account the viewer does not own, and keeps Guidance", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" canTrade={false} />));

    expect(screen.queryByRole("button", { name: /Close/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Guidance" })).toHaveAttribute(
      "href",
      expect.stringContaining("desk=sauron"),
    );
  });

  it("renders no Close this buy and no Roll on another account's lots", () => {
    render(inTable(<BlotterRow position={option()} deskId="sauron" canTrade={false} />));
    fireEvent.click(screen.getByRole("button", { name: /buys for/ }));

    expect(screen.getByText("2026-09-01")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Close/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Roll/ })).not.toBeInTheDocument();
  });

  it("offers Close this buy and Roll on the viewer's own lots", () => {
    render(inTable(<BlotterRow position={option()} deskId="human-eric" canTrade />));
    fireEvent.click(screen.getByRole("button", { name: /buys for/ }));

    expect(screen.getAllByRole("button", { name: "Close this buy" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Roll/ })).toHaveLength(2);
  });
});
