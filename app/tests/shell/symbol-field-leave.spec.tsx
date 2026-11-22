import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SymbolField } from "../../src/shell/symbol-field";

/**
 * Leaving the symbol field by tapping something that navigates (#7954, found by the post-merge
 * audit of #7672). The field's blur commit writes `?symbol=` the way the Trade route's
 * `commitSymbol` does — a `/trade` navigate with no `to`. When that commit ran AFTER the tap's own
 * click, it bounced a member who tapped a top-bar link back to Trade, and on a Buy/Sell flip it
 * landed the symbol in the URL only after the new ticket had mounted without it. The commit now
 * runs at the start of that click, so the click's own navigation is the last word.
 *
 * The harness mirrors the real shape without the Trade route's data layer: a root with a top-bar
 * `<Link>`, a `/trade` page whose ticket remounts per `?play=` (the side flip) and seeds its Symbol
 * box from `?symbol=`, and the same `replace` + search-function navigate `commitSymbol` uses.
 */

function mount() {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <Link to="/accounts">Profile</Link>
        <Outlet />
      </>
    ),
  });
  const trade = createRoute({
    getParentRoute: () => rootRoute,
    path: "/trade",
    validateSearch: (search: Record<string, unknown>) =>
      search as { play?: string; symbol?: string; qty?: string },
    component: function TradePage() {
      const { play, symbol } = trade.useSearch();
      const navigate = trade.useNavigate();
      return (
        <Ticket
          key={play ?? "101"}
          initialSymbol={symbol ?? ""}
          onSymbolCommit={(s) => {
            if (s === symbol) return;
            void navigate({
              replace: true,
              resetScroll: false,
              search: (prev) => ({ ...prev, symbol: s }),
            });
          }}
          onSell={() =>
            void navigate({ resetScroll: false, search: (prev) => ({ ...prev, play: "102" }) })
          }
        />
      );
    },
  });
  const accounts = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts",
    component: () => <p>Profile page</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([trade, accounts]),
    history: createMemoryHistory({ initialEntries: ["/trade"] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

function Ticket({
  initialSymbol,
  onSymbolCommit,
  onSell,
}: {
  readonly initialSymbol: string;
  readonly onSymbolCommit: (s: string) => void;
  readonly onSell: () => void;
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  return (
    <form>
      <SymbolField
        id="sym"
        label="Symbol"
        value={symbol}
        onChange={setSymbol}
        onCommit={onSymbolCommit}
      />
      <button type="button" onClick={onSell}>
        Sell
      </button>
    </form>
  );
}

/** Past the field's 600ms backstop, so a commit that was going to run late has run. */
const settle = () => act(() => new Promise((r) => setTimeout(r, 700)));

describe("leaving the symbol field by a tap that navigates (#7954)", () => {
  it("a mouse click on a top-bar link lands on that page, not back on Trade", async () => {
    const router = mount();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Symbol"), "NVDA");
    await user.click(screen.getByRole("link", { name: "Profile" }));
    await settle();
    expect(router.state.location.pathname).toBe("/accounts");
    expect(screen.getByText("Profile page")).toBeInTheDocument();
  });

  it("a touch tap on a top-bar link lands on that page, not back on Trade", async () => {
    const router = mount();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Symbol"), "NVDA");
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("link", { name: "Profile" }) });
    await settle();
    expect(router.state.location.pathname).toBe("/accounts");
  });

  it("flipping to Sell carries the typed symbol into the new ticket", async () => {
    const router = mount();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Symbol"), "NVDA");
    await user.click(screen.getByRole("button", { name: "Sell" }));
    await settle();
    expect(router.state.location.search).toEqual({ play: "102", symbol: "NVDA" });
    expect(screen.getByLabelText("Symbol")).toHaveValue("NVDA");
  });

  it("tabbing out still commits the symbol, on the next tick", async () => {
    const router = mount();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Symbol"), "nvda");
    await user.tab();
    await settle();
    expect(router.state.location.search).toEqual({ symbol: "NVDA" });
  });
});
