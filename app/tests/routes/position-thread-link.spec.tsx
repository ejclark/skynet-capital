import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { DeskPosition } from "../../src/live/desk";
import { horizonSearch } from "../../src/live/horizon-params";
import { Route } from "../../src/routes/accounts";
import { useDefaultAccount } from "../../src/shell/default-account";
import { positionThread } from "../../src/shell/position-thread";

/**
 * A POSITION THREAD'S WAY BACK LANDS ON ITS OWN ACCOUNT (#7305, found auditing #7284). A thread is
 * drawn only on the member's own trading account, but its link used to be `/accounts#pos-<symbol>`
 * with no account in it, so a member whose default account is a bot tapped it and landed on the
 * bot's desk: the row was not there, or the bot's row with the same symbol opened instead. The link
 * now names the account the thread belongs to. Same real-router harness as `profile-door.spec.tsx`.
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
      // The server serves no ladder gate without an account (first-timer j1 s3).
      linked: accounts.length > 0,
      points: 0,
      totalPoints: 200,
      rank: "Observer",
      gate:
        accounts.length > 0 ? { reason: "feedback", note: "Fixture gate sentence." } : undefined,
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
rstest.mock("../../src/shell/heartbeat", () => ({ PlaybooksHeadLine: () => null }));
rstest.mock("../../src/shell/bot-playbooks", () => ({ BotPlaybooksSection: () => null }));
rstest.mock("../../src/shell/accounts-overview-section", () => ({
  OverviewSection: () => <p data-testid="overview">The book's overview</p>,
}));
rstest.mock("../../src/shell/events-section", () => ({
  EventsSection: () => <p data-testid="events">The book's events</p>,
}));
// The tower column's card has its own spec; here only where the column stands.
rstest.mock("../../src/shell/sauron-card", () => ({
  SauronCard: ({ under }: { under?: boolean }) => (
    <section data-testid="tower" data-under={under ? "true" : "false"} />
  ),
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
const SAURON = { id: "bot-sauron", name: "Sauron", kind: "bot", suspended: false };
const NVDA = { symbol: "NVDA", display: "NVDA" } as DeskPosition;
const accountName = () => screen.findByRole("button", { name: /^Account: / });

beforeEach(() => {
  accounts = [ERIC, SAURON];
  onboardingComplete = true;
  useDefaultAccount.getState().setDefault("bot-sauron");
});
afterEach(() => useDefaultAccount.getState().clearDefault());

describe("a position thread's link, for a member whose default account is a bot", () => {
  it("lands on the account that holds the thread, not the default", async () => {
    const { path } = positionThread(NVDA, "human-eric");
    const router = mountAccounts(path);
    expect(await accountName()).toHaveAccessibleName("Account: Eric");
    // the row's own anchor rides along, so the page still lands on and opens that row
    expect(router.state.location.hash).toBe("pos-NVDA");
  });

  it("keeps the thread's key on the row alone, whichever account it names", () => {
    expect(positionThread(NVDA, "human-eric").key).toBe("pos-NVDA");
  });

  it("leaves a link with no account in it on the member's default, as before", async () => {
    mountAccounts("/accounts");
    expect(await accountName()).toHaveAccessibleName("Account: Sauron");
  });
});
