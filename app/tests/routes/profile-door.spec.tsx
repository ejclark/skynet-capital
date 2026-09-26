import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { horizonSearch } from "../../src/live/horizon-params";
import { Route } from "../../src/routes/accounts";

/**
 * The Profile page's two viewer-level sections and its zero-account door (#3807 slice 2b). The page
 * renders through a real memory-history router so `Route.useSearch()` and the navigate calls are
 * the real ones; the data layer is mocked so the tree stays small (the calendar head and the book's
 * sections are stubbed — they have their own specs).
 */

let accounts: unknown[] = [];
let onboardingComplete = false;

const step = (id: string, title: string, done: boolean) => ({
  id,
  title,
  detail: `${title} — fixture detail.`,
  points: 10,
  route: "/app/accounts?section=milestones&chapter=onboarding",
  done,
});

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () => Promise.resolve({ accounts }),
  ownsAccount: () => true,
}));
rstest.mock("../../src/live/onboarding", () => ({
  fetchOnboarding: () =>
    Promise.resolve({
      linked: true,
      viewerName: "Robin",
      milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
      steps: [
        step("connect", "Connect your Alpaca paper account", accounts.length > 0),
        step("first-message", "Say hello to Moneypenny", onboardingComplete),
        step("first-trade", "Make your first trade", onboardingComplete),
      ],
      done: onboardingComplete ? 3 : accounts.length > 0 ? 1 : 0,
      total: 3,
      points: 0,
      totalPoints: 30,
      complete: onboardingComplete,
    }),
}));
rstest.mock("../../src/live/learn", () => ({
  fetchJourney: () =>
    Promise.resolve({
      linked: true,
      points: 0,
      totalPoints: 200,
      rank: "Observer",
      gate: { reason: "feedback", note: "Fixture gate sentence." },
      courses: [],
      celebrating: [],
      engagementCelebrating: [],
      pendingChecks: 0,
    }),
  claimMilestones: () => Promise.resolve({ ok: true }),
}));
rstest.mock("../../src/live/playbooks", () => ({
  fetchPlaybooks: () =>
    Promise.resolve({
      linked: true,
      milestone: { id: "playbooks", code: "M·03", title: "Playbooks", desc: "" },
      arming: "season-1",
      unlocked: 0,
      total: 4,
      playbooks: [],
    }),
}));
rstest.mock("../../src/live/join", () => ({
  fetchJoin: () => Promise.resolve({ wired: true, canAddBots: false, classes: [], timezones: [] }),
}));
rstest.mock("../../src/live/feedback", () => ({
  fetchFeedbackIndex: () =>
    Promise.resolve({
      enabled: true,
      feedbackCount: 0,
      celebrating: [],
      recent: [],
      followupEnabled: false,
      appVersion: "test",
    }),
}));
rstest.mock("../../src/live/options", () => ({
  fetchPlays: () => Promise.resolve({ linked: true, wheels: false, plays: [] }),
}));
rstest.mock("../../src/live/networth", () => ({
  fetchNetWorth: () => Promise.reject(new Error("not used in this spec")),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDesk: (id: string) => Promise.resolve({ desk: { id, positions: [] } }),
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
}));
rstest.mock("../../src/shell/cockpit-clock", () => ({
  CockpitClock: () => null,
  usePhoneWidth: () => false,
}));
rstest.mock("../../src/shell/heartbeat", () => ({
  HeartbeatChip: () => null,
  HeartbeatSection: () => null,
}));
rstest.mock("../../src/shell/accounts-overview-section", () => ({
  OverviewSection: () => <p data-testid="overview">The book's overview</p>,
}));
rstest.mock("../../src/shell/events-section", () => ({
  EventsSection: () => <p data-testid="events">The book's events</p>,
}));
rstest.mock("../../src/shell/alpaca-guide", () => ({
  AlpacaGuide: () => <p data-testid="connect-guide">The five-step connect guide</p>,
}));

function mountAccounts(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet />, validateSearch: horizonSearch });
  const accountsRoute = Route.update({
    id: "/accounts",
    path: "/accounts",
    getParentRoute: () => rootRoute,
  } as never);
  const router = createRouter({
    routeTree: rootRoute.addChildren([accountsRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const ERIC = { id: "human-eric", name: "Eric", kind: "human", suspended: false };
const pressed = () =>
  within(screen.getByRole("group", { name: "On this page" }))
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-pressed") === "true")
    .map((b) => b.textContent);

beforeEach(() => {
  accounts = [];
  onboardingComplete = false;
});

describe("the zero-account door", () => {
  it("renders the Profile page, opened on Milestones with the connect guide, never a dead end", async () => {
    mountAccounts("/accounts");
    expect(await screen.findByText(/No account linked yet/)).toBeInTheDocument();
    expect(await screen.findByTestId("connect-guide")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome to the league, Robin" })).toBeVisible();
    // No switcher to pick from, no Overview to open, and no link back out to a redirect.
    expect(screen.queryByRole("combobox", { name: "Account" })).toBeNull();
    expect(pressed()).toEqual(["Milestones"]);
    expect(screen.queryByRole("button", { name: "Overview" })).toBeNull();
    expect(document.querySelector('a[href*="/onboarding"]')).toBeNull();
  });

  it("gives Activity an honest empty state", async () => {
    mountAccounts("/accounts?section=activity");
    expect(await screen.findByText(/No account linked yet — its orders/)).toBeInTheDocument();
  });
});

describe("the Profile page's default and its viewer-level sections", () => {
  it("opens a linked member on the Overview even while onboarding is open (their book first)", async () => {
    accounts = [ERIC];
    mountAccounts("/accounts");
    expect(await screen.findByTestId("overview")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Account" })).toBeInTheDocument();
    expect(pressed()).toEqual(["Overview"]);
  });

  it("hides the switcher on Milestones with a line why, and round-trips to the Overview", async () => {
    accounts = [ERIC];
    onboardingComplete = true;
    const router = mountAccounts("/accounts");
    expect(await screen.findByTestId("overview")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Milestones" }));
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ section: "milestones" }),
    );
    expect(await screen.findByText("Your milestones — the same on every account.")).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Account" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Overview" }));
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("section"));
    expect(screen.getByRole("combobox", { name: "Account" })).toBeInTheDocument();
  });

  it("opens a chapter beneath the cards from its card, and closes it leaving the section", async () => {
    accounts = [ERIC];
    onboardingComplete = true;
    const router = mountAccounts("/accounts?section=milestones");
    await userEvent.click(await screen.findByRole("link", { name: /M·03/ }));
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        section: "milestones",
        chapter: "playbooks",
      }),
    );
    expect(await screen.findByRole("heading", { name: "Prove the play by hand, then arm it" }));
    expect(screen.getByRole("link", { name: /M·03/ })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: "Feedback" }));
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("chapter"));
    expect(await screen.findByRole("button", { name: "✦ Talk to Moneypenny" })).toBeVisible();
    expect(screen.getByText("Your filings — the same on every account.")).toBeVisible();
  });

  it("says the ladder's gate in the server's words (#1672's fix, regressed, restored)", async () => {
    accounts = [ERIC];
    mountAccounts("/accounts?section=milestones");
    expect(
      await screen.findByText(/unlocks the moment you say hello to Moneypenny/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/after your first feedback filing/)).toBeNull();
  });
});
