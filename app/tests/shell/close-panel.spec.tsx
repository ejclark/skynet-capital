import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition, PositionLot } from "../../src/live/desk";
import * as actualOptions from "../../src/live/options" with { rstest: "importActual" };
import type { OptionDraft, OptionPreview } from "../../src/live/options";
import * as actualTicket from "../../src/live/ticket" with { rstest: "importActual" };
import type { TicketDraft, TicketPreview } from "../../src/live/ticket";
import { ClosePanel } from "../../src/shell/close-panel";
import { PositionRowOpen } from "../../src/shell/position-row-open";

/**
 * The desk's Close (#5086). The server sends a position's size signed and formatted ("-1" for a
 * sold put, "1,200" for twelve hundred shares), and the panel once read it with a bare Number():
 * a sold option and any position of 1,000 shares or more could never be closed.
 *
 * WHEN a sold option is closed, THE panel SHALL review a close of |quantity| contracts and the
 * confirm step SHALL say "Buy to close" and the count. WHEN shares are closed, THE confirm step
 * SHALL say "Sell" and the count. WHEN the position is short stock, THE Close SHALL be off with
 * its reason in words, and no sell SHALL ever be reviewed (a sell adds to a short).
 */

// The opened row's Guidance link is a router Link; no router here.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/trade">{children}</a>,
}));

const optionCalls: Array<{ step: "review" | "submit"; draft: OptionDraft }> = [];
const ticketCalls: Array<{ step: "review" | "submit"; draft: TicketDraft }> = [];

/** The server's answer to a close: the side resolved from the held position's sign. */
const optionPreview = (draft: OptionDraft, short: boolean): OptionPreview => ({
  code: "close",
  underlying: "CRWV",
  side: short ? "buy" : "sell",
  positionIntent: short ? "buy_to_close" : "sell_to_close",
  contracts: draft.kind === "close" ? (draft.contracts ?? 1) : draft.contracts,
  orderType: "market",
  timeInForce: "day",
  ok: true,
  estNotional: 550,
  refusals: [],
  warnings: [],
});
let shortOption = true;

rstest.mock("../../src/live/options", () => ({
  ...actualOptions,
  reviewOption: (draft: OptionDraft) => {
    optionCalls.push({ step: "review", draft });
    return Promise.resolve({ preview: optionPreview(draft, shortOption) });
  },
  submitOption: (draft: OptionDraft) => {
    optionCalls.push({ step: "submit", draft });
    return Promise.resolve({ ok: true, orderId: "opt-1", status: "accepted", symbol: "CRWV" });
  },
}));

rstest.mock("../../src/live/ticket", () => ({
  ...actualTicket,
  reviewTicket: (draft: TicketDraft) => {
    ticketCalls.push({ step: "review", draft });
    const preview: TicketPreview = {
      ok: true,
      action: draft.action,
      symbol: draft.symbol,
      quantity: draft.quantity,
      orderType: "market",
      timeInForce: "day",
      estNotional: draft.quantity * 232.1,
      refusals: [],
      warnings: [],
    };
    return Promise.resolve({ preview });
  },
  submitTicket: (draft: TicketDraft) => {
    ticketCalls.push({ step: "submit", draft });
    return Promise.resolve({ ok: true, orderId: "stk-1", status: "accepted", symbol: "NVDA" });
  },
}));

const position = (overrides: Partial<DeskPosition>): DeskPosition => ({
  symbol: "NVDA",
  display: "NVDA",
  detail: "",
  isOption: false,
  quantity: "130",
  costPerShare: "$223.98",
  price: "$232.10",
  costBasis: "$29,117",
  value: "$30,173",
  dayPl: "+$120",
  dayPct: "+0.4%",
  dayTone: "pos",
  totalPl: "+$1,056",
  totalPlRaw: 1056,
  returnPct: "+3.6%",
  totalTone: "pos",
  weightPct: 3,
  ...overrides,
});

const soldPut = position({
  symbol: "CRWV261120P00080000",
  display: "CRWV $80 put",
  isOption: true,
  quantity: "-1",
  value: "-$550",
});

