import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { CancelResult, DeskOrders, ReplaceResult } from "../../src/live/orders";
import { WorkingOrders } from "../../src/shell/working-orders";

/**
 * `WorkingOrders` (#3407 P1 slice 2) — every state is a word (never a hue alone), an unlinked
 * broker says so instead of showing an empty list, a cancel is two taps and its refusal is the
 * server's own sentence.
 */

let nextOrders: DeskOrders = { available: false, reason: "unlinked", working: [], recent: [] };
let nextCancel: CancelResult = { ok: true, orderId: "o-1" };
const cancels: string[] = [];
let nextReplace: ReplaceResult = {
  ok: true,
  orderId: "o-9",
  replaces: "o-1",
  status: "pending_replace",
};
const replaces: Array<{ id: string; change: unknown }> = [];
rstest.mock("../../src/live/orders", () => ({
  fetchOrders: () => Promise.resolve(nextOrders),
  cancelOrder: (_desk: string, id: string) => {
    cancels.push(id);
    return Promise.resolve(nextCancel);
  },
  replaceOrder: (_desk: string, id: string, change: unknown) => {
    replaces.push({ id, change });
    return Promise.resolve(nextReplace);
  },
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const working = {
  id: "o-1",
  symbol: "NVDA",
  side: "buy" as const,
  orderType: "limit",
  quantity: 5,
  filledQuantity: 0,
  limitPrice: 170,
  timeInForce: "gtc",
  submittedAt: "2026-09-21T14:00:00Z",
  state: "working" as const,
  cancelable: true,
  replaceable: true,
};

describe("WorkingOrders", () => {
  beforeEach(() => {
    cancels.length = 0;
    replaces.length = 0;
  });

  it("says unlinked in words, never an empty list, when no account is connected", async () => {
    nextOrders = { available: false, reason: "unlinked", working: [], recent: [] };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText(/isn't linked/)).toBeInTheDocument());
    expect(screen.queryByText(/No working orders/)).not.toBeInTheDocument();
  });

  it("renders a working row with its state word, type, price, TIF and a Cancel button", async () => {
    nextOrders = { available: true, asOf: "t", working: [working], recent: [] };
    const { container } = render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText("NVDA")).toBeInTheDocument());
    expect(container.querySelector(".wo-state")?.textContent).toContain("Working");
    expect(screen.getByText(/Limit · limit \$170\.00 · GTC/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows a partial fill as 'n of m' with the Partly filled word", async () => {
    nextOrders = {
      available: true,
      asOf: "t",
      working: [{ ...working, id: "o-2", state: "partial", filledQuantity: 2 }],
      recent: [],
    };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText("2 of 5")).toBeInTheDocument());
    expect(screen.getByText(/Partly filled/)).toBeInTheDocument();
  });

  it("cancels in two taps — the button becomes its own confirm — and reports the broker's answer", async () => {
    nextOrders = { available: true, asOf: "t", working: [working], recent: [] };
    nextCancel = { ok: true, orderId: "o-1" };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancels).toEqual([]);
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }));
    await waitFor(() => expect(cancels).toEqual(["o-1"]));
    await waitFor(() => expect(screen.getByText(/Cancel sent/)).toBeInTheDocument());
  });

  it("renders a refused cancel as the server's own sentence", async () => {
    nextOrders = { available: true, asOf: "t", working: [working], recent: [] };
    nextCancel = {
      ok: false,
      refusals: ["The broker couldn't cancel this order: order is already filled"],
    };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }));
    await waitFor(() => expect(screen.getByText(/order is already filled/)).toBeInTheDocument());
  });

  it("lists settled orders under their own heading with the fill price, and no Cancel", async () => {
    nextOrders = {
      available: true,
      asOf: "t",
      working: [],
      recent: [
        {
          ...working,
          id: "o-3",
          orderType: "market",
          limitPrice: undefined,
          filledQuantity: 5,
          avgFillPrice: 181.32,
          state: "filled",
          cancelable: false,
        },
      ],
    };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText("Settled today")).toBeInTheDocument());
    expect(screen.getByText(/Filled · \$181\.32/)).toBeInTheDocument();
    expect(screen.getByText(/No working orders/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("opens the Modify drawer pre-filled, sends only what changed, and reports the new id (P1 1b)", async () => {
    nextOrders = { available: true, asOf: "t", working: [working], recent: [] };
    nextReplace = { ok: true, orderId: "o-9", replaces: "o-1", status: "pending_replace" };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByRole("button", { name: "Modify" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Modify" }));
    const shares = screen.getByLabelText("Shares") as HTMLInputElement;
    const price = screen.getByLabelText("Limit price") as HTMLInputElement;
    expect(shares.value).toBe("5");
    expect(price.value).toBe("170");
    // Nothing changed yet: the send is disabled and the note says what to change.
    expect(screen.getByRole("button", { name: "Send change" })).toBeDisabled();
    fireEvent.change(price, { target: { value: "172" } });
    fireEvent.click(screen.getByRole("button", { name: "Day" }));
    expect(screen.getByText("Will send: limit $172.00 · Day")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send change" }));
    await waitFor(() =>
      expect(replaces).toEqual([{ id: "o-1", change: { limitPrice: 172, timeInForce: "day" } }]),
    );
    await waitFor(() =>
      expect(screen.getByText(/replaced o-1 with o-9 \(pending replace\)/)).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText("Shares")).not.toBeInTheDocument();
  });

  it("refuses a bad shape in the drawer before anything is sent, and keeps a refused change open", async () => {
    nextOrders = { available: true, asOf: "t", working: [working], recent: [] };
    nextReplace = {
      ok: false,
      refusals: ["The broker couldn't change this order: order is not replaceable"],
    };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByRole("button", { name: "Modify" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Modify" }));
    fireEvent.change(screen.getByLabelText("Shares"), { target: { value: "0" } });
    expect(screen.getByText("Shares must be a positive whole number.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send change" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Shares"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Send change" }));
    await waitFor(() => expect(replaces).toEqual([{ id: "o-1", change: { quantity: 8 } }]));
    await waitFor(() => expect(screen.getByText(/not replaceable/)).toBeInTheDocument());
    expect(screen.getByLabelText("Shares")).toBeInTheDocument();
  });

  it("offers no Modify on a market order, and words a replaced row's lineage", async () => {
    nextOrders = {
      available: true,
      asOf: "t",
      working: [
        { ...working, id: "o-9", replaces: "o-1" },
        { ...working, id: "o-4", orderType: "market", limitPrice: undefined, replaceable: false },
      ],
      recent: [
        {
          ...working,
          id: "o-1",
          state: "replaced",
          cancelable: false,
          replaceable: false,
          replacedBy: "o-9",
        },
      ],
    };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText(/changed from o-1/)).toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: "Modify" })).toHaveLength(1);
    expect(screen.getByText(/Replaced · now o-9/)).toBeInTheDocument();
  });
});
