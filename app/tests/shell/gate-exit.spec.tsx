import { fireEvent, screen } from "@testing-library/react";
import type { DeskOrders } from "../../src/live/orders";
import * as realTicket from "../../src/live/ticket" with { rstest: "importActual" };
import type { TicketDraft, TicketPreview, TicketResult } from "../../src/live/ticket";
import { TradeGate } from "../../src/shell/trade-gate";
import { renderOnTrade } from "./trade-route-harness";

/**
 * EXITS AT ENTRY ON THE STOCK FORM (#8249 PR 2). With the setting off for this session the form is
 * exactly as before: three order types, no exit control. Admitted, Stop-Limit joins the types with
 * both its prices, and a limit buy offers "Add an exit" — two empty boxes, sent with the draft. The
 * review shows each leg's dollars from the server's preview, and the receipt names the exits at
 * the prices the broker echoed, never the draft's.
 */

const drafts: { path: "review" | "submit"; draft: TicketDraft }[] = [];
let preview: TicketPreview;
let result: TicketResult;
rstest.mock("../../src/live/ticket", () => ({
  ...realTicket,
  reviewTicket: (draft: TicketDraft) => {
    drafts.push({ path: "review", draft });
    return Promise.resolve({ preview });
  },
  submitTicket: (draft: TicketDraft) => {
    drafts.push({ path: "submit", draft });
    return Promise.resolve(result);
  },
}));
/** No book by default (no mid, so no seed); a spec sets one to see the limit seeded at the mid. */
let book: { bid: number; ask: number; mid: number } | undefined;
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () =>
    Promise.resolve({ symbol: "XLE", last: 91, change: 0, changePct: 0, tone: "flat", ...book }),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-11-24T15:00:00Z",
      desk: { id: "desk-1", name: "Desk", kind: "human", positions: [], considerations: [] },
    }),
}));
const orders: DeskOrders = { available: true, asOf: "t", working: [], recent: [] };
rstest.mock("../../src/live/orders", () => ({
  fetchOrders: () => Promise.resolve(orders),
  cancelOrder: () => Promise.resolve({ ok: true, orderId: "x" }),
  replaceOrder: () => Promise.resolve({ ok: false, refusals: [] }),
}));
rstest.mock("../../src/live/desk-events", () => ({
  useOrderFill: () => undefined,
  useDeskEvents: () => undefined,
}));

const optionLabels = (): string[] =>
  Array.from(
    (screen.getByLabelText("Order type") as HTMLSelectElement).options,
    (option) => option.textContent ?? "",
  );

function mount(exitAtEntry?: boolean): void {
  drafts.length = 0;
  book = undefined;
  renderOnTrade(
    <TradeGate deskId="desk-1" initialSymbol="XLE" showSide={false} exitAtEntry={exitAtEntry} />,
  );
}

async function limitBuy(): Promise<void> {
  await screen.findByLabelText("Order type");
  fireEvent.change(screen.getByLabelText("Shares"), { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText("Order type"), { target: { value: "limit" } });
  fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "91" } });
}

describe("the stock form with the exit-at-entry setting off (#8249)", () => {
  it("offers exactly Market, Limit and Stop-Market, and no exit control", async () => {
    mount();
    await limitBuy();
    expect(optionLabels()).toEqual(["Market", "Limit", "Stop-Market"]);
    expect(screen.queryByRole("button", { name: "Add an exit" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Guards regular hours only/)).not.toBeInTheDocument();
  });
});

describe("the stock form for an admitted session (#8249)", () => {
  it("adds Stop-Limit with both its prices, stop first", async () => {
    mount(true);
    await screen.findByLabelText("Order type");
    expect(optionLabels()).toEqual(["Market", "Limit", "Stop-Market", "Stop-Limit"]);
    fireEvent.change(screen.getByLabelText("Order type"), { target: { value: "stop_limit" } });
    const labels = Array.from(
      document.querySelectorAll(".gate-fields label"),
      (l) => l.textContent,
    );
    expect(labels.indexOf("Stop price")).toBeLessThan(labels.indexOf("Limit price"));
    expect(screen.queryByRole("button", { name: "Add an exit" })).not.toBeInTheDocument();
  });

  it("offers an exit on a limit buy only, with both boxes empty", async () => {
    mount(true);
    await limitBuy();
    fireEvent.click(screen.getByRole("button", { name: "Add an exit" }));
    expect(screen.getByLabelText("Take-profit")).toHaveValue(null);
    expect(screen.getByLabelText("Stop")).toHaveValue(null);
    expect(screen.getByText(/Guards regular hours only/)).toBeInTheDocument();
    // An exit rides GTC, so the picker gives way to the line that says so.
    expect(screen.getByText(/^Time in force: GTC/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Order type"), { target: { value: "market" } });
    expect(screen.queryByLabelText("Take-profit")).not.toBeInTheDocument();
  });

  it("sends the exit, shows each leg's dollars from the review, and names the broker's exits on the receipt", async () => {
    mount(true);
    await limitBuy();
    fireEvent.click(screen.getByRole("button", { name: "Add an exit" }));
    fireEvent.change(screen.getByLabelText("Take-profit"), { target: { value: "95" } });
    fireEvent.change(screen.getByLabelText("Stop"), { target: { value: "85" } });
    preview = {
      ok: true,
      action: "buy",
      symbol: "XLE",
      quantity: 3,
      orderType: "limit",
      limitPrice: 91,
      timeInForce: "gtc",
      exit: { takeProfit: 95, stop: 85, takeProfitDollars: 12, stopDollars: -18 },
      estPrice: 91,
      estNotional: 273,
      estCashAfter: 1_000,
      refusals: [],
      warnings: [],
    };
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    await screen.findByText(/ready to submit/i);
    expect(drafts[0]?.draft).toEqual(
      expect.objectContaining({
        orderType: "limit",
        limitPrice: 91,
        exit: { takeProfit: 95, stop: 85 },
      }),
    );
    expect(drafts[0]?.draft.timeInForce).toBeUndefined();
    expect(
      screen.getByText(/^Take-profit \$95\.00 · \+\$12\.00 against your limit/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Stop \$85\.00 · about −\$18\.00 against your limit/),
    ).toBeInTheDocument();

    // The broker's echo, a cent off the draft on purpose: the receipt states what the broker holds.
    result = {
      ok: true,
      orderId: "o-1",
      status: "accepted",
      symbol: "XLE",
      timeInForce: "gtc",
      exits: { takeProfit: 95.01, stop: 84.99 },
    };
    fireEvent.click(screen.getByRole("button", { name: /^Submit order/ }));
    expect(
      await screen.findByText(/Sent with its exits: Take-profit \$95\.01 · Stop \$84\.99\./),
    ).toBeInTheDocument();
  });
});

describe("Stop-Limit after a limit seeded at the mid (#8249)", () => {
  it("clears the seeded mid, so the stop-limit's limit is never a number the member didn't type", async () => {
    mount(true);
    book = { bid: 90.98, ask: 91.02, mid: 91 };
    expect(await screen.findByLabelText("Limit price")).toHaveValue(91);
    fireEvent.change(screen.getByLabelText("Order type"), { target: { value: "stop_limit" } });
    expect(screen.getByLabelText("Limit price")).toHaveValue(null);
  });
});