function renderPanel(p: DeskPosition, onDone: () => void = rstest.fn()) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ClosePanel deskId="sauron" position={p} onDone={onDone} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  optionCalls.length = 0;
  ticketCalls.length = 0;
  shortOption = true;
});

describe("ClosePanel — a sold option", () => {
  it("seeds the draft with the one contract owed and lets Close all through", () => {
    renderPanel(soldPut);
    expect(screen.getByRole("spinbutton")).toHaveValue(1);
    expect(screen.getByRole("button", { name: "Close all" })).toBeEnabled();
  });

  it("reviews a buy-to-close of one contract and says so before Confirm", async () => {
    renderPanel(soldPut);
    fireEvent.click(screen.getByRole("button", { name: "Close all" }));

    await screen.findByRole("button", { name: "Confirm" });
    expect(optionCalls).toEqual([
      {
        step: "review",
        draft: {
          kind: "close",
          participantId: "sauron",
          occSymbol: "CRWV261120P00080000",
          contracts: 1,
        },
      },
    ]);
    // The side and the count in words, as the server resolved them — never a bare "Close".
    expect(screen.getByText(/Buy to close 1 contract\b/)).toBeInTheDocument();
  });

  it("sends exactly what was reviewed on Confirm", async () => {
    const onDone = rstest.fn();
    renderPanel(soldPut, onDone);
    fireEvent.click(screen.getByRole("button", { name: "Close all" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(optionCalls.map((c) => c.step)).toEqual(["review", "submit"]);
    expect(optionCalls[1]?.draft).toEqual(optionCalls[0]?.draft);
  });

  it("confirms the contracts it reviewed, even when the holding refreshes underneath", async () => {
    shortOption = false;
    const client = new QueryClient();
    const panel = (p: DeskPosition) => (
      <QueryClientProvider client={client}>
        <ClosePanel deskId="sauron" position={p} onDone={rstest.fn()} />
      </QueryClientProvider>
    );
    const { rerender } = render(panel(position({ ...soldPut, quantity: "3", value: "$1,650" })));
    fireEvent.click(screen.getByRole("button", { name: "Close all" }));
    await screen.findByRole("button", { name: "Confirm" });

    rerender(panel(position({ ...soldPut, quantity: "2", value: "$1,100" })));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(optionCalls.map((c) => c.step)).toEqual(["review", "submit"]));
    expect(optionCalls[1]?.draft).toEqual(optionCalls[0]?.draft);
  });

  it("names a held option's close as a sell to close", async () => {
    shortOption = false;
    renderPanel(position({ ...soldPut, quantity: "2", value: "$1,100" }));
    fireEvent.click(screen.getByRole("button", { name: "Close all" }));

    await screen.findByRole("button", { name: "Confirm" });
    expect(screen.getByText(/Sell to close 2 contracts\b/)).toBeInTheDocument();
  });

  it("names the count it closes, so one buy of a larger position never closes all of it", async () => {
    shortOption = false;
    // One buy of a three-contract position, addressed as a position of its own (the opened row's
    // "Close this buy"). Leaving the count off would tell the server "close everything held".
    renderPanel(position({ ...soldPut, quantity: "1", value: "$550" }));
    fireEvent.click(screen.getByRole("button", { name: "Close all" }));

    await screen.findByRole("button", { name: "Confirm" });
    expect(optionCalls[0]?.draft).toMatchObject({ kind: "close", contracts: 1 });
  });
});

describe("ClosePanel — shares", () => {
  const big = position({ quantity: "1,200", value: "$278,520" });

  it("seeds the draft with all 1,200 shares and lets Close all through", () => {
    renderPanel(big);
    expect(screen.getByRole("spinbutton")).toHaveValue(1200);
    expect(screen.getByRole("button", { name: "Close all" })).toBeEnabled();
  });

  it("reviews a sell of 1,200 shares and says so before Confirm", async () => {
    renderPanel(big);
    fireEvent.click(screen.getByRole("button", { name: "Close all" }));

    await screen.findByRole("button", { name: "Confirm" });
    expect(ticketCalls).toEqual([
      {
        step: "review",
        draft: { participantId: "sauron", symbol: "NVDA", quantity: 1200, action: "sell" },
      },
    ]);
    expect(screen.getByText(/Sell 1,200 shares\b/)).toBeInTheDocument();
  });

  it("confirms the count it reviewed, even when the holding refreshes underneath", async () => {
    // The desk refetches between Review and Confirm (window focus) and the holding has shrunk.
    // Confirm still sends the 1,200 the member read; the server's own re-review answers for the
    // difference, rather than the panel quietly sending a different order.
    const client = new QueryClient();
    const panel = (p: DeskPosition) => (
      <QueryClientProvider client={client}>
        <ClosePanel deskId="sauron" position={p} onDone={rstest.fn()} />
      </QueryClientProvider>
    );
    const { rerender } = render(panel(big));
    fireEvent.click(screen.getByRole("button", { name: "Close all" }));
    await screen.findByRole("button", { name: "Confirm" });

    rerender(panel(position({ quantity: "1,000", value: "$232,100" })));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(ticketCalls.map((c) => c.step)).toEqual(["review", "submit"]));
    expect(ticketCalls[1]?.draft).toEqual(ticketCalls[0]?.draft);
  });

  it("closes part of the position when the count is trimmed", async () => {
    renderPanel(big);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "400" } });
    fireEvent.click(screen.getByRole("button", { name: "Close 400" }));

    await screen.findByRole("button", { name: "Confirm" });
    expect(ticketCalls[0]?.draft).toMatchObject({ quantity: 400, action: "sell" });
    expect(screen.getByText(/Sell 400 shares\b/)).toBeInTheDocument();
  });
});

