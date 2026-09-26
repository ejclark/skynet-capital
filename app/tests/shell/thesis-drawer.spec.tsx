import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskThesis } from "../../src/live/desk";
import type { SettingsIndex } from "../../src/live/settings";
import {
  STEERING_RULES_UNAVAILABLE_REASON,
  SUBSCRIBE_BOT_UNAVAILABLE_REASON,
  ThesisDrawer,
} from "../../src/shell/thesis-drawer";

/**
 * `ThesisDrawer`'s degrade branches and rendered fields (#3186 slices 4a + 4b) — same doctrine as
 * `hero-chart.spec.tsx`: most cases return BEFORE `mountThesisChart`'s `createChart` call, which
 * throws under happy-dom; the real chart mount is covered by `thesis-chart-mount.spec.ts`. The
 * marker-reasoning cases need `equity.length > 0` to reach `MarkerList` at all, so those mock
 * `mountThesisChart` itself to a no-op rather than touching the real canvas mount.
 */

let nextThesis: DeskThesis = { available: false, kind: "bot" };
let thesisShouldFail = false;
let nextSettings: SettingsIndex = {
  authConfigured: true,
  adminWired: false,
  accounts: [],
  fleetSuspended: false,
  timezones: [],
};

rstest.mock("../../src/live/desk", () => ({
  fetchDeskThesis: () =>
    thesisShouldFail ? Promise.reject(new Error("down")) : Promise.resolve(nextThesis),
}));

rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () => Promise.resolve(nextSettings),
}));

// The fill markers are router Links (#3807 slice 2d); no router here, so render their href.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    search,
    hash,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    hash?: string;
  }) => {
    const path = params?.id ? to.replace("$id", params.id) : to;
    const query = search ? `?${new URLSearchParams(search).toString()}` : "";
    return <a href={`${path}${query}${hash ? `#${hash}` : ""}`}>{children}</a>;
  },
}));

