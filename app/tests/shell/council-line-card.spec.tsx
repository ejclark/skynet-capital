import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { CouncilWeek } from "../../src/live/council";
import { CouncilLineCard } from "../../src/shell/council-line-card";

/**
 * Your council line on the Profile Overview (#3963) — the write beside your standing, where the IA
 * put it (`docs/IA.md` §5.7). Behavioral only: what a member sees on the card, and what it refuses
 * to claim when the Council is unwired or unreachable.
 */

const line = { id: "mine1", text: "NVDA runs into the print.", at: "2026-09-29T10:00:00.000Z" };

const wired: CouncilWeek = {
  enabled: true,
  week: "2026-W40",
  entries: [{ id: "other1", text: "Someone else's line.", at: "2026-09-29T09:00:00.000Z" }, line],
  mine: line,
  plays: [],
};

let week: CouncilWeek | Error = wired;
let reads = 0;

rstest.mock("../../src/live/council", () => ({
  fetchCouncil: () => {
    reads += 1;
    return week instanceof Error ? Promise.reject(week) : Promise.resolve(week);
  },
  submitThesis: () => Promise.resolve({ ok: true }),
}));

function mount(ui: ReactElement) {
  const rootRoute = createRootRoute({ component: () => ui });
  const activity = createRoute({ getParentRoute: () => rootRoute, path: "/activity" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([activity]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  // retry: false so the unreachable case resolves in this test's lifetime, not after the default
  // backoff ladder.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

describe("CouncilLineCard", () => {
  beforeEach(() => {
    week = wired;
    reads = 0;
  });

  it("carries the member's own line for the week, with a way to edit it", async () => {
    mount(<CouncilLineCard />);
    expect(await screen.findByRole("region", { name: "Your council line" })).toBeInTheDocument();
    expect(screen.getByText("2026-W40")).toBeInTheDocument();
    expect(screen.getByLabelText("Your council line for the week")).toHaveValue(
      "NVDA runs into the print.",
    );
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
  });

  it("says the line belongs to the member, not to the account on screen", async () => {
    mount(<CouncilLineCard />);
    expect(await screen.findByText(/yours as a member, not this account's/)).toBeInTheDocument();
  });

  it("keeps everyone else's lines on Activity → Council, one link away", async () => {
    mount(<CouncilLineCard />);
    expect(await screen.findByRole("link", { name: /Everyone's lines/ })).toHaveAttribute(
      "href",
      "/activity?section=council",
    );
    expect(screen.queryByText("Someone else's line.")).not.toBeInTheDocument();
  });

  it("stays quiet rather than showing a dead composer when the Council is unwired", async () => {
    week = { enabled: false, entries: [], plays: [] };
    const { container } = mount(<CouncilLineCard />);
    await waitFor(() => expect(reads).toBe(1));
    await waitFor(() => expect(container.querySelector(".council-mine")).toBeNull());
  });

  it("owns up to being unreachable instead of showing an empty line", async () => {
    week = new Error("council 500");
    mount(<CouncilLineCard />);
    expect(
      await screen.findByText("Your council line is unreachable right now."),
    ).toBeInTheDocument();
  });
});
