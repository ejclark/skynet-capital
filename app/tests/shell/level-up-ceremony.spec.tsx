import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { JourneyCourse, LevelUp } from "../../src/live/learn";
import { LevelUpCeremony } from "../../src/shell/level-up-ceremony";
import { setVantageFrame, useTowerBus } from "../../src/shell/tower-bus";
import { UnlockBanner } from "../../src/shell/unlock-gate";

/**
 * The level-up ceremony (#469): the server's `graduated` cue, handed back to the member who
 * claimed, opens a takeover on the shared shell — once per cue id, colour-blind safe, and the
 * tower's Eye flares as the member leaves it.
 */

const course = (level: number, done: number, locked = false): JourneyCourse => ({
  level,
  title: `Course ${level} title`,
  subtitle: "",
  locked,
  done,
  total: 2,
  milestones: [
    {
      id: `m-${level}-a`,
      title: level === 200 ? "Sell your first cash-secured put" : `m ${level} a`,
      detail: "",
      points: 35,
      earned: done > 0 ? { on: "9/28", orderId: "o1" } : undefined,
    },
    {
      id: `m-${level}-b`,
      title: level === 200 ? "Sell your first covered call" : `m ${level} b`,
      detail: "",
      points: 35,
      earned: done > 1 ? { on: "9/30", orderId: "o2" } : undefined,
    },
  ],
});
const COURSES = [course(100, 2), course(200, 2), course(300, 0), course(400, 0, true)];

const up200: LevelUp = {
  id: "graduated:human-eric:200",
  level: 200,
  title: "The Wheel — get paid to own good stocks",
  opens: { level: 300, title: "Directional options — buying calls & puts" },
};

function mount(levelUps: readonly LevelUp[]) {
  const rootRoute = createRootRoute({
    component: () => <LevelUpCeremony levelUps={levelUps} courses={COURSES} />,
  });
  const accounts = createRoute({ getParentRoute: () => rootRoute, path: "/accounts" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([accounts]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

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
});

describe("LevelUpCeremony", () => {
  it("takes over the page with the course finished and the one it opened", async () => {
    mount([up200]);
    expect(await screen.findByRole("dialog", { name: "Course 200 ✓" })).toBeInTheDocument();
    expect(screen.getByText("The Wheel — get paid to own good stocks — complete.")).toBeVisible();
    expect(screen.getByText(/course 300 is open/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See Course 300 ↗" })).toBeInTheDocument();
    const proved = screen.getByRole("list", { name: "What you did to finish it" });
    expect(within(proved).getByText(/Sell your first covered call/)).toBeInTheDocument();
  });

  it("says every rung's state in a shape AND a word, never colour alone", async () => {
    mount([up200]);
    const ladder = await screen.findByRole("list", { name: "Your ladder" });
    const rungs = within(ladder).getAllByRole("listitem");
    expect(rungs.map((r) => r.textContent)).toEqual([
      "▲100done",
      "▲200just now",
      "△300open",
      "·400locked",
    ]);
  });

  it("names no next course after the top one", async () => {
    mount([{ id: "graduated:human-eric:500", level: 500, title: "Zero-DTE — the fastest clock" }]);
    await screen.findByRole("dialog", { name: "Course 500 ✓" });
    expect(screen.getByText(/the whole ladder is yours/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows once per cue: after leaving, the same level-up doesn't replay", async () => {
    const first = mount([up200]);
    fireEvent.click(await screen.findByRole("button", { name: "Back to Milestones" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("skynet.levelup.seen.graduated:human-eric:200")).not.toBe(
      null,
    );
    first.unmount();
    mount([up200]);
    await screen.findByText((_, el) => el?.tagName === "BODY");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps its own seen key — a new-high already seen doesn't silence it", async () => {
    window.localStorage.setItem("skynet.newhigh.seen.eric", "$1,051,200");
    mount([up200]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("shows the highest of several at once and marks them all seen", async () => {
    const up100: LevelUp = { id: "graduated:human-eric:100", level: 100, title: "Stock basics" };
    mount([up100, up200]);
    await screen.findByRole("dialog", { name: "Course 200 ✓" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("skynet.levelup.seen.graduated:human-eric:100")).not.toBe(
      null,
    );
  });

  it("renders nothing without a level-up", async () => {
    mount([]);
    await screen.findByText((_, el) => el?.tagName === "BODY");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("flares the tower once as the member leaves — not while it covers the page", async () => {
    const flares = crest();
    mount([up200]);
    await screen.findByRole("dialog");
    expect(flares).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Back to Milestones" }));
    expect(flares).toEqual([{ type: "tower:flare", kind: "milestone" }]);
  });
});

describe("a claim that finishes a course", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("hands its level-ups on and leaves the flare to the takeover", async () => {
    const flares = crest();
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: true, graduated: [up200] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof globalThis.fetch;
    const got: (readonly LevelUp[])[] = [];
    render(
      <UnlockBanner
        celebrations={[{ milestoneId: "m-202", code: "202", name: "Covered call" }]}
        onClaimed={(ups) => got.push(ups)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Claim 🎉" }));
    await waitFor(() => expect(got).toEqual([[up200]]));
    expect(flares).toEqual([]);
  });
});
