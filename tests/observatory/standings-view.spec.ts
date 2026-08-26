import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { sampleDashboardData } from "../../src/observatory/sample-dashboard-data.js";
import { parseLeaderMetric } from "../../src/observatory/standings-metric.js";
import {
  renderStandingsBody,
  renderStandingsContent,
} from "../../src/observatory/standings-view.js";

function data(participants: DashboardData["participants"]): DashboardData {
  return { generatedAt: "2026-07-24T15:30:00.000Z", participants, collisions: [] };
}

describe("parseLeaderMetric", () => {
  it("accepts the four known metrics and defaults everything else to equity", () => {
    expect(parseLeaderMetric("pl")).toBe("pl");
    expect(parseLeaderMetric("return")).toBe("return");
    expect(parseLeaderMetric("realized")).toBe("realized");
    expect(parseLeaderMetric("equity")).toBe("equity");
    expect(parseLeaderMetric("nonsense")).toBe("equity");
    expect(parseLeaderMetric(null)).toBe("equity");
    expect(parseLeaderMetric(undefined)).toBe("equity");
  });
});

describe("the field — default equity ranking", () => {
  const html = renderStandingsBody(
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
    // Anchored on the ladder row's own link (href="/u/<id>") — a single-member cohort's "Best
    // performer" line in the cards above also says the same name, with no href to disambiguate.
    expect(html.indexOf('href="/u/b">Bo ')).toBeLessThan(html.indexOf('href="/u/a">Ann '));
  });

  it("interleaves bot and human chips on their respective rows", () => {
    expect(html).toContain("BOT · day-trader");
    expect(html).toContain(">HUMAN<");
  });

  it("marks the equity metric as the active picker link", () => {
    expect(html).toContain('class="msel active" href="/?by=equity"');
  });

  it("numbers the ranks starting at 1 and marks the top three", () => {
    expect(html).toContain('<span class="rank" data-field="rank">1</span>');
    expect(html).toContain('<span class="rank" data-field="rank">2</span>');
    expect(html).toContain("rank-top rank-1");
  });
});

describe("the field — unrealized P/L ranking", () => {
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
    const html = renderStandingsBody(withEquity, { metric: "pl" });
    // Anchored on the ladder row's own link — the cohort card's "Best performer" line above can
    // say the same name with no href to disambiguate.
    expect(html.indexOf('href="/u/winner">Winner ')).toBeLessThan(
      html.indexOf('href="/u/loser">Loser '),
    );
    expect(html).toContain("+$1,000");
    expect(html).toContain('class="rank-val num neg"');
  });
});