describe("ClosePanel — short stock", () => {
  const short = position({ symbol: "TSLA", display: "TSLA", quantity: "-100" });

  it("keeps Close off with its reason in words, and never reviews a sell", () => {
    renderPanel(short);
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toBeDisabled();
    expect(close).toHaveAccessibleDescription(/short 100 shares/);
    expect(close).toHaveAccessibleDescription(/a sell would add to the short/i);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

    fireEvent.click(close);
    expect(ticketCalls).toEqual([]);
  });
});

describe("Close on a position of three buys (#5959)", () => {
  const buy = (openedAt: string, quantity: string): PositionLot => ({
    lotId: `NVDA-${openedAt}`,
    openedAt,
    quantity,
    costPerShare: "$200.00",
    price: "$232.10",
    costBasis: "$0",
    value: "$0",
    dayPl: "$0",
    dayTone: "flat",
    totalPl: "$0",
    returnPct: "0%",
    totalTone: "flat",
  });
  const nvda = position({
    quantity: "88",
    lots: [buy("10/22 14:20", "10"), buy("10/22 14:25", "56"), buy("10/22 14:28", "22")],
  });
  const renderRow = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PositionRowOpen position={nvda} deskId="sauron" canTrade />
      </QueryClientProvider>,
    );

  it("says, before Confirm, that a sell sized to the newest buy comes out of the oldest", async () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Sell 22 shares (oldest buys first)" }));
    fireEvent.click(screen.getByRole("button", { name: "Sell 22" }));

    await screen.findByRole("button", { name: "Confirm" });
    expect(ticketCalls[0]?.draft).toMatchObject({ symbol: "NVDA", quantity: 22, action: "sell" });
    expect(
      screen.getByText(
        "Comes out of your oldest buys first: 10/22 14:20, 10 → 0 · 10/22 14:25, 56 → 44 shares",
      ),
    ).toBeInTheDocument();
  });

  it("keeps a line in the row once the order is sent, until Dismiss", async () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Close this buy" }));
    // The oldest buy's own panel: "Close all" of its 10 shares — the row's "Close all" sits beside it.
    const panel = document.querySelector(".pos-buy-close") as HTMLElement;
    fireEvent.click(within(panel).getByRole("button", { name: "Close all" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    const receipt = await screen.findByRole("status");
    expect(receipt).toHaveTextContent("Sell 10 NVDA sent · est $2,321 · waiting for the fill");
    // The panel is gone; the line is what stays.
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
