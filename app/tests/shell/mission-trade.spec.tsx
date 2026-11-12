import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { FRESH_TICKET, MAX_SHARES, useCampaignTicket } from "../../src/live/mission-ticket";
import { TradeWindow } from "../../src/shell/mission-trade";

/**
 * Campaign's Trade window (#7487 slice 6), drawn: the tag, Symbol from real lists (no text box),
 * the Shares stepper, Market or Limit, and "Review order", which hands the draft to `/trade`'s gate
 * and sends nothing itself. The ticket's state is the session's store, so it survives the window
 * unmounting (the member moving to another window and back).
 */

const navigate = rstest.fn();
rstest.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
let quote: unknown = { quoteNote: "No quote right now." };
rstest.mock("../../src/live/quote", () => ({ fetchQuote: () => Promise.resolve(quote) }));

let accounts: readonly { id: string; name: string }[] = [{ id: "desk-1", name: "Paper" }];
const realFetch = globalThis.fetch;
const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)));
beforeEach(() => {
  navigate.mockClear();
  useCampaignTicket.setState({ ticket: FRESH_TICKET, handedOff: false });
  quote = { quoteNote: "No quote right now." };
  accounts = [{ id: "desk-1", name: "Paper" }];
  globalThis.fetch = ((url: string) => {
    if (url.startsWith("/api/settings")) return json({ accounts });
    if (url.startsWith("/api/desk/"))
      return json({
        generatedAt: "2026-11-11T00:00:00Z",
        desk: {
          id: "desk-1",
          name: "Paper",
          kind: "human",
          positions: [
            { symbol: "MSFT", isOption: false },
            { symbol: "NVDA261120C00190000", isOption: true },
          ],
        },
      });
    if (url.startsWith("/api/trade/watchlist"))
      return json({ available: true, limit: 20, watching: [{ symbol: "AMD", at: "x" }] });
    return Promise.resolve(new Response("{}", { status: 404 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TradeWindow reporting={["NBIS", "NVDA"]} />
    </QueryClientProvider>,
  );
}

describe("TradeWindow", () => {
  it("offers names from held shares, the watchlist and dated reports, and no text box", async () => {
    const { container } = mount();
    expect(screen.getByText("PAPER · DRAFT")).toBeInTheDocument();
    const symbol = screen.getByRole("group", { name: "Symbol" });
    await within(symbol).findByRole("button", { name: "MSFT" });
    expect(within(symbol).getByText("Held")).toBeInTheDocument();
    expect(within(symbol).getByRole("button", { name: "AMD" })).toBeInTheDocument();
    expect(within(symbol).getByText("Reports soon")).toBeInTheDocument();
    // An option position is not offered on a share ticket.
    expect(within(symbol).queryByRole("button", { name: /NVDA2611/ })).toBeNull();
    // The dock's box is the page's only text box.
    expect(container.querySelector("input, textarea")).toBeNull();
  });

  it("holds Review until a company is picked, then hands the draft to /trade", async () => {
    mount();
    const review = screen.getByRole("button", { name: "Review order" });
    expect(review).toBeDisabled();
    expect(screen.getByText("Buy 1 — · market · day")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "NVDA" }));
    fireEvent.click(screen.getByRole("button", { name: "One share more" }));
    fireEvent.click(screen.getByRole("button", { name: "Limit" }));
    expect(screen.getByRole("button", { name: "NVDA" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Limit" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Buy 2 NVDA · limit · GTC")).toBeInTheDocument();
    expect(screen.getByText(/The limit price is set there/)).toBeInTheDocument();
    expect(useCampaignTicket.getState().handedOff).toBe(false);
    fireEvent.click(review);
    expect(navigate).toHaveBeenCalledWith({
      to: "/trade",
      search: { play: "101", symbol: "NVDA", shares: 2, type: "limit" },
    });
    // Overview stops saying "not sent": Campaign cannot know what the gate did with it.
    expect(useCampaignTicket.getState().handedOff).toBe(true);
  });

  it("never steps below one share", () => {
    mount();
    const fewer = screen.getByRole("button", { name: "One share fewer" });
    expect(fewer).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(fewer);
    expect(screen.getByRole("status", { name: "Shares" })).toHaveTextContent("1");
  });

  it("keeps focus on a stepper button when its press reaches the bound", () => {
    mount();
    const more = screen.getByRole("button", { name: "One share more" });
    const fewer = screen.getByRole("button", { name: "One share fewer" });
    fireEvent.click(more);
    fewer.focus();
    fireEvent.click(fewer);
    expect(screen.getByRole("status", { name: "Shares" })).toHaveTextContent("1");
    // A native `disabled` here would drop focus to <body> and lose a screen reader's place.
    expect(fewer).not.toBeDisabled();
    expect(fewer).toHaveAttribute("aria-disabled", "true");
    expect(document.activeElement).toBe(fewer);

    act(() => useCampaignTicket.setState({ ticket: { ...FRESH_TICKET, shares: MAX_SHARES - 1 } }));
    more.focus();
    fireEvent.click(more);
    expect(screen.getByRole("status", { name: "Shares" })).toHaveTextContent(String(MAX_SHARES));
    expect(more).toHaveAttribute("aria-disabled", "true");
    expect(document.activeElement).toBe(more);
    fireEvent.click(more);
    expect(useCampaignTicket.getState().ticket.shares).toBe(MAX_SHARES);
  });

  it("keeps the draft when the window unmounts and comes back", async () => {
    const first = mount();
    fireEvent.click(await screen.findByRole("button", { name: "AMD" }));
    first.unmount();
    mount();
    expect(await screen.findByRole("button", { name: "AMD" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Buy 1 AMD · market · day")).toBeInTheDocument();
  });

  it("shows the server's last price for the picked name, and no change figure", async () => {
    quote = { symbol: "NVDA", last: 181.32, change: 0, changePct: 0, tone: "flat" };
    useCampaignTicket.setState({ ticket: { ...FRESH_TICKET, symbol: "NVDA" } });
    mount();
    expect(await screen.findByText(/NVDA last \$181\.32/)).toBeInTheDocument();
    // A day's move beside a ticket could read as a signal; the window states the price only.
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("states the server's own note when it has no quote", async () => {
    useCampaignTicket.setState({ ticket: { ...FRESH_TICKET, symbol: "NVDA" } });
    mount();
    expect(await screen.findByText("No quote right now.")).toBeInTheDocument();
  });

  it("says the gate needs a paper account when the session owns none", async () => {
    accounts = [];
    mount();
    expect(await screen.findByText("Connect your paper account")).toBeInTheDocument();
  });
});
