import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { DeskActivity } from "../../src/live/desk";
import { FormStrip } from "../../src/shell/form-strip";

function mount(activity: DeskActivity) {
  const rootRoute = createRootRoute({ component: () => <FormStrip accountId="human-eric" /> });
  const accounts = createRoute({ getParentRoute: () => rootRoute, path: "/accounts" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([accounts]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["desk-activity", "human-eric"], activity);
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

const close = (orderId: string, tone: "pos" | "neg", pl: string, at: string) => ({
  orderId,
  symbol: "TSLA",
  display: "TSLA Oct 17 400 Put",
  side: "sell" as const,
  quantity: 1,
  filled: 1,
  price: "$1.00",
  status: "filled",
  at,
  backfilled: false,
  origin: "desk" as const,
  realizedPl: pl,
  realizedTone: tone,
});

describe("FormStrip", () => {
  it("draws each close as a ✓/✕ link to its Activity row, named in words", async () => {
    mount({
      available: true,
      activity: [
        close("o3", "pos", "+$696", "2026-09-22T15:00:00"),
        close("o2", "pos", "+$120", "2026-09-19T15:00:00"),
        close("o1", "neg", "-$310", "2026-09-17T15:00:00"),
      ],
    });
    const win = await screen.findByRole("link", {
      name: "Closed 9/22, win: TSLA Oct 17 400 Put, +$696. Open this trade",
    });
    expect(win).toHaveAttribute("href", "/accounts?account=human-eric&section=activity#act-o3");
    expect(win).toHaveTextContent("✓");
    expect(screen.getByRole("link", { name: /Closed 9\/17, loss/ })).toHaveTextContent("✕");
    expect(screen.getByText("2 wins in a row")).toBeInTheDocument();
  });

  it("renders nothing before the first close", async () => {
    mount({ available: true, activity: [] });
    await screen.findByText((_, el) => el?.tagName === "BODY");
    expect(screen.queryByText("Form")).not.toBeInTheDocument();
  });
});
