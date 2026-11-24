import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { CancelResult, DeskOrders, ReplaceResult } from "../../src/live/orders";
import { WorkingOrders } from "../../src/shell/working-orders";

// #8249: a bracket's exits in the orders list read "Take-profit" and "Stop" with the prices the
// broker holds — words, never a colour — and offer Cancel but no Modify.

let nextOrders: DeskOrders = { available: false, reason: "unlinked", working: [], recent: [] };
const nextCancel: CancelResult = { ok: true, orderId: "o-1" };
const cancels: string[] = [];
const nextReplace: ReplaceResult = {
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

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
    className,
  }: {
    to: string;
    search?: Record<string, string>;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to} className={className}>
      {children}
    </a>
  ),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const exit = {
  id: "o-tp",
  symbol: "XLE",
  side: "sell" as const,
  orderType: "limit",
  quantity: 3,
  filledQuantity: 0,
  limitPrice: 95,
  timeInForce: "gtc",
  submittedAt: "2026-11-24T14:00:00Z",
  state: "working" as const,
  cancelable: true,
  replaceable: false,
  exitRole: "take-profit" as const,
};

describe("WorkingOrders — a bracket's exits (#8249)", () => {
  it("names each exit in words with its price, and offers Cancel without Modify", async () => {
    nextOrders = {
      available: true,
      asOf: "t",
      working: [
        exit,
        {
          ...exit,
          id: "o-sl",
          orderType: "stop",
          limitPrice: undefined,
          stopPrice: 85,
          exitRole: "stop",
        },
      ],
      recent: [],
    };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() =>
      expect(screen.getByText(/Take-profit · limit \$95\.00/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/^Stop · stop \$85\.00/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Modify" })).not.toBeInTheDocument();
  });

  it("keeps the order type's own name on every other row", async () => {
    nextOrders = {
      available: true,
      asOf: "t",
      working: [{ ...exit, exitRole: undefined, replaceable: true }],
      recent: [],
    };
    render(withClient(<WorkingOrders deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText(/^Limit · limit \$95\.00/)).toBeInTheDocument());
  });
});
