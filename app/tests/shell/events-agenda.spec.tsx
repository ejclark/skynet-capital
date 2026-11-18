import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BookEvent } from "../../src/live/book-events";
import { horizonSearch } from "../../src/live/horizon-params";
import { AgendaRow } from "../../src/shell/events-agenda";

/**
 * A wait row's link on Events (#7438, found by the post-merge audit of #7423). The Overview draws
 * the wait line (`#book-wait`) for ONE account only, so on All accounts a link that kept
 * `account=all` landed on a page with no `#book-wait` at all, and every waiting account's row
 * carried the same href. The row must open the account that owns the wait — the event already
 * names it in `book.deskId`.
 */

const wait = (deskId: string): BookEvent => ({
  id: `wait-${deskId}`,
  date: "2026-11-20",
  title: "Your wait ends — the question is open again",
  tier: "decide",
  book: { deskId },
  touches: [],
});

afterEach(cleanup);

function mountAgenda(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet />, validateSearch: horizonSearch });
  const accounts = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts",
    validateSearch: (s: Record<string, unknown>) => s,
    component: () => (
      <ul>
        <AgendaRow event={wait("human-eric")} />
        <AgendaRow event={wait("sauron")} order={1} />
      </ul>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([accounts]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

const waitLinks = () => screen.findAllByRole("link", { name: "Your wait on the Overview →" });

describe("a wait row's link opens the account that waits (#7438)", () => {
  it("gives each waiting account on All accounts its own href, never account=all", async () => {
    mountAgenda("/accounts?account=all&section=events&on=2026-11-15&span=month");
    const hrefs = (await waitLinks()).map((a) => a.getAttribute("href") ?? "");
    expect(new Set(hrefs).size).toBe(2);
    for (const href of hrefs) {
      expect(href).not.toContain("account=all");
      expect(href).not.toContain("section=");
      expect(href.endsWith("#book-wait")).toBe(true);
    }
    expect(hrefs[0]).toContain("account=human-eric");
    expect(hrefs[1]).toContain("account=sauron");
  });

  it("lands the tap on that account's Overview, keeping the range", async () => {
    const router = mountAgenda("/accounts?account=all&section=events&on=2026-11-15&span=month");
    const [, sauron] = await waitLinks();
    if (!sauron) throw new Error("expected two wait rows");
    await userEvent.click(sauron);
    await waitFor(() => expect(router.state.location.hash).toBe("book-wait"));
    expect(router.state.location.search).toMatchObject({
      account: "sauron",
      on: "2026-11-15",
      span: "month",
    });
    expect(router.state.location.search).not.toHaveProperty("section");
  });
});
