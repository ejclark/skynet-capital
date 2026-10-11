import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskActivityEvent } from "../../src/live/desk";
import { ActivityLedger } from "../../src/shell/activity-ledger";
import { OrderDeepDive } from "../../src/shell/order-deep-dive";

/** #5101 (R2-deep, Eric's pick on #5037 q5): "Full detail ›" opens an order's deep dive — a
 *  non-modal side panel on a desktop, a page with one way back on a phone — whose links stay
 *  inside and whose playbook block is the owner's alone (#885, #5043). */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}));
let quote: unknown = { quoteNote: "no quote" };
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve(quote),
}));

const wheel: DeskActivityEvent = {
  orderId: "put-1",
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  side: "sell",
  quantity: 1,
  filled: 1,
  price: "$2.55",
  status: "filled",
  at: "2026-10-06T14:31:00Z",
  backfilled: false,
  origin: "unknown",
  reasoning: {
    reason:
      "Selling one cash-secured CRWV $80 PUT. Run on its owner's conviction — our study found CRWV's option premium underpays its moves.",
    personaId: "sauron",
    playbookId: "CRWV-WHEEL",
    playbookMode: "aggressive",
    expectation: "Below it, the bot buys 100 shares at $80 and sells covered calls on them next.",
    invalidator: "the play retires if its net P/L is below 0 on 2027-01-29",
    contract: "SELL 1 CRWV $80 PUT · 6 NOV 26 · limit $2.55",
    rawCount: 1,
    guardedCount: 1,
  },
};
const shares: DeskActivityEvent = {
  ...wheel,
  orderId: "nvda-1",
  symbol: "NVDA",
  display: "NVDA",
  side: "buy",
  quantity: 40,
  filled: 40,
  price: "$226.10",
  at: "2026-10-05T15:20:00Z",
  reasoning: undefined,
};

const noop = (): void => undefined;

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** happy-dom has no `matchMedia` — the desktop default. A phone installs one that matches. */
function phone(): () => void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
  return () => Reflect.deleteProperty(window, "matchMedia");
}

describe("OrderDeepDive — what it shows", () => {
  it("titles the bet, draws the line, the days left, the cash and the play at expiry", () => {
    render(wrap(<OrderDeepDive event={wheel} variant="page" showPlaybook onClose={noop} />));
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "CRWV stays above $80 until Nov 6",
    );
    const labels = [...document.querySelectorAll(".pl-label")].map((l) => l.textContent);
    expect(labels).toEqual([
      "now no quote right now",
      "✕ wrong if it ends below $80",
      "breakeven $77.45",
    ]);
    expect(document.querySelector(".pl-legend")).toHaveTextContent(
      "At expiry:loses below $77.45buys 100 at $80, still aheadkeeps $255 above $80",
    );
    expect(document.querySelector(".dl")).toHaveTextContent(/Nov 6 · \d+ days? left|expired/);
    expect(document.querySelector(".dd-cash")).toHaveTextContent("received +$255$8,000 set aside");
    const play = screen.getByRole("region", { name: "At Nov 6, the play" });
    expect(
      within(play)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      "above $80the put expires · keeps +$255",
      "below $80✕ wrong ifbuys 100 CRWV at $80 (net $77.45 a share)",
    ]);
    expect(screen.getByText(/our study found CRWV's option premium/)).toBeInTheDocument();
  });

  it("puts the playbook, its plan and what retires it in the owner's block alone", () => {
    render(wrap(<OrderDeepDive event={wheel} variant="page" showPlaybook onClose={noop} />));
    expect(screen.getByText("The playbook · only you see this")).toBeInTheDocument();
    expect(screen.getByText("CRWV-WHEEL")).toBeInTheDocument();
    expect(screen.getByText(/sells covered calls on them next/)).toBeInTheDocument();
    expect(screen.getByText(/the play retires if/)).toBeInTheDocument();
  });

  // #885 and #5043: a non-owner gets the contract's arithmetic and the reason — no playbook, no
  // plan for what comes next, no retire rule.
  it("shows a non-owner every public fact and none of the playbook's", () => {
    render(
      wrap(<OrderDeepDive event={wheel} variant="page" showPlaybook={false} onClose={noop} />),
    );
    expect(screen.getByRole("region", { name: "At Nov 6, the play" })).toBeInTheDocument();
    expect(screen.getByText(/our study found/)).toBeInTheDocument();
    expect(screen.queryByText(/only you see this/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CRWV-WHEEL/)).not.toBeInTheDocument();
    expect(screen.queryByText(/covered calls/)).not.toBeInTheDocument();
    expect(screen.queryByText(/retires/)).not.toBeInTheDocument();
  });

  it("keeps its links inside: what it weighed opens in place, and nothing leaves the page", () => {
    render(wrap(<OrderDeepDive event={wheel} variant="page" showPlaybook onClose={noop} />));
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText(/1 idea · 1 past the risk checks/)).toBeInTheDocument();
    expect(screen.queryByText("SELL 1 CRWV $80 PUT · 6 NOV 26 · limit $2.55")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Show/ }));
    expect(screen.getByText("SELL 1 CRWV $80 PUT · 6 NOV 26 · limit $2.55")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("rings the stock's price now when the quote answers, and says so when it does not", async () => {
    quote = { symbol: "CRWV", last: 82.6, change: 0, changePct: 0, tone: "flat" };
    render(wrap(<OrderDeepDive event={wheel} variant="page" showPlaybook onClose={noop} />));
    expect(await screen.findByText("$82.60")).toBeInTheDocument();
    expect(document.querySelector(".pl-now")).not.toBeNull();
    quote = { quoteNote: "no quote" };
  });

  // The fade says a loss keeps growing past the edge: a sold put's does, a bought option's stops at
  // what it paid — its losing stretch ends square, as "loses all $255" says.
  it("fades a losing stretch off the edge only where the loss keeps growing", () => {
    const fades = () => document.querySelectorAll(".pl-fade-from, .pl-fade-to").length;
    const { unmount } = render(
      wrap(<OrderDeepDive event={wheel} variant="page" showPlaybook onClose={noop} />),
    );
    expect(fades()).toBe(1);
    unmount();
    for (const symbol of ["CRWV261106P00080000", "CRWV261106C00090000"]) {
      const bought = { ...wheel, symbol, side: "buy" as const };
      const view = render(
        wrap(<OrderDeepDive event={bought} variant="page" showPlaybook onClose={noop} />),
      );
      expect(document.querySelector(".pl-legend")).toHaveTextContent("loses all $255");
      expect(fades()).toBe(0);
      view.unmount();
    }
  });

  it("draws a share buy's line from its fill, with no stop price on the order", () => {
    render(wrap(<OrderDeepDive event={shares} variant="page" showPlaybook onClose={noop} />));
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("NVDA rises from $226.10");
    expect(screen.getByText(/no stop price on this order/)).toBeInTheDocument();
    expect(screen.getByText(/no quote right now/)).toBeInTheDocument();
    expect(screen.queryByText(/the play/)).toBeNull();
  });
});

