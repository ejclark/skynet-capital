import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { OrdersSection } from "../../src/shell/orders-section";

/**
 * The Orders pane on a degraded desk (#8392): a failed broker read answers `positions: []` with an
 * `error`, and the pane hands that error to the option positions card so it still asks the route
 * and says the read failed — instead of dropping the card as though no options were held.
 */

let deskError: string | undefined;
const optionCalls: string[] = [];
rstest.mock("../../src/live/desk", () => ({
  fetchDesk: (id: string) =>
    Promise.resolve({
      generatedAt: "2026-11-24T15:00:00Z",
      desk: {
        id,
        name: "Eric",
        kind: "human",
        positions: [],
        ...(deskError ? { error: deskError } : {}),
      },
    }),
}));
rstest.mock("../../src/live/options", () => ({
  fetchOptionPositions: (id: string) => {
    optionCalls.push(id);
    return Promise.resolve({ available: false, reason: "read-failed", rows: [] });
  },
}));
rstest.mock("../../src/shell/working-orders", () => ({ WorkingOrders: () => null }));
rstest.mock("../../src/shell/desk-alerts", () => ({ DeskAlerts: () => null }));
rstest.mock("../../src/shell/option-lifecycle-card", () => ({ OptionLifecycleCard: () => null }));

function pane() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <OrdersSection deskId="human-eric" />
    </QueryClientProvider>
  );
}

describe("OrdersSection — a desk whose broker read failed (#8392)", () => {
  beforeEach(() => {
    optionCalls.length = 0;
  });

  it("shows the Option positions card with the read-failed sentence", async () => {
    deskError = "Error: broker read timed out after 8000ms";
    render(pane());
    await waitFor(() =>
      expect(screen.getByText(/The broker read for this account failed/)).toBeInTheDocument(),
    );
    expect(optionCalls).toEqual(["human-eric"]);
  });

  it("never asks the option route for a desk that read fine and holds no options", async () => {
    deskError = undefined;
    const { container } = render(pane());
    await waitFor(() => expect(container.querySelector(".orders-section")).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(optionCalls).toEqual([]);
    expect(screen.queryByRole("region", { name: "Option positions" })).toBeNull();
  });
});