rstest.mock("../../src/shell/thesis-chart-mount", () => ({
  mountThesisChart: () => ({ dispose: () => undefined }),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

beforeEach(() => {
  thesisShouldFail = false;
  nextThesis = { available: false, kind: "bot" };
  nextSettings = {
    authConfigured: true,
    adminWired: false,
    accounts: [],
    fleetSuspended: false,
    timezones: [],
  };
});

describe("ThesisDrawer", () => {
  it("shows a loading note before the fetch resolves", () => {
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    expect(screen.getByText("Reading the thesis…")).toBeInTheDocument();
  });

  it("renders an unreachable note on a fetch error", async () => {
    thesisShouldFail = true;
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() => expect(screen.getByText("The thesis is unreachable.")).toBeInTheDocument());
  });

  it("tells a human account plainly that it has no persona thesis", async () => {
    nextThesis = { available: false, kind: "human" };
    render(withClient(<ThesisDrawer id="human-eric" />));
    await waitFor(() =>
      expect(
        screen.getByText("A human account has no persona thesis to show."),
      ).toBeInTheDocument(),
    );
  });

  it("says plainly when no thesis data is wired, for a bot desk", async () => {
    nextThesis = { available: false, kind: "bot" };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() =>
      expect(screen.getByText("No thesis data is wired in this deployment.")).toBeInTheDocument(),
    );
  });

  it("renders the call banner, thesis paragraph, and health read", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        personaId: "sauron",
        thesis: "Fades exhausted euphoria; claims what panic discards.",
        call: {
          verdict: "entering",
          why: "momentum continuation above the shelf",
          window: "2d",
          invalidator: "closes below the 20d SMA",
          asOf: "2026-09-10T14:00:00Z",
        },
        health: { measured: true, label: "steady", detail: "1.0% off peak (5% cap)" },
        equity: [],
        markers: [],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() => expect(screen.getByText("Entering")).toBeInTheDocument());
    expect(
      screen.getByText("Fades exhausted euphoria; claims what panic discards."),
    ).toBeInTheDocument();
    expect(screen.getByText("momentum continuation above the shelf")).toBeInTheDocument();
    expect(screen.getByText("closes below the 20d SMA")).toBeInTheDocument();
    expect(screen.getByText("steady")).toBeInTheDocument();
  });

  it("renders an honest empty state when there is no equity history yet", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [],
        markers: [],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() =>
      expect(screen.getByText("No equity history recorded yet.")).toBeInTheDocument(),
    );
  });

  it("renders the bot-controls cluster locked, with the reason on each control", async () => {
    nextSettings = {
      authConfigured: true,
      adminWired: false,
      accounts: [
        { id: "human-eric", name: "Eric", kind: "human", hostConfigured: true, profile: null },
        { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
      ],
      fleetSuspended: false,
      timezones: [],
    };
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [],
        markers: [],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Subscribe/ })).toBeInTheDocument(),
    );

    // The fieldset disables every control uniformly — only human accounts appear as targets.
    expect(screen.getByRole("group")).toBeDisabled();
    expect(screen.getByRole("option", { name: "Eric" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Sauron" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Subscribe/ })).toHaveAttribute(
      "title",
      SUBSCRIBE_BOT_UNAVAILABLE_REASON,
    );
    expect(screen.getByRole("button", { name: /Steering Rules/ })).toHaveAttribute(
      "title",
      STEERING_RULES_UNAVAILABLE_REASON,
    );
  });

  it("says plainly when the viewer has no account to subscribe from", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [],
        markers: [],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() =>
      expect(screen.getByText("No accounts to subscribe from.")).toBeInTheDocument(),
    );
  });

  it("shows a 'Why?' toggle on a marker with reasoning, revealing it on click", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [{ t: "2026-09-10T00:00:00Z", value: 100_000 }],
        markers: [
          {
            n: 1,
            kind: "entry",
            at: "2026-09-10T14:00:00Z",
            label: "Buy 20 NVDA",
            activityAnchor: "act-ord-1",
            reasoning: {
              reason: "panic fade",
              expectation: "expect a bounce",
              guardDelta: "persona asked for 60, risk guards sized it to 20",
            },
          },
        ],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() => expect(screen.getByText("1. Buy 20 NVDA")).toBeInTheDocument());
    expect(screen.queryByText("panic fade", { exact: false })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Why?" }));
    expect(screen.getByText("“panic fade”")).toBeInTheDocument();
    expect(screen.getByText("Expected: expect a bounce")).toBeInTheDocument();
    expect(
      screen.getByText("persona asked for 60, risk guards sized it to 20"),
    ).toBeInTheDocument();
  });

  it("renders a plain link with no toggle when a marker has no resolved reasoning", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [{ t: "2026-09-10T00:00:00Z", value: 100_000 }],
        markers: [
          {
            n: 1,
            kind: "entry",
            at: "2026-09-10T14:00:00Z",
            label: "Buy 20 NVDA",
            activityAnchor: "act-ord-1",
          },
        ],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() => expect(screen.getByText("1. Buy 20 NVDA")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Why?" })).not.toBeInTheDocument();
    // On the Profile page the order's row lives on that account's Activity section (dead end 5).
    expect(screen.getByRole("link", { name: "1. Buy 20 NVDA" })).toHaveAttribute(
      "href",
      "/accounts?account=bot-sauron&section=activity#act-ord-1",
    );
  });

  it("links a marker to the any-account page's own Activity when rendered there", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [{ t: "2026-09-10T00:00:00Z", value: 100_000 }],
        markers: [
          {
            n: 1,
            kind: "entry",
            at: "2026-09-10T14:00:00Z",
            label: "Buy 20 NVDA",
            activityAnchor: "act-ord-1",
          },
        ],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" activity="page" />));
    await waitFor(() => expect(screen.getByText("1. Buy 20 NVDA")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "1. Buy 20 NVDA" })).toHaveAttribute(
      "href",
      "/u/bot-sauron/activity#act-ord-1",
    );
  });
});
