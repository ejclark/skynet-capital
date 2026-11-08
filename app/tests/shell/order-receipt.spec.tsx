import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { SentOrder } from "../../src/live/order-receipt";
import type { DeskOrderRow, DeskOrders, OrderChange } from "../../src/live/orders";
import { OrderReceipt } from "../../src/shell/order-receipt";
import { renderOnTrade } from "./trade-route-harness";

/**
 * THE TICKET BECOMES ITS RECEIPT (Eric, 2026-11-06): a sent order states itself in words, a live
 * one can be modified or cancelled right there, a filled one points at its close or roll, and
 * "New ticket" is the way back to an empty form.
 */

let orders: DeskOrders = { available: true, asOf: "t", working: [], recent: [] };
const cancels: string[] = [];
const changes: { id: string; change: OrderChange }[] = [];

rstest.mock("../../src/live/orders", () => ({
  fetchOrders: () => Promise.resolve(orders),
  cancelOrder: (_desk: string, id: string) => {
    cancels.push(id);
    return Promise.resolve({ ok: true, orderId: id });
  },
  replaceOrder: (_desk: string, id: string, change: OrderChange) => {
    changes.push({ id, change });
    // The broker answers with a new id; the list then holds the old row as replaced.
    orders = {
      available: true,
      asOf: "t",
      working: [row({ id: "o-9", replaces: id, limitPrice: change.limitPrice ?? 20 })],
      recent: [row({ state: "replaced", replacedBy: "o-9", cancelable: false })],
    };
    return Promise.resolve({ ok: true, orderId: "o-9", replaces: id, status: "pending_new" });
  },
}));
rstest.mock("../../src/live/desk-events", () => ({ useOrderFill: () => undefined }));

const UUID = "2ebcf855-387c-4d9f-9017-9d71571de193";
const put: SentOrder = {
  orderId: UUID,
  status: "pending_new",
  symbol: "CRWV270115P00062500",
  side: "sell",
  quantity: 20,
  unit: "contracts",
  orderType: "limit",
  limitPrice: 20,
  timeInForce: "day",
};
function row(over: Partial<DeskOrderRow> = {}): DeskOrderRow {
  return {
    id: UUID,
    symbol: "CRWV270115P00062500",
    display: "CRWV $62.50 PUT · 15 JAN 27",
    unit: "contracts",
    side: "sell",
    orderType: "limit",
    quantity: 20,
    filledQuantity: 0,
    limitPrice: 20,
    timeInForce: "day",
    state: "working",
    cancelable: true,
    replaceable: true,
    ...over,
  };
}

function mount(order: SentOrder, onNewTicket = () => undefined) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderOnTrade(
    <OrderReceipt deskId="desk-1" order={order} onNewTicket={onNewTicket} />,
    client,
  );
}

beforeEach(() => {
  orders = { available: true, asOf: "t", working: [row()], recent: [] };
  cancels.length = 0;
  changes.length = 0;
});

describe("a sent order, still working", () => {
  it("SHALL state the order in words — never the UUID, the raw status or the raw contract", async () => {
    mount(put);
    const receipt = await screen.findByRole("region", { name: "Order receipt" });
    expect(receipt).toHaveTextContent("Order placed — not filled yet");
    expect(receipt).toHaveTextContent("CRWV $62.50 PUT · 15 JAN 27");
    expect(receipt).toHaveTextContent("Sell to open · 20 contracts · Limit $20.00 · Day");
    expect(receipt).not.toHaveTextContent(UUID);
    expect(receipt).not.toHaveTextContent("pending_new");
    expect(receipt).not.toHaveTextContent("CRWV270115P00062500");
  });

  it("SHALL cancel in two taps, on this order", async () => {
    mount(put);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel order" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }));
    await waitFor(() => expect(cancels).toEqual([UUID]));
    expect(await screen.findByText("Cancel sent to the broker.")).toBeInTheDocument();
  });

  it("SHALL modify in place and follow the broker's new id", async () => {
    mount(put);
    fireEvent.click(await screen.findByRole("button", { name: "Modify" }));
    const price = screen.getByLabelText(/Limit/i);
    fireEvent.change(price, { target: { value: "19" } });
    fireEvent.click(screen.getByRole("button", { name: /Send change/ }));
    await waitFor(() => expect(changes).toEqual([{ id: UUID, change: { limitPrice: 19 } }]));
    const receipt = screen.getByRole("region", { name: "Order receipt" });
    await waitFor(() => expect(receipt).toHaveTextContent("Limit $19.00"));
    expect(receipt).toHaveTextContent("Order ref o-9");
  });

  it("says where Modify and Cancel will be until the broker lists the order", async () => {
    orders = { available: true, asOf: "t", working: [], recent: [] };
    mount(put);
    expect(
      await screen.findByText("Modify and Cancel appear here once the broker lists the order."),
    ).toBeInTheDocument();
  });
});

describe("a filled order", () => {
  it("SHALL hand an option off to its Close / Roll row on the Orders pane", async () => {
    orders = {
      available: true,
      asOf: "t",
      working: [],
      recent: [
        row({ state: "filled", filledQuantity: 20, avgFillPrice: 20.05, cancelable: false }),
      ],
    };
    mount(put);
    expect(await screen.findByText("Filled — 20 contracts @ $20.05")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
    const next = screen.getByRole("link", { name: "Close or roll this position →" });
    const href = new URL(next.getAttribute("href") ?? "", "http://x");
    expect(href.searchParams.get("section")).toBe("orders");
    expect(href.searchParams.get("manage")).toContain("CRWV270115P00062500");
  });

  it("SHALL send bought shares to the Sell ticket", async () => {
    const shares: SentOrder = {
      ...put,
      orderId: "s-1",
      symbol: "NVDA",
      side: "buy",
      quantity: 5,
      unit: "shares",
    };
    orders = {
      available: true,
      asOf: "t",
      working: [],
      recent: [
        row({
          id: "s-1",
          symbol: "NVDA",
          side: "buy",
          quantity: 5,
          unit: "shares",
          state: "filled",
          filledQuantity: 5,
          cancelable: false,
        }),
      ],
    };
    mount(shares);
    const sell = await screen.findByRole("link", { name: "Sell these shares →" });
    const href = new URL(sell.getAttribute("href") ?? "", "http://x");
    expect(href.searchParams.get("play")).toContain("102");
    expect(href.searchParams.get("symbol")).toContain("NVDA");
  });
});

it("New ticket hands the form back", async () => {
  const onNewTicket = rstest.fn();
  mount(put, onNewTicket);
  fireEvent.click(await screen.findByRole("button", { name: "New ticket" }));
  expect(onNewTicket).toHaveBeenCalledOnce();
});
