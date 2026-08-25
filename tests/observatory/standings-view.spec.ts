import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { sampleDashboardData } from "../../src/observatory/sample-dashboard-data.js";
import {
  parseLeaderMetric,
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
    expect(html).toContain('<span class="rank">1</span>');
    expect(html).toContain('<span class="rank">2</span>');
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
    expect(html).toContain('<span class="rank">1</span>');
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

describe("the match — cohort cards", () => {
  const humans: ParticipantSnapshot[] = [
    { id: "h1", displayName: "Ann", kind: "human", cash: 10_000, equity: 120_000, positions: [] },
    { id: "h2", displayName: "Bea", kind: "human", cash: 5_000, equity: 100_000, positions: [] },
  ];
  const bots: ParticipantSnapshot[] = [
    {
      id: "b1",
      displayName: "Bot A",
      kind: "bot",
      personaId: "day-trader",
      cash: 0,
      equity: 80_000,
      positions: [{ symbol: "NVDA", quantity: 100, avgPrice: 100, marketValue: 12_000 }],
    },
  ];
  const html = renderStandingsBody(data([...humans, ...bots]));

  it("labels each cohort with its chip and account count", () => {
    expect(html).toContain(">HUMANS<");
    expect(html).toContain(">BOTS<");
    expect(html).toContain(
      '<span class="cohort-count num">2<span class="unit"> accounts</span></span>',
    );
    expect(html).toContain(
      '<span class="cohort-count num">1<span class="unit"> account</span></span>',
    );
  });

  it("shows each cohort's total equity", () => {
    // Humans: 120,000 + 100,000 = 220,000. Bots: 80,000.
    expect(html).toContain("$220,000");
    expect(html).toContain("$80,000");
  });

  it("marks the LEADS badge on the cohort with the higher total equity", () => {
    const leadArticleIdx = html.indexOf('class="cohort cohort-lead"');
    const botChipIdx = html.indexOf('class="chip chip-bot"');
    expect(leadArticleIdx).toBeGreaterThan(-1);
    expect(leadArticleIdx).toBeLessThan(botChipIdx);
    expect(html).toContain("LEADS");
  });

  it("shows the best performer's name and return within a cohort", () => {
    // Bot A: mktValue 12,000 vs cost 100*100=10,000 -> +2,000 unrealized -> +16.67% of invested value.
    expect(html).toContain("Bot A");
    expect(html).toContain("+16.67%");
  });

  it("reports breadth (share of the cohort in profit)", () => {
    // Both humans have no positions -> unrealized 0 -> counted as "in profit" (>= 0).
    expect(html).toContain("100%");
  });

  // The design brief drops the nation-skyline flourish from every comparison surface (2026-08-25):
  // a dense head-to-head wants data, not decoration. The flourish stays on an individual's own desk.
  it("renders no nation skyline on a cohort card", () => {
    expect(html).not.toContain('class="cohort-nation"');
  });
});

describe("the match — the bar", () => {
  it("splits the bar by average equity per account, not by headcount", () => {
    const twoHumansOneBot = data([
      { id: "h1", displayName: "Ann", kind: "human", cash: 0, equity: 120_000, positions: [] },
      {
        id: "b1",
        displayName: "Bot A",
        kind: "bot",
        personaId: "day-trader",
        cash: 0,
        equity: 80_000,
        positions: [],
      },
      {
        id: "b2",
        displayName: "Bot B",
        kind: "bot",
        personaId: "futurist",
        cash: 0,
        equity: 80_000,
        positions: [],
      },
    ]);
    const html = renderStandingsBody(twoHumansOneBot);
    // Humans avg 120k, bots avg 80k (2 bots don't move the average) -> 60/40 humans lead.
    expect(html).toContain("THE MATCH · LIVE");
    expect(html).toContain("Humans 60%");
    expect(html).toContain("40% Bots");
    expect(html).toContain("<strong>Humans</strong> lead the match");
  });

  it("reads dead even when the cohort averages are tied", () => {
    const tied = data([
      { id: "h", displayName: "H", kind: "human", cash: 0, equity: 100_000, positions: [] },
      {
        id: "b",
        displayName: "B",
        kind: "bot",
        personaId: "x",
        cash: 0,
        equity: 100_000,
        positions: [],
      },
    ]);
    expect(renderStandingsBody(tied)).toContain("Dead even — the match is tied");
  });

  it("leans bots when the bot cohort's average equity is higher", () => {
    const botsAhead = data([
      { id: "h", displayName: "H", kind: "human", cash: 0, equity: 50_000, positions: [] },
      {
        id: "b",
        displayName: "B",
        kind: "bot",
        personaId: "x",
        cash: 0,
        equity: 150_000,
        positions: [],
      },
    ]);
    const html = renderStandingsBody(botsAhead);
    expect(html).toContain("<strong>Bots</strong> lead the match");
    expect(html).toContain("75%");
  });
});

describe("the match — the head-to-head read line", () => {
  it("reports the total-equity gap and the average-equity gap between cohorts", () => {
    const uneven = data([
      { id: "h1", displayName: "Ann", kind: "human", cash: 0, equity: 100_000, positions: [] },
      { id: "h2", displayName: "Bea", kind: "human", cash: 0, equity: 100_000, positions: [] },
      {
        id: "b1",
        displayName: "Bot",
        kind: "bot",
        personaId: "x",
        cash: 0,
        equity: 50_000,
        positions: [],
      },
    ]);
    const html = renderStandingsBody(uneven);
    // Total: humans 200,000 vs bots 50,000 -> humans lead by 150,000.
    // Average: humans 100,000 vs bots 50,000 -> humans lead by 50,000.
    expect(html).toContain(
      '<strong>Humans</strong> lead on total equity by <span class="num">$150,000</span>',
    );
    expect(html).toContain(
      '<strong>Humans</strong> lead on average equity by <span class="num">$50,000</span>',
    );
  });
});

describe("the match — edge cases", () => {
  it("renders a bot-only field with an empty (zero-count) human cohort", () => {
    const botsOnly = data([
      {
        id: "b1",
        displayName: "Bot A",
        kind: "bot",
        personaId: "x",
        cash: 0,
        equity: 100_000,
        positions: [],
      },
    ]);
    const html = renderStandingsBody(botsOnly);
    expect(html).toContain(
      '<span class="cohort-count num">0<span class="unit"> accounts</span></span>',
    );
    expect(html).not.toContain("NaN");
    expect(html).toContain("$0");
  });

  it("renders a human-only field with an empty (zero-count) bot cohort", () => {
    const humansOnly = data([
      { id: "h1", displayName: "Ann", kind: "human", cash: 0, equity: 100_000, positions: [] },
    ]);
    const html = renderStandingsBody(humansOnly);
    expect(html).toContain(
      '<span class="cohort-count num">0<span class="unit"> accounts</span></span>',
    );
    expect(html).not.toContain("NaN");
  });

  it("reads dead even with two empty cohorts and shows a dash for best performer", () => {
    const html = renderStandingsBody(data([]));
    expect(html).toContain("Dead even — the match is tied");
    expect(html).not.toContain("NaN");
    expect(html).toContain("<dt>Best</dt><dd>—</dd>");
  });

  it("excludes errored accounts from cohort totals and breadth", () => {
    const withError = data([
      { id: "h1", displayName: "Ann", kind: "human", cash: 0, equity: 100_000, positions: [] },
      {
        id: "h2",
        displayName: "Broken",
        kind: "human",
        cash: 0,
        equity: 0,
        positions: [],
        error: "AlpacaApiError 401",
      },
    ]);
    const html = renderStandingsBody(withError);
    expect(html).toContain(
      '<span class="cohort-count num">1<span class="unit"> account</span></span>',
    );
    expect(html).toContain("$100,000");
  });

  it("escapes HTML in a cohort's best-performer name", () => {
    const withMarkup = data([
      {
        id: "h1",
        displayName: "<script>alert(1)</script>",
        kind: "human",
        cash: 0,
        equity: 100_000,
        positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 100, marketValue: 2_000 }],
      },
    ]);
    const html = renderStandingsBody(withMarkup);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("observer mode (funnel front door)", () => {
  const nav = { active: "board" as const, canAdd: true, authed: true };

  it("shows the observer hero when signed in with no linked account", () => {
    const html = renderStandingsBody(data([]), { nav });
    expect(html).toContain("OBSERVER MODE");
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
    expect(html).toContain('href="/rotate"');
  });

  it("hides the observer hero once the viewer has a linked account", () => {
    const html = renderStandingsBody(data([]), { nav: { ...nav, currentId: "human-eric" } });
    expect(html).not.toContain("OBSERVER MODE");
  });

  it("does not show the observer hero on the bare embed (no nav)", () => {
    const html = renderStandingsBody(data([]));
    expect(html).not.toContain("OBSERVER MODE");
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
      '<span class="cohort-count num">2<span class="unit"> accounts</span></span>',
    );
    expect(html).toContain(
      '<span class="cohort-count num">1<span class="unit"> account</span></span>',
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

// Compare, folded into Standings as ?a=&b= (2026-08-25) — was the standalone /compare route.
// The resolution logic is preserved exactly: an id must exist in data.participants, match by
// .id, carry no .error; missing/unknown/errored falls through — here, to the plain field with
// every row still offering its arm-compare pill, since there's no separate "picker" page anymore.

/** Build a comparison-ready snapshot; overrides let each spec state only what it cares about. */
function aSnapshot(overrides: Partial<ParticipantSnapshot> & Pick<ParticipantSnapshot, "id">) {
  const snapshot: ParticipantSnapshot = {
    id: overrides.id,
    displayName: overrides.displayName ?? overrides.id,
    kind: overrides.kind ?? "human",
    cash: overrides.cash ?? 1_000,
    equity: overrides.equity ?? 10_000,
    positions: overrides.positions ?? [],
    ...(overrides.personaId !== undefined ? { personaId: overrides.personaId } : {}),
    ...(overrides.realizedPl !== undefined ? { realizedPl: overrides.realizedPl } : {}),
    ...(overrides.error !== undefined ? { error: overrides.error } : {}),
  };
  return snapshot;
}

describe("head-to-head — both sides resolve", () => {
  const a = aSnapshot({ id: "human-eric", displayName: "Eric", equity: 12_000, kind: "human" });
  const b = aSnapshot({ id: "news-fader", displayName: "News Fader", equity: 9_000, kind: "bot" });

  it("renders each participant's name, chip, and equity in their own column", () => {
    const html = renderStandingsBody(data([a, b]), { aId: a.id, bId: b.id });

    expect(html).toContain("Eric");
    expect(html).toContain("News Fader");
    expect(html).toContain("$12,000");
    expect(html).toContain("$9,000");
    expect(html).toContain("HUMAN");
    expect(html).toContain("BOT");
    expect(html).toContain('Eric <span class="cmp-vs">vs</span> News Fader');
  });

  it("marks the leading side with a forward marker when A is ahead on equity", () => {
    const ahead = aSnapshot({ id: "a", displayName: "Ahead", equity: 20_000 });
    const behind = aSnapshot({ id: "b", displayName: "Behind", equity: 10_000 });
    const html = renderStandingsBody(data([ahead, behind]), { aId: ahead.id, bId: behind.id });

    expect(html).toMatch(/◀ \+?\$10,000/);
  });

  it("marks the leading side with a backward marker when B is ahead on equity", () => {
    const behind = aSnapshot({ id: "a", displayName: "Behind", equity: 10_000 });
    const ahead = aSnapshot({ id: "b", displayName: "Ahead", equity: 20_000 });
    const html = renderStandingsBody(data([behind, ahead]), { aId: behind.id, bId: ahead.id });

    expect(html).toMatch(/▶ \+?\$10,000/);
  });

  it("shows a flat delta with no directional marker when both sides are tied", () => {
    const tiedA = aSnapshot({ id: "a", displayName: "Tied A", equity: 10_000 });
    const tiedB = aSnapshot({ id: "b", displayName: "Tied B", equity: 10_000 });
    const html = renderStandingsBody(data([tiedA, tiedB]), { aId: tiedA.id, bId: tiedB.id });

    expect(html).toContain(`<span class="cmp-dval num flat">— $0</span>`);
  });

  it("renders identical participants without error, with a flat delta on every metric", () => {
    const solo = aSnapshot({
      id: "same",
      displayName: "Solo",
      equity: 5_000,
      positions: [{ symbol: "AAPL", marketValue: 500, avgPrice: 100, quantity: 5 }],
    });
    // Same id resolves to the same snapshot on both sides — the comparison still renders cleanly.
    const html = renderStandingsBody(data([solo]), { aId: solo.id, bId: solo.id });

    expect(html).toContain('Solo <span class="cmp-vs">vs</span> Solo');
    expect(html.match(/flat/g)?.length).toBeGreaterThan(0);
  });

  it("shows shared holdings tagged SHARED with both sides' values", () => {
    const heavy = aSnapshot({
      id: "a",
      displayName: "A",
      positions: [{ symbol: "AAPL", marketValue: 2_000, avgPrice: 90, quantity: 10 }],
    });
    const light = aSnapshot({
      id: "b",
      displayName: "B",
      positions: [{ symbol: "AAPL", marketValue: 1_000, avgPrice: 90, quantity: 10 }],
    });
    const html = renderStandingsBody(data([heavy, light]), { aId: heavy.id, bId: light.id });

    expect(html).toContain("SHARED");
    expect(html).toContain("cmp-shared");
    // The heavier side (A, at $2,000) is marked distinctly from the lighter side.
    expect(html).toContain("aheavy");
  });

  it("shows a symbol only one side holds with a placeholder dash on the other side", () => {
    const holder = aSnapshot({
      id: "a",
      displayName: "A",
      positions: [{ symbol: "TSLA", marketValue: 3_000, avgPrice: 90, quantity: 10 }],
    });
    const flat = aSnapshot({ id: "b", displayName: "B", positions: [] });
    const html = renderStandingsBody(data([holder, flat]), { aId: holder.id, bId: flat.id });

    expect(html).toContain("TSLA");
    expect(html).not.toContain("SHARED");
    expect(html).toMatch(/<td class="num cmp-bval">·<\/td>/);
  });

  it("shows an empty-state message when neither side holds any position", () => {
    const emptyA = aSnapshot({ id: "a", displayName: "A", positions: [] });
    const emptyB = aSnapshot({ id: "b", displayName: "B", positions: [] });
    const html = renderStandingsBody(data([emptyA, emptyB]), { aId: emptyA.id, bId: emptyB.id });

    expect(html).toContain("Neither holds an open position yet.");
  });

  it("escapes HTML in display names to prevent markup injection", () => {
    const evil = aSnapshot({ id: "a", displayName: "<script>bad</script>" });
    const plain = aSnapshot({ id: "b", displayName: "B" });
    const html = renderStandingsBody(data([evil, plain]), { aId: evil.id, bId: plain.id });

    expect(html).not.toContain("<script>bad</script>");
    expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
  });

  it("includes the history-layer seam note for future per-play insights", () => {
    const p1 = aSnapshot({ id: "a" });
    const p2 = aSnapshot({ id: "b" });
    const html = renderStandingsBody(data([p1, p2]), { aId: p1.id, bId: p2.id });

    expect(html).toContain("Which plays worked");
  });

  it("renders no nation skyline — density, not decoration (design brief, 2026-08-25)", () => {
    const p1 = aSnapshot({ id: "a" });
    const p2 = aSnapshot({ id: "b" });
    const html = renderStandingsBody(data([p1, p2]), { aId: p1.id, bId: p2.id });

    expect(html).not.toContain("empire-cities");
    expect(html).not.toContain("empire-city-name");
  });

  it("offers a × clear link back to plain Standings, carrying the selected metric", () => {
    const p1 = aSnapshot({ id: "a" });
    const p2 = aSnapshot({ id: "b" });
    const html = renderStandingsBody(data([p1, p2]), {
      aId: p1.id,
      bId: p2.id,
      metric: "return",
    });

    expect(html).toContain('<a class="cmp-cancel" href="/?by=return">× clear</a>');
  });
});

// These assert absence, so they use renderStandingsContent — the shell's <style> block always
// names .cmp-hint/.cmp-grid as CSS selectors, which would false-positive a body-level check.
describe("head-to-head — an incomplete or invalid pair falls through", () => {
  it("renders the plain field, no hint and no head-to-head, when neither id is given", () => {
    const alice = aSnapshot({ id: "a", displayName: "Alice" });
    const bob = aSnapshot({ id: "b", displayName: "Bob" });
    const html = renderStandingsContent(data([alice, bob]));

    expect(html).not.toContain("cmp-hint");
    expect(html).not.toContain("cmp-grid");
    // Every row still offers an unarmed compare pill.
    expect(html.match(/class="cmp-toggle"/g)?.length).toBe(2);
  });

  it("shows the armed hint banner naming the anchor when only aId resolves", () => {
    const alice = aSnapshot({ id: "a", displayName: "Alice" });
    const bob = aSnapshot({ id: "b", displayName: "Bob" });
    const html = renderStandingsContent(data([alice, bob]), { aId: alice.id });

    expect(html).toContain("cmp-hint");
    expect(html).toContain("Comparing <strong>Alice</strong>");
    expect(html).toContain("pick a second empire on any row below");
    expect(html).not.toContain("cmp-grid");
  });

  it("falls through to the plain field when aId resolves to a participant with a read error", () => {
    const errored = aSnapshot({ id: "a", displayName: "Alice", error: "unreachable" });
    const bob = aSnapshot({ id: "b", displayName: "Bob" });
    const html = renderStandingsContent(data([errored, bob]), { aId: errored.id, bId: bob.id });

    expect(html).not.toContain("cmp-hint");
    expect(html).not.toContain("cmp-grid");
  });

  it("shows the armed hint (not the head-to-head) when bId does not resolve to any participant", () => {
    const alice = aSnapshot({ id: "a", displayName: "Alice" });
    const html = renderStandingsContent(data([alice]), { aId: alice.id, bId: "missing" });

    expect(html).toContain("Comparing <strong>Alice</strong>");
    expect(html).not.toContain("cmp-grid");
  });
});

describe("the field's compare pill — arms, completes, and cancels with no client JS", () => {
  const alice = aSnapshot({ id: "a", displayName: "Alice" });
  const bob = aSnapshot({ id: "b", displayName: "Bob" });
  const carol = aSnapshot({ id: "c", displayName: "Carol" });

  it("arms this row when nothing is armed yet", () => {
    const html = renderStandingsBody(data([alice, bob]));
    expect(html).toContain('href="/?by=equity&a=a"');
  });

  it("offers a cancel on the armed row itself", () => {
    const html = renderStandingsBody(data([alice, bob]), { aId: alice.id });
    expect(html).toMatch(/cmp-toggle cmp-armed" href="\/\?by=equity"[^>]*>×</);
  });

  it("completes the pair on every other row once one is armed", () => {
    const html = renderStandingsBody(data([alice, bob, carol]), { aId: alice.id });
    expect(html).toContain('href="/?by=equity&a=a&b=b"');
    expect(html).toContain('href="/?by=equity&a=a&b=c"');
  });

  it("offers a cancel on both rows once the pair is complete", () => {
    const html = renderStandingsBody(data([alice, bob]), { aId: alice.id, bId: bob.id });
    expect(html.match(/cmp-toggle cmp-armed"/g)?.length).toBe(2);
  });

  it("preserves the ranked metric through every pill href", () => {
    const html = renderStandingsBody(data([alice, bob]), { metric: "return" });
    expect(html).toContain('href="/?by=return&a=a"');
  });
});
