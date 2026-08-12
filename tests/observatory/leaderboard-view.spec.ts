import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { renderLeaderboardBody } from "../../src/observatory/leaderboard-view.js";

function data(participants: DashboardData["participants"]): DashboardData {
  return { generatedAt: "2026-07-24T15:30:00.000Z", participants, collisions: [] };
}

describe("renderLeaderboardBody — default equity ranking", () => {
  const html = renderLeaderboardBody(
    data([
      { id: "a", displayName: "Ann", kind: "human", cash: 0, equity: 50_000, positions: [] },
      {
        id: "b",
        displayName: "Bo",
        kind: "bot",
        personaId: "day-trader",
        cash: 0,
        equity: 120_000,
        positions: [],
      },
    ]),
  );

  it("ranks by equity descending by default, best first", () => {
    expect(html.indexOf(">Bo ")).toBeLessThan(html.indexOf(">Ann "));
  });

  it("interleaves bot and human chips on their respective rows", () => {
    expect(html).toContain("BOT · day-trader");
    expect(html).toContain(">HUMAN<");
  });

  it("marks the equity metric as the active picker link", () => {
    expect(html).toContain('class="msel active" href="/leaderboard?by=equity"');
  });

  it("numbers the ranks starting at 1 and marks the top three", () => {
    expect(html).toContain('<span class="rank">1</span>');
    expect(html).toContain('<span class="rank">2</span>');
    expect(html).toContain("rank-top rank-1");
  });
});

describe("renderLeaderboardBody — unrealized P/L ranking", () => {
  const withEquity = data([
    {
      id: "winner",
      displayName: "Winner",
      kind: "human",
      cash: 0,
      equity: 100_000,
      positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 100, marketValue: 2_000 }],
    },
    {
      id: "loser",
      displayName: "Loser",
      kind: "human",
      cash: 0,
      equity: 100_000,
      positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 100, marketValue: 500 }],
    },
  ]);

  it("ranks by unrealized gain when the pl metric is selected", () => {
    // Winner: 2,000 - 1,000 = +1,000. Loser: 500 - 1,000 = -500.
    const html = renderLeaderboardBody(withEquity, { metric: "pl" });
    expect(html.indexOf(">Winner ")).toBeLessThan(html.indexOf(">Loser "));
    expect(html).toContain("+$1,000");
    expect(html).toContain('class="rank-val num neg"');
  });
});

describe("renderLeaderboardBody — return % ranking", () => {
  it("computes return as unrealized P/L over the current market value invested", () => {
    const html = renderLeaderboardBody(
      data([
        {
          id: "small-base",
          displayName: "SmallBase",
          kind: "human",
          cash: 0,
          equity: 10_000,
          // pl = 150 - 100 = +50; invested (market value) = 150 -> +33.33%
          positions: [{ symbol: "AAA", quantity: 10, avgPrice: 10, marketValue: 150 }],
        },
        {
          id: "big-base",
          displayName: "BigBase",
          kind: "human",
          cash: 0,
          equity: 10_000,
          // pl = 1,050 - 1,000 = +50; invested (market value) = 1,050 -> +4.76%
          positions: [{ symbol: "BBB", quantity: 100, avgPrice: 10, marketValue: 1_050 }],
        },
      ]),
      { metric: "return" },
    );
    expect(html.indexOf(">SmallBase ")).toBeLessThan(html.indexOf(">BigBase "));
    expect(html).toContain("+33.33%");
    expect(html).toContain("+4.76%");
  });

  it("treats zero invested cost basis as a 0% return rather than dividing by zero", () => {
    const html = renderLeaderboardBody(
      data([
        {
          id: "cash-only",
          displayName: "CashOnly",
          kind: "human",
          cash: 5_000,
          equity: 5_000,
          positions: [],
        },
      ]),
      { metric: "return" },
    );
    expect(html).toContain("+0.00%");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });
});

describe("renderLeaderboardBody — ties and edge cases", () => {
  it("keeps stable ordering for participants tied on the ranked metric", () => {
    const html = renderLeaderboardBody(
      data([
        {
          id: "first",
          displayName: "First",
          kind: "human",
          cash: 0,
          equity: 50_000,
          positions: [],
        },
        {
          id: "second",
          displayName: "Second",
          kind: "human",
          cash: 0,
          equity: 50_000,
          positions: [],
        },
      ]),
    );
    expect(html.indexOf(">First ")).toBeLessThan(html.indexOf(">Second "));
  });

  it("renders a single participant as rank 1 without dividing by a zero max", () => {
    const html = renderLeaderboardBody(
      data([{ id: "solo", displayName: "Solo", kind: "human", cash: 0, equity: 0, positions: [] }]),
    );
    expect(html).toContain('<span class="rank">1</span>');
    expect(html).not.toContain("NaN");
  });

  it("shows an empty-board message when there are no participants", () => {
    const html = renderLeaderboardBody(data([]));
    expect(html).toContain("No participants on the board yet");
  });

  it("excludes errored accounts from the ranked ladder", () => {
    const html = renderLeaderboardBody(
      data([
        { id: "ok", displayName: "Ok", kind: "human", cash: 0, equity: 10_000, positions: [] },
        {
          id: "broken",
          displayName: "Broken",
          kind: "bot",
          personaId: "x",
          cash: 0,
          equity: 0,
          positions: [],
          error: "AlpacaApiError 401",
        },
      ]),
    );
    expect(html).toContain(">Ok ");
    expect(html).not.toContain(">Broken ");
  });

  it("escapes HTML in a participant's display name", () => {
    const html = renderLeaderboardBody(
      data([
        {
          id: "x",
          displayName: "<script>alert(1)</script>",
          kind: "human",
          cash: 0,
          equity: 1_000,
          positions: [],
        },
      ]),
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("marks the current viewer's row with the YOU badge and self styling", () => {
    const html = renderLeaderboardBody(
      data([
        { id: "me", displayName: "Me", kind: "human", cash: 0, equity: 10_000, positions: [] },
        { id: "other", displayName: "Other", kind: "human", cash: 0, equity: 5_000, positions: [] },
      ]),
      { nav: { active: "leaderboard", canAdd: true, authed: true, currentId: "me" } },
    );
    expect(html).toContain("rank-self");
    expect(html).toContain('<span class="you-mark">YOU</span>');
  });

  it("labels the footer with the currently selected metric's name", () => {
    const html = renderLeaderboardBody(data([]), { metric: "realized" });
    expect(html).toContain("ranked by Realized P/L");
  });
});