describe("OrderDeepDive — the two shapes and their one way back", () => {
  it("is a page on a phone whose way back is ‹ Activity", () => {
    const onClose = rstest.fn();
    render(wrap(<OrderDeepDive event={wheel} variant="page" showPlaybook onClose={onClose} />));
    expect(screen.queryByRole("complementary")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "‹ Activity" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is a side panel on a desktop — not a dialog — that Close or Escape returns from", () => {
    const onClose = rstest.fn();
    render(wrap(<OrderDeepDive event={wheel} variant="panel" showPlaybook onClose={onClose} />));
    const panel = screen.getByRole("complementary");
    expect(panel).not.toHaveAttribute("aria-modal");
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(within(panel).getByRole("button", { name: /Close/ }));
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("moves focus to its title when it opens", () => {
    render(wrap(<OrderDeepDive event={wheel} variant="panel" showPlaybook onClose={noop} />));
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 3 }));
  });
});

describe("ActivityLedger — the door and the way back to the same row", () => {
  it("offers Full detail in an opened card, and opens it for that order", () => {
    const restore = phone();
    try {
      const onDetail = rstest.fn();
      render(wrap(<ActivityLedger events={[wheel, shares]} onDetail={onDetail} />));
      expect(screen.queryByRole("button", { name: /Full detail/ })).toBeNull();
      fireEvent.click(
        within(document.getElementById("act-put-1") as HTMLElement).getAllByRole(
          "button",
        )[0] as HTMLElement,
      );
      fireEvent.click(screen.getByRole("button", { name: /Full detail/ }));
      expect(onDetail).toHaveBeenCalledWith("put-1");
    } finally {
      restore();
    }
  });

  it("on a phone, puts the page in the list's place, and brings the row back opened", () => {
    const restore = phone();
    try {
      const { rerender } = render(
        wrap(<ActivityLedger events={[wheel, shares]} detail="put-1" onDetail={noop} />),
      );
      expect(document.querySelector(".act-cards")).toBeNull();
      expect(screen.getByRole("button", { name: "‹ Activity" })).toBeInTheDocument();
      rerender(wrap(<ActivityLedger events={[wheel, shares]} onDetail={noop} />));
      const card = document.getElementById("act-put-1") as HTMLElement;
      expect(card).toHaveAttribute("data-open");
      expect(document.activeElement).toBe(card.querySelector(".act-card-head"));
    } finally {
      restore();
    }
  });

  it("on a desktop, keeps the table live beside a panel and marks the row it belongs to", () => {
    render(wrap(<ActivityLedger events={[wheel, shares]} detail="put-1" onDetail={noop} />));
    expect(document.querySelector("table.blotter")).not.toBeNull();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(document.getElementById("act-put-1")).toHaveAttribute("data-detail");
    expect(screen.getByRole("button", { name: /Full detail/ })).toBeInTheDocument();
  });

  it("opens nothing for an order the loaded rows do not hold, or with no door wired", async () => {
    render(wrap(<ActivityLedger events={[wheel]} detail="gone-9" onDetail={noop} />));
    expect(screen.queryByRole("complementary")).toBeNull();
    render(wrap(<ActivityLedger events={[wheel]} detail="put-1" />));
    await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());
  });
});
