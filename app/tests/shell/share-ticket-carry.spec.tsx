import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as realRouter from "@tanstack/react-router" with { rstest: "importActual" };
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import * as realOptions from "../../src/live/options" with { rstest: "importActual" };
import type { PlayInfo } from "../../src/live/options";
import type { PlayCode } from "../../src/live/plays";
import { DeskTicket } from "../../src/shell/desk-ticket";
import { TradeGate } from "../../src/shell/trade-gate";

/**
 * The share ticket keeps what the member typed and says what it is waiting for:
 *  - flipping Buy ⇄ Sell remounts the ticket on the other rung, and the count goes with it; a
 *    chosen limit goes too, a stop price never does (a buy stop sits above the market, a sell stop
 *    below, so the same number would fire at once);
 *  - switching the order type never moves a limit price into the stop field;
 *  - a disabled Review says why in words, since a phone has no hover;
 *  - a Sell ticket says how many shares the account holds, and "Sell all" fills that count.
 */

rstest.mock("@tanstack/react-router", () => ({
  ...realRouter,
  Link: ({ children }: { children: ReactNode }) => <a href="/app/trade">{children}</a>,
}));
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: (symbol: string) =>
    Promise.resolve({ symbol, last: 232.1, change: 0, changePct: 0, tone: "flat" }),
}));
let deskReads = 0;
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () => {
    deskReads += 1;
    return Promise.resolve({
      generatedAt: "2026-11-16T19:00:00Z",
      desk: {
        id: "desk-1",
        name: "Desk",
        kind: "human",
        considerations: [],
        positions: [
          { symbol: "NVDA", isOption: false, quantity: "130" },
          { symbol: "TSLA", isOption: false, quantity: "-50" },
        ],
      },
    });
  },
}));
const stock = (code: "101" | "102", side: "buy" | "sell"): PlayInfo => ({
  code,
  id: code,
  name: side === "buy" ? "Buy stock" : "Sell stock",
  tldr: "",
  kind: "stock",
  side,
  gloss: "",
  locked: false,
  earned: true,
});
rstest.mock("../../src/live/options", () => ({
  ...realOptions,
  fetchPlays: () =>
    Promise.resolve({
      linked: true,
      wheels: false,
      plays: [stock("101", "buy"), stock("102", "sell")],
    }),
}));

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

/** The trade route's ticket pane, with `?play=` held in state the way the route holds it. */
function Ticket(): ReactNode {
  const [code, setCode] = useState<PlayCode>("101");
  return (
    <DeskTicket
      desk="desk-1"
      code={code}
      onPreset={setCode}
      initialSymbol="NVDA"
      accounts={[]}
      onDeskChange={() => undefined}
    />
  );
}

function mountTicket(): void {
  render(
    <QueryClientProvider client={client()}>
      <Ticket />
    </QueryClientProvider>,
  );
}

function mountGate(action: "buy" | "sell", symbol?: string): void {
  render(
    <QueryClientProvider client={client()}>
      <TradeGate deskId="desk-1" initialAction={action} initialSymbol={symbol} />
    </QueryClientProvider>,
  );
}

const set = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const flip = async (side: "Buy" | "Sell") =>
  fireEvent.click(await screen.findByRole("button", { name: side }));

describe("the share ticket — a side flip keeps what was typed", () => {
  it("keeps the count across Buy → Sell", async () => {
    mountTicket();
    set("Shares", "25");
    await flip("Sell");
    expect(await screen.findByRole("button", { name: "Sell" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Shares")).toHaveValue(25);
  });

  it("keeps a chosen limit, and drops a stop price rather than fire it on the other side", async () => {
    mountTicket();
    set("Shares", "25");
    set("Order type", "limit");
    set("Limit price", "180");
    await flip("Sell");
    expect(screen.getByLabelText("Order type")).toHaveValue("limit");
    expect(screen.getByLabelText("Limit price")).toHaveValue(180);

    set("Order type", "stop");
    set("Stop price", "175");
    await flip("Buy");
    expect(screen.getByLabelText("Shares")).toHaveValue(25);
    expect(screen.getByLabelText("Order type")).toHaveValue("stop");
    expect(screen.getByLabelText("Stop price")).toHaveValue(null);
  });

  it("never moves a limit price into the stop field when the order type changes", () => {
    mountGate("buy", "NVDA");
    set("Shares", "25");
    set("Order type", "limit");
    set("Limit price", "180");
    set("Order type", "stop");
    expect(screen.getByLabelText("Stop price")).toHaveValue(null);
    set("Order type", "limit");
    expect(screen.getByLabelText("Limit price")).toHaveValue(180);
    expect(screen.getByLabelText("Shares")).toHaveValue(25);
  });
});

describe("the share ticket — Review says what it is waiting for", () => {
  it("names what is missing under the disabled button, and goes once nothing is", () => {
    mountGate("buy");
    const review = screen.getByRole("button", { name: "Review order" });
    expect(review).toBeDisabled();
    expect(review).toHaveAccessibleDescription(
      "Enter a symbol and the number of shares to review.",
    );
    set("Symbol", "NVDA");
    expect(screen.getByText("Enter the number of shares to review.")).toBeInTheDocument();
    set("Shares", "10");
    expect(review).toBeEnabled();
    expect(screen.queryByText(/to review\.$/)).not.toBeInTheDocument();
  });

  it("reads as an example, not a value", () => {
    mountGate("buy");
    expect(screen.getByLabelText("Shares")).toHaveAttribute("placeholder", "e.g. 10");
  });
});

describe("the share ticket — a Sell ticket shows what you hold", () => {
  it("says how many shares are held, and Sell all fills the count without submitting", async () => {
    mountGate("sell", "NVDA");
    expect(await screen.findByText("You hold 130 shares of NVDA")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sell all 130" }));
    expect(screen.getByLabelText("Shares")).toHaveValue(130);
    expect(screen.getByRole("button", { name: "Review order" })).toBeEnabled();
  });

  it("shows nothing for a stock held short", async () => {
    deskReads = 0;
    mountGate("sell", "TSLA");
    await waitFor(() => expect(deskReads).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText(/You hold/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sell all/ })).not.toBeInTheDocument();
  });

  it("stays off a Buy ticket", async () => {
    mountGate("buy", "NVDA");
    await screen.findByText(/\$232\.10/);
    expect(screen.queryByText(/You hold/)).not.toBeInTheDocument();
  });
});
