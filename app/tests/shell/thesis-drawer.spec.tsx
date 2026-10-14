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

    // Dead end 8 (#3807 slice 2e): each reason is visible text the button is described by — a
    // title has no hover on a phone.
    expect(screen.getByText(SUBSCRIBE_BOT_UNAVAILABLE_REASON)).toBeVisible();
    expect(screen.getByText(STEERING_RULES_UNAVAILABLE_REASON)).toBeVisible();
    expect(screen.getByRole("button", { name: "Subscribe" })).toHaveAccessibleDescription(
      SUBSCRIBE_BOT_UNAVAILABLE_REASON,
    );
    expect(screen.getByRole("button", { name: "Steering Rules" })).toHaveAccessibleDescription(
      STEERING_RULES_UNAVAILABLE_REASON,
    );
    expect(screen.getByRole("button", { name: "Subscribe" })).not.toHaveAttribute("title");
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
            symbol: "NVDA",
            side: "buy",
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
            symbol: "NVDA",
            side: "buy",
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
            symbol: "NVDA",
            side: "buy",
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

  // The safeguard ladder (#3194 slice 6a). The server owns the words (its own spec pins them
  // against the code); these cases pin that the drawer prints the state as a WORD and never
  // invents a row the payload did not carry.
  describe("the safeguard ladder", () => {
    const quiet: DeskThesis["thesis"] = {
      call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
      health: { measured: false, label: "not yet measured" },
      equity: [],
      markers: [],
    };

    it("prints each stage's state as a word, beside what it does", async () => {
      nextThesis = {
        available: true,
        kind: "bot",
        thesis: quiet,
        ladderAsOf: "2026-09-30T19:36:00.000Z",
        ladder: [
          {
            playbookId: "S1-NVDA",
            mode: "standard",
            stages: [
              { stage: 1, name: "Price and news disagreeing", state: "watching", does: "Logs it." },
              { stage: 2, name: "Automatic exit", state: "off", does: "No automatic exit." },
            ],
          },
        ],
      };
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() => expect(screen.getByText(/^Safeguards/)).toBeInTheDocument());
      expect(screen.getByText("S1-NVDA · standard")).toBeInTheDocument();
      expect(screen.getByText("Watching")).toBeInTheDocument();
      expect(screen.getByText("Off")).toBeInTheDocument();
      expect(screen.getByText("Logs it.")).toBeInTheDocument();
      expect(screen.getByText("No automatic exit.")).toBeInTheDocument();
      // Dated on the page: an undated list of safeguards reads as "this is what protects the bot
      // right now", and nothing bounds how old the pass it was read from is.
      expect(screen.getByText(/as of /)).toBeInTheDocument();
    });

    it("labels a play whose name is withheld by its position, never by a blank", async () => {
      nextThesis = {
        available: true,
        kind: "bot",
        thesis: quiet,
        ladder: [{ mode: "aggressive", stages: [] }],
      };
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() => expect(screen.getByText("Play 1 · aggressive")).toBeInTheDocument());
    });

    it("says why the ladder is unreadable rather than implying there is none", async () => {
      nextThesis = { available: true, kind: "bot", thesis: quiet, ladder: null };
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() =>
        expect(
          screen.getByText(/No decision pass on hand says which plays this bot runs/),
        ).toBeInTheDocument(),
      );
    });

    it("says a non-house play's safeguards cannot be read here", async () => {
      nextThesis = {
        available: true,
        kind: "bot",
        thesis: quiet,
        ladder: [{ playbookId: "MINE-1", mode: "standard", stages: null }],
      };
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() =>
        expect(screen.getByText(/Not one of the house plays/)).toBeInTheDocument(),
      );
    });

    it("draws nothing at all when the payload predates the ladder field", async () => {
      nextThesis = { available: true, kind: "bot", thesis: quiet };
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() => expect(screen.getByText("not yet measured")).toBeInTheDocument());
      expect(screen.queryByText(/^Safeguards/)).not.toBeInTheDocument();
    });
  });

  // The bot's own play, drawn (#5327). Every number arrives in the payload; these cases pin that
  // the drawer words and places what it was given, says the gaps in words, and shows the play's
  // safeguards once, as sentences rather than controls.
  describe("the drawn play", () => {
    const play = {
      playbookId: "SAURON",
      name: "Buy the rumor, sell the news",
      buyAtOrBelow: -0.7,
      buyMomentumAtLeast: 0,
      sellAtOrAbove: 0.7,
      sellMomentumAtMost: 0,
      windows: { momentum: 20, sentiment: 10 },
      researchBuild: false,
      researchTrades: [] as number[],
    };
    const mark = (n: number, symbol: string, side: "buy" | "sell", over = {}) => ({
      n,
      kind: side === "buy" ? ("entry" as const) : ("exit" as const),
      at: `2026-09-1${n}T14:00:00Z`,
      label: `${side === "buy" ? "Buy" : "Sell"} 5 ${symbol}`,
      symbol,
      side,
      activityAnchor: `act-${n}`,
      playbookId: "SAURON",
      ...over,
    });
    const sauronEntry = {
      playbookId: "SAURON",
      mode: "standard" as const,
      stages: [
        {
          stage: 1 as const,
          name: "Price and news disagreeing",
          state: "off" as const,
          does: "Nothing checks whether the price move and the news tone disagree on this play.",
        },
      ],
    };
    const otherEntry = {
      playbookId: "S1-NVDA",
      mode: "standard" as const,
      stages: [
        {
          stage: 1 as const,
          name: "Price and news disagreeing",
          state: "watching" as const,
          does: "Logs it.",
        },
      ],
    };
    const withPlay = (
      over: Partial<NonNullable<DeskThesis["thesis"]>> = {},
      ladder = [sauronEntry, otherEntry],
    ): DeskThesis => ({
      available: true,
      kind: "bot",
      ladderAsOf: "2026-09-30T19:36:00.000Z",
      ladder,
      thesis: {
        thesis: "Impose order on the market's chaos.",
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [],
        markers: [
          mark(3, "META", "buy", { sentiment: -0.75, momentum: 0.001 }),
          mark(6, "NVDA", "buy", { sentiment: -0.82, momentum: 0.003 }),
          mark(7, "META", "sell", { sentiment: 0.74, momentum: -0.002 }),
          mark(8, "AMD", "buy", { playbookId: "S1-NVDA", sentiment: -0.9 }),
        ],
        play,
        ...over,
      },
    });

    it("draws the rule on its own scale with this play's trades, then walks its latest buy", async () => {
      nextThesis = withPlay();
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Buy the rumor, sell the news" }),
        ).toBeInTheDocument(),
      );
      for (const tick of ["−1", "−0.70", "News sentiment", "+0.70", "+1", "Waits"]) {
        expect(screen.getByText(tick)).toBeInTheDocument();
      }
      expect(screen.getByText(/Bought: 3 META · 6 NVDA/)).toBeInTheDocument();
      expect(screen.getByText(/Sold: 7 META/)).toBeInTheDocument();
      // Another play's trade stays off this play's line.
      expect(screen.queryByLabelText(/Trade 8/)).not.toBeInTheDocument();
      expect(
        screen.getByLabelText("Trade 6: bought NVDA at a news score of −0.82"),
      ).toBeInTheDocument();
      // Each end's value sits in its own unbreakable span, so read the end's whole text.
      const ends = document.querySelector(".thesis-play-ends")?.textContent?.replace(/\s+/g, " ");
      expect(ends).toContain("Buy once momentum ≥ 0%");
      expect(ends).toContain("Sell all once momentum ≤ 0%");
      expect(
        screen.getByText(
          "Trade 6, NVDA: its last 10 news stories averaged −0.82 (bad-news words outweighed good), at or below its −0.70 line; then the price moved +0.30% over its last 20 price ticks (it needs 0% or more) → it bought.",
        ),
      ).toBeInTheDocument();
    });

    it("shows the play's safeguards once, as sentences, never as controls", async () => {
      nextThesis = withPlay();
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() => expect(screen.getByText(/What protects this play/)).toBeInTheDocument());
      expect(
        screen.getAllByText(
          "Nothing checks whether the price move and the news tone disagree on this play.",
        ),
      ).toHaveLength(1);
      expect(screen.queryByText("SAURON · standard")).not.toBeInTheDocument();
      expect(screen.getByText("S1-NVDA · standard")).toBeInTheDocument();
      // The only buttons are the locked Subscribe box's — no safeguard row is a control.
      expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
        "Subscribe",
        "Steering Rules",
      ]);
      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("drops the Safeguards list when the drawn play was the bot's only one", async () => {
      nextThesis = withPlay({}, [sauronEntry]);
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() => expect(screen.getByText(/What protects this play/)).toBeInTheDocument());
      expect(screen.queryByText(/^Safeguards/)).not.toBeInTheDocument();
      expect(screen.queryByText(/No decision pass on hand/)).not.toBeInTheDocument();
    });

    it("says in words what was not recorded, and draws nothing at a guessed spot", async () => {
      nextThesis = withPlay({
        markers: [mark(2, "NVDA", "buy"), mark(4, "META", "sell", { sentiment: 0.8 })],
      });
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() =>
        expect(screen.getByText(/Trade 2: no news score was recorded/)).toBeInTheDocument(),
      );
      expect(screen.queryByLabelText(/Trade 2/)).not.toBeInTheDocument();
      expect(screen.getByText(/Trade 2, NVDA: its decision didn't record/)).toBeInTheDocument();
    });

    it("says so when the play has not bought anything yet", async () => {
      nextThesis = withPlay({ markers: [] });
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() =>
        expect(screen.getByText("No trades from this play yet.")).toBeInTheDocument(),
      );
      expect(screen.getByText(/hasn't bought anything yet/)).toBeInTheDocument();
    });

    it("refuses to draw the standard line over the research build's trades", async () => {
      nextThesis = withPlay({ play: { ...play, researchBuild: true } });
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() => expect(screen.getByText(/faster research build/)).toBeInTheDocument());
      expect(screen.queryByText("Waits")).not.toBeInTheDocument();
      expect(screen.getByText(/What protects this play/)).toBeInTheDocument();
    });

    it("leaves an older research-build trade off the line and out of the walk-through", async () => {
      nextThesis = withPlay({
        markers: [
          mark(6, "NVDA", "buy", { sentiment: -0.82, momentum: 0.003 }),
          mark(9, "AMD", "buy", { sentiment: 0.2, momentum: 0.01 }),
          mark(10, "NVDA", "sell", { sentiment: 0.75, momentum: -0.001 }),
        ],
        play: { ...play, researchTrades: [9] },
      });
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() =>
        expect(screen.getByText(/Trade 9 came from the bot's/)).toBeInTheDocument(),
      );
      expect(screen.queryByLabelText(/Trade 9/)).not.toBeInTheDocument();
      expect(screen.getByText(/Bought: 6 NVDA$/)).toBeInTheDocument();
      expect(screen.getByText(/^Trade 6, NVDA:/)).toBeInTheDocument();
    });

    it("draws no play block when the payload carries none", async () => {
      nextThesis = withPlay({ play: undefined });
      render(withClient(<ThesisDrawer id="bot-sauron" />));
      await waitFor(() => expect(screen.getByText("not yet measured")).toBeInTheDocument());
      expect(screen.queryByText(/What protects this play/)).not.toBeInTheDocument();
      expect(screen.getByText("SAURON · standard")).toBeInTheDocument();
    });
  });
});