describe("the field — return % ranking", () => {
  it("computes return as unrealized P/L over the current market value invested", () => {
    const html = renderStandingsBody(
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
    // Anchored on the ladder row's own link — the cohort card's "Best performer" line above can
    // say the same name with no href to disambiguate.
    expect(html.indexOf('href="/u/small-base">SmallBase ')).toBeLessThan(
      html.indexOf('href="/u/big-base">BigBase '),
    );
    expect(html).toContain("+33.33%");
    expect(html).toContain("+4.76%");
  });

  it("treats zero invested cost basis as a 0% return rather than dividing by zero", () => {
    const html = renderStandingsBody(
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

describe("the field — realized P/L ranking", () => {
  it("offers Realized P/L as a rankable metric", () => {
    expect(renderStandingsBody(data([]))).toContain("/?by=realized");
  });

  it("ranks by booked realized P/L when selected, best first", () => {
    const html = renderStandingsBody(
      data([
        {
          id: "a",
          displayName: "Ann",
          kind: "human",
          cash: 0,
          equity: 100_000,
          positions: [],
          realizedPl: 500,
        },
        {
          id: "b",
          displayName: "Bo",
          kind: "bot",
          personaId: "day-trader",
          cash: 0,
          equity: 100_000,
          positions: [],
          realizedPl: 9_000,
        },
      ]),
      { metric: "realized" },
    );
    // Bo (+$9,000) outranks Ann (+$500): Bo's name appears before Ann's in the ordered list.
    // Anchored on the ladder row's own link — a single-member cohort's "Best performer" line in
    // the cards above also says the same name, with no href to disambiguate.
    expect(html.indexOf('href="/u/b">Bo ')).toBeLessThan(html.indexOf('href="/u/a">Ann '));
    expect(html).toContain("+$9,000");
    expect(html).toContain("+$500");
  });
});

describe("the field — ties and edge cases", () => {
  it("keeps stable ordering for participants tied on the ranked metric", () => {
    const html = renderStandingsBody(
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
    // Anchored on the ladder row's own link — the cohort card's "Best performer" line above can
    // say the same name with no href to disambiguate.
    expect(html.indexOf('href="/u/first">First ')).toBeLessThan(
      html.indexOf('href="/u/second">Second '),
    );
  });

  it("renders a single participant as rank 1 without dividing by a zero max", () => {
    const html = renderStandingsBody(
      data([{ id: "solo", displayName: "Solo", kind: "human", cash: 0, equity: 0, positions: [] }]),
    );
    expect(html).toContain('<span class="rank" data-field="rank">1</span>');
    expect(html).not.toContain("NaN");
  });

  it("shows an empty-board message when there are no participants", () => {
    const html = renderStandingsBody(data([]));
    expect(html).toContain("No participants on the board yet");
  });

  it("excludes errored accounts from the ranked ladder", () => {
    const html = renderStandingsBody(
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
    const html = renderStandingsBody(
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
    const html = renderStandingsBody(
      data([
        { id: "me", displayName: "Me", kind: "human", cash: 0, equity: 10_000, positions: [] },
        { id: "other", displayName: "Other", kind: "human", cash: 0, equity: 5_000, positions: [] },
      ]),
      { nav: { active: "board", canAdd: true, authed: true, currentId: "me" } },
    );
    expect(html).toContain("rank-self");
    expect(html).toContain('<span class="you-mark">YOU</span>');
  });

  it("labels the footer with the currently selected metric's name", () => {
    const html = renderStandingsBody(data([]), { metric: "realized" });
    expect(html).toContain("ranked by Realized P/L");
  });
});

describe("observer mode (funnel front door)", () => {
  const nav = { active: "board" as const, canAdd: true, authed: true };

  it("shows the observer hero when signed in with no linked account", () => {
    const html = renderStandingsBody(data([]), { nav });
    expect(html).toContain("NOT CONNECTED");
    expect(html).toContain('href="/welcome"');
    expect(html).toContain('href="/add"');
  });

  // 2026-08-25: the old copy read as "you have no account" to a viewer whose account WAS on the
  // board, and walked them into /add's duplicate refusal and a key regeneration that revoked
  // their working pair. The hero must name the real state and both exits.
  it("names the unlinked state and the already-on-the-board exit, not just the new-member one", () => {
    const html = renderStandingsBody(data([]), { nav });
    expect(html).toContain("isn't linked to any account");
    expect(html).toContain("Already see your account below?");
    expect(html).toContain("Rotate link");
  });

  it("hides the observer hero once the viewer has a linked account", () => {
    const html = renderStandingsBody(data([]), { nav: { ...nav, currentId: "human-eric" } });
    expect(html).not.toContain("NOT CONNECTED");
  });

  it("does not show the observer hero on the bare embed (no nav)", () => {
    const html = renderStandingsBody(data([]));
    expect(html).not.toContain("NOT CONNECTED");
  });
});

describe("a realistic mixed board (bots, a human, gains and losses)", () => {
  // sample-dashboard-data.ts's hand-authored fixture — bots and a human, gains and losses, real
  // activity — exercised the old card-grid Board's per-card detail (activity feed, timezone
  // labels). That detail lives on each participant's own /u/:id desk now, not duplicated here;
  // this smoke test keeps the fixture honest against what Standings actually renders.
  const html = renderStandingsBody(sampleDashboardData());

  it("ranks every participant with their kind chip", () => {
    expect(html).toContain("The News Fader");
    expect(html).toContain("BOT · news-fader");
    expect(html).toContain("Eric");
    expect(html).toContain(">HUMAN<");
  });

  it("colors each row's metric by its class when ranked by unrealized P/L", () => {
    // Every participant in this fixture carries a net unrealized GAIN once their two legs net out
    // (News Fader +114,600, Futurist +4,400 despite its NVDA leg alone being -13,600, Eric +3,840)
    // — so ranked by P/L, all three rows read positive and none read negative.
    const byPl = renderStandingsBody(sampleDashboardData(), { metric: "pl" });
    expect(byPl.match(/class="rank-val num pos"/g)?.length).toBe(3);
    expect(byPl).not.toContain('class="rank-val num neg"');
  });

  it("rolls the two bots and the one human into the match's cohort cards", () => {
    expect(html).toContain(
      '<span data-field="count">2</span><span class="unit" data-field="countUnit"> accounts</span>',
    );
    expect(html).toContain(
      '<span data-field="count">1</span><span class="unit" data-field="countUnit"> account</span>',
    );
  });

  it("escapes HTML in participant names", () => {
    const data: DashboardData = {
      generatedAt: "2026-07-24T15:30:00.000Z",
      participants: [
        { id: "x", displayName: "<script>", kind: "human", cash: 0, equity: 0, positions: [] },
      ],
      collisions: [],
    };
    expect(renderStandingsBody(data)).not.toContain("<script>");
  });
});

describe("renderStandingsContent — the SSE-swappable inner content", () => {
  it("renders without the shell (no drawer, no design-token stylesheet)", () => {
    const html = renderStandingsContent(data([]));
    expect(html).not.toContain("<aside");
    expect(html).not.toContain("<style>");
    expect(html).toContain("Standings");
  });

  it("carries the selected metric through, same as the full body", () => {
    const html = renderStandingsContent(data([]), { metric: "realized" });
    expect(html).toContain('class="msel active" href="/?by=realized"');
  });
});
