import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { DeskAllocation } from "../../src/live/desk";
import type { OptionBookGreeks } from "../../src/live/options";
import { decayLine, exposureLine, MoneyStrip } from "../../src/shell/money-strip";

const book = (over: Partial<OptionBookGreeks> = {}): OptionBookGreeks => ({
  delta: 224,
  gamma: 3.1,
  theta: -100.4,
  vega: 42,
  covered: 3,
  total: 3,
  uncovered: [],
  ...over,
});

// "Where your money is" (#3689 slice 5): the greeks a beginner reads in plain words.
describe("decayLine", () => {
  it("says what the options lose a day, and says 'none' without options", () => {
    expect(decayLine(book(), true)).toBe("−$100/day");
    expect(decayLine(undefined, false)).toBe("none");
  });
  it("owns up to a partial book and to no book at all", () => {
    expect(decayLine(book({ covered: 2 }), true)).toBe("−$100/day (2 of 3 quoted)");
    expect(decayLine(book({ covered: 0 }), true)).toBe("—");
    expect(decayLine(undefined, true)).toBe("—");
  });
});

describe("exposureLine", () => {
  it("adds the shares held to the options' share-equivalent delta", () => {
    expect(exposureLine(3200, book(), true)).toBe("≈ 3,424 shares");
    expect(exposureLine(300, undefined, false)).toBe("≈ 300 shares");
  });
  it("won't pass off part of the book as all of it", () => {
    expect(exposureLine(3200, book({ covered: 1 }), true)).toBe("≈ 3,424 shares (partial)");
    expect(exposureLine(3200, undefined, true)).toBe("—");
  });
});

describe("MoneyStrip", () => {
  const allocation: DeskAllocation = {
    shares: "$580,120",
    options: "$27,300",
    cash: "$344,958",
    sharesPct: 61,
    optionsPct: 2.9,
    cashPct: 36.1,
    cashShare: "36.1%",
    shareCount: 3200,
  };

  const renderStrip = (a: DeskAllocation) => {
    const rootRoute = createRootRoute({
      component: () => <MoneyStrip accountId="eric" allocation={a} hasOptions={false} />,
    });
    const profile = createRoute({ getParentRoute: () => rootRoute, path: "/accounts" });
    const router = createRouter({
      routeTree: rootRoute.addChildren([profile]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router as never} />
      </QueryClientProvider>,
    );
  };

  // #4948: a written put used to read "Options $0" here, as though nothing were owed.
  it("names a sold option's liability in words, never 'Options $0'", async () => {
    renderStrip({ ...allocation, options: "$0", optionsPct: 0, optionsSold: "-$310" });
    await screen.findByRole("region", { name: "Where your money is" });
    const sold = screen.getByText("-$310");
    expect(sold.closest("li")).toHaveTextContent("Sold options -$310");
    // The phone card hides the rest of the legend but keeps this line (the bar can't draw it).
    expect(sold.closest("li")).toHaveClass("money-legend-sold");
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
  });

  it("shows held and sold options side by side when the book has both", async () => {
    renderStrip({ ...allocation, optionsSold: "-$310" });
    await screen.findByRole("region", { name: "Where your money is" });
    expect(screen.getByText("$27,300").closest("li")).toHaveTextContent("Options $27,300");
    expect(screen.getByText("-$310").closest("li")).toHaveTextContent("Sold options -$310");
  });

  it("names every slice in words and points idle cash at the Playbooks chapter", async () => {
    renderStrip(allocation);
    expect(await screen.findByRole("region", { name: "Where your money is" })).toBeInTheDocument();
    expect(screen.getByText("$580,120")).toBeInTheDocument();
    expect(screen.getByText("36.1% of your account")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /See plays that fit your playbooks/ })).toHaveAttribute(
      "href",
      "/accounts?section=milestones&chapter=playbooks",
    );
    expect(screen.getByRole("button", { name: "Time decay" })).toBeInTheDocument();
    expect(screen.getByText("none")).toBeInTheDocument();
    expect(screen.getByText("≈ 3,200 shares")).toBeInTheDocument();
  });
});
