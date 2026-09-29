import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import type { AccountNetWorthView, NetWorthStatsView } from "../../src/live/networth";
import { NetWorthRoster } from "../../src/shell/networth-summary";
import { NewHighCeremony } from "../../src/shell/new-high-ceremony";
import { sparkPath } from "../../src/shell/roster-sparkline";
import { setVantageFrame, useTowerBus } from "../../src/shell/tower-bus";

const stats = (aboveNow: number): NetWorthStatsView => ({
  value: "$1,051,200",
  valueKnown: true,
  dayChange: "+$3,368 · +0.32%",
  dayTone: "pos",
  dayKnown: true,
  cash: "$344,958",
  cashKnown: true,
  positionCount: 8,
  bookedPl: "+$12,480",
  bookedTone: "pos",
  bookedKnown: true,
  onPaper: "+$47,832",
  onPaperTone: "pos",
  onPaperKnown: true,
  windows: [
    {
      label: "1M",
      note: "the last month",
      value: "+4.60%",
      tone: "pos",
      known: true,
      vsBenchmark: "+2.3 pts vs S&P",
      vsBenchmarkTone: "pos",
    },
  ],
  allTimeHigh: { value: "$1,051,200", at: "9/24", aboveNow },
});

function mount(s: NetWorthStatsView) {
  const rootRoute = createRootRoute({
    component: () => <NewHighCeremony accountId="eric" caption="Eric" stats={s} />,
  });
  const board = createRoute({ getParentRoute: () => rootRoute, path: "/leaderboard" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([board]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

// The new-high ceremony (#3689 slice 10, handoff 2c).
describe("NewHighCeremony", () => {
  beforeEach(() => window.localStorage.clear());

  it("takes over the page at a new all-time high", async () => {
    mount(stats(0));
    expect(await screen.findByRole("dialog", { name: "$1,051,200" })).toBeInTheDocument();
    expect(screen.getByText("New all-time high · Eric")).toBeInTheDocument();
    expect(screen.getByText("+4.60% · +2.3 pts vs S&P")).toBeInTheDocument();
  });

  it("shows once per high: after closing, the same high doesn't replay", async () => {
    const first = mount(stats(0));
    fireEvent.click(await screen.findByRole("button", { name: "Back to Accounts" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    first.unmount();
    mount(stats(0));
    await screen.findByText((_, el) => el?.tagName === "BODY");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    mount(stats(0));
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays quiet below the high", async () => {
    mount(stats(0.003));
    await screen.findByText((_, el) => el?.tagName === "BODY");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// The tower hears about it (#3807 slice 3b-3): once, as the member leaves the takeover and the tower
// is back in view — never while it covers the page, never for a high already seen.
describe("NewHighCeremony tells the tower", () => {
  function crest() {
    const flares: unknown[] = [];
    const frame = document.createElement("iframe");
    Object.defineProperty(frame, "contentWindow", {
      value: { postMessage: (m: { type: string }) => m.type === "tower:flare" && flares.push(m) },
    });
    setVantageFrame(frame);
    useTowerBus.setState({ on: true });
    return flares;
  }
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    setVantageFrame(null);
    useTowerBus.setState({ on: false });
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("flares once as the takeover closes — not while it covers the page", async () => {
    const flares = crest();
    mount(stats(0));
    await screen.findByRole("dialog");
    expect(flares).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Back to Accounts" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(flares).toEqual([{ type: "tower:flare", kind: "new-high" }]);
  });

  it("stays dark for a high already seen", async () => {
    window.localStorage.setItem("skynet.newhigh.seen.eric", "$1,051,200");
    const flares = crest();
    mount(stats(0));
    await screen.findByText((_, el) => el?.tagName === "BODY");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(flares).toEqual([]);
  });

  it("stays dark under reduced motion — the takeover still shows and closes", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (q: string) => ({ matches: q.includes("reduce"), media: q }),
    });
    const flares = crest();
    mount(stats(0));
    fireEvent.click(await screen.findByRole("button", { name: "Back to Accounts" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(flares).toEqual([]);
  });
});

describe("NetWorthRoster (#3689 slice 10)", () => {
  const row = (id: string, idlePct: number): AccountNetWorthView => ({
    ...stats(0.1),
    id,
    name: id,
    kind: id === "Eric" ? "human" : "bot",
    idle: `${idlePct}% idle`,
    idlePct,
  });

  it("shows the month against the S&P, deployed · idle, and how many decisions wait", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <NetWorthRoster
          accounts={[row("Eric", 33), row("Sauron", 5)]}
          decisionsById={new Map([["Eric", 2]])}
        />
      </QueryClientProvider>,
    );
    expect(screen.getAllByText("+2.3 pts vs S&P")).toHaveLength(2);
    expect(screen.getByText("33% idle")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Eric/ })).toHaveTextContent("2");
    expect(screen.getByRole("row", { name: /Sauron/ })).toHaveTextContent("—");
  });
});

describe("sparkPath", () => {
  it("draws a month into the 88×24 box, and nothing for fewer than two points", () => {
    expect(sparkPath([0, 0.02, 0.01])).toMatch(/^M0\.0 .* L88\.0 /);
    expect(sparkPath([0.01])).toBe("");
  });
});
