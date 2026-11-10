import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { compareSplit } from "../../../src/observatory/target-split";
import type { DeskAllocation } from "../../src/live/desk";
import { gapLabel, MoneyTarget, rebalanceLine } from "../../src/shell/money-target";

/**
 * Overview's money row against the member's target split (#4607 slice 2). What it must never get
 * wrong: no target means one link and nothing else; an unreadable book shows "—", never a gap from
 * part of it; over and under ride an arrow and a word; trim and add are said in dollars.
 */

let read: unknown = { wired: true, target: null };

beforeEach(() => {
  read = { wired: true, target: null };
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify(read), { status: 200 }))) as typeof fetch;
});

const target = { sharesPct: 60, optionsPct: 15, cashPct: 25, tolerancePct: 5, updatedAt: "x" };

// $41,000 on the bar: shares $20,500 (50%), options $10,250 (25%), cash $10,250 (25%).
const allocation: DeskAllocation = {
  shares: "$20,500",
  options: "$10,250",
  cash: "$10,250",
  sharesPct: 50,
  optionsPct: 25,
  cashPct: 25,
  cashShare: "25.0%",
  shareCount: 100,
  totalRaw: 41_000,
};

function mount(a: DeskAllocation, bookReadable = true): void {
  const rootRoute = createRootRoute({
    component: () => <MoneyTarget allocation={a} bookReadable={bookReadable} />,
  });
  const settings = createRoute({ getParentRoute: () => rootRoute, path: "/settings" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([settings]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

describe("rebalanceLine", () => {
  it("names one trim and one add of the same dollars as 'add it to'", () => {
    const c = compareSplit({ ...allocation, total: 41_000 }, target);
    expect(c && rebalanceLine(c, 5)).toBe(
      "To match your target, trim $4,100 of options and add it to shares.",
    );
  });

  it("names every move in dollars when more than one slice is off", () => {
    const c = compareSplit({ sharesPct: 40, optionsPct: 30, cashPct: 30, total: 10_000 }, target);
    expect(c && rebalanceLine(c, 5)).toBe(
      "To match your target, trim $1,500 of options and $500 of cash, and add $2,000 to shares.",
    );
  });

  it("says the book is on target when every slice is within the tolerance", () => {
    const c = compareSplit({ sharesPct: 58, optionsPct: 17, cashPct: 25, total: 10_000 }, target);
    expect(c && rebalanceLine(c, 5)).toBe("Every slice is within 5 points of your target ✓");
  });
});

describe("gapLabel", () => {
  it("carries over and under in an arrow and a word, never a hue alone", () => {
    const c = compareSplit({ ...allocation, total: 41_000 }, target);
    expect(c?.slices.map(gapLabel)).toEqual([
      "▼ under · add $4,100",
      "▲ over · trim $4,100",
      "✓ within",
    ]);
  });
});

describe("MoneyTarget", () => {
  it("offers one link to set a target when the member has none", async () => {
    mount(allocation);
    const link = await screen.findByRole("link", { name: /Set a target split/ });
    expect(link).toHaveAttribute("href", "/settings?section=target");
    expect(screen.queryByRole("region", { name: "Against your target split" })).toBeNull();
  });

  it("shows each slice beside its target, and what to trim or add in dollars", async () => {
    read = { wired: true, target };
    mount(allocation);
    const region = await screen.findByRole("region", { name: "Against your target split" });
    const shares = within(region).getByText("target 60%").closest("li") as HTMLElement;
    expect(shares).toHaveTextContent("Shares50%target 60%▼ under · add $4,100");
    expect(region).toHaveTextContent(
      "To match your target, trim $4,100 of options and add it to shares.",
    );
    expect(region).toHaveTextContent("never an order");
    expect(within(region).getByRole("link", { name: /Change target/ })).toBeInTheDocument();
  });

  it("shows '—' and no gap while the book can't be read", async () => {
    read = { wired: true, target };
    mount(allocation, false);
    const region = await screen.findByRole("region", { name: "Against your target split" });
    expect(within(region).getAllByText("—")).toHaveLength(6);
    expect(region).not.toHaveTextContent("trim");
    expect(region).toHaveTextContent("target 60%");
  });

  it("shows '—' rather than guess when an older server sent no dollar total", async () => {
    read = { wired: true, target };
    const { totalRaw: _dropped, ...older } = allocation;
    mount(older);
    const region = await screen.findByRole("region", { name: "Against your target split" });
    expect(region).not.toHaveTextContent("$4,100");
  });

  it("renders nothing where the target split isn't wired", async () => {
    read = { wired: false, target: null };
    mount(allocation);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("link", { name: /Set a target split/ })).toBeNull();
    expect(screen.queryByRole("region", { name: "Against your target split" })).toBeNull();
  });
});
