import { renderCohortsBody } from "../../src/observatory/bots-vs-humans-view.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/**
 * Behavioral specs for the BOTS vs HUMANS view — the aggregate cohort comparison. Covers the
 * two cohort cards, the head-to-head match bar, the nation skylines, and the edge cases a
 * reader would worry about (empty cohorts, an errored account, a lopsided field).
 */

function data(
  participants: ParticipantSnapshot[],
  generatedAt = "2026-07-24T15:30:00.000Z",
): DashboardData {
  return { generatedAt, participants, collisions: [] };
}

describe("renderCohortsBody — cohort cards", () => {
  const humans: ParticipantSnapshot[] = [
    {
      id: "h1",
      displayName: "Ann",
      kind: "human",
      cash: 10_000,
      equity: 120_000,
      positions: [],
    },
    {
      id: "h2",
      displayName: "Bea",
      kind: "human",
      cash: 5_000,
      equity: 100_000,
      positions: [],
    },
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
  const html = renderCohortsBody(data([...humans, ...bots]));

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
    // Humans total (220,000) > bots total (80,000): the human cohort's article carries the
    // "cohort-lead" class, and its opening tag precedes the bot chip that follows it.
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

  it("renders a nation skyline for each cohort", () => {
    const skylines = html.match(/class="empire-skyline"/g) ?? [];
    expect(skylines.length).toBeGreaterThanOrEqual(2);
  });
});

describe("renderCohortsBody — the match bar", () => {
  it("splits the bar by average equity per account, not by headcount", () => {
    const twoHumansOneBot = data([
      {
        id: "h1",
        displayName: "Ann",
        kind: "human",
        cash: 0,
        equity: 120_000,
        positions: [],
      },
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
    const html = renderCohortsBody(twoHumansOneBot);
    // Humans avg 120k, bots avg 80k (2 bots don't move the average) -> 60/40 humans lead.
    expect(html).toContain("Humans 60%");
    expect(html).toContain("40% Bots");
    expect(html).toContain("<strong>Humans</strong> lead the match");
  });

  it("reads dead even when the cohort averages are tied", () => {
    const tied = data([
      {
        id: "h",
        displayName: "H",
        kind: "human",
        cash: 0,
        equity: 100_000,
        positions: [],
      },
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
    const html = renderCohortsBody(tied);
    expect(html).toContain("Dead even — the match is tied");
  });

  it("leans bots when the bot cohort's average equity is higher", () => {
    const botsAhead = data([
      {
        id: "h",
        displayName: "H",
        kind: "human",
        cash: 0,
        equity: 50_000,
        positions: [],
      },
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
    const html = renderCohortsBody(botsAhead);
    expect(html).toContain("<strong>Bots</strong> lead the match");
    expect(html).toContain("75%");
  });
});

describe("renderCohortsBody — the head-to-head read line", () => {
  it("reports the total-equity gap and the average-equity gap between cohorts", () => {
    const uneven = data([
      {
        id: "h1",
        displayName: "Ann",
        kind: "human",
        cash: 0,
        equity: 100_000,
        positions: [],
      },
      {
        id: "h2",
        displayName: "Bea",
        kind: "human",
        cash: 0,
        equity: 100_000,
        positions: [],
      },
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
    const html = renderCohortsBody(uneven);
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

describe("renderCohortsBody — edge cases", () => {
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
    const html = renderCohortsBody(botsOnly);
    expect(html).toContain(
      '<span class="cohort-count num">0<span class="unit"> accounts</span></span>',
    );
    // No participants means no invested capital and no positions in profit — reads as 0%, not NaN.
    expect(html).not.toContain("NaN");
    expect(html).toContain("$0");
  });

  it("renders a human-only field with an empty (zero-count) bot cohort", () => {
    const humansOnly = data([
      {
        id: "h1",
        displayName: "Ann",
        kind: "human",
        cash: 0,
        equity: 100_000,
        positions: [],
      },
    ]);
    const html = renderCohortsBody(humansOnly);
    expect(html).toContain(
      '<span class="cohort-count num">0<span class="unit"> accounts</span></span>',
    );
    expect(html).not.toContain("NaN");
  });

  it("reads dead even with two empty cohorts and shows a dash for best performer", () => {
    const html = renderCohortsBody(data([]));
    expect(html).toContain("Dead even — the match is tied");
    expect(html).not.toContain("NaN");
    // Both "Best" rows fall back to an em dash when a cohort has no participants.
    expect(html).toContain("<dt>Best</dt><dd>—</dd>");
  });

  it("excludes errored accounts from cohort totals and breadth", () => {
    const withError = data([
      {
        id: "h1",
        displayName: "Ann",
        kind: "human",
        cash: 0,
        equity: 100_000,
        positions: [],
      },
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
    const html = renderCohortsBody(withError);
    // Only Ann counts — the errored account is dropped from both the count and the equity total.
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
    const html = renderCohortsBody(withMarkup);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("aggregates a cohort's positions into one blended nation skyline", () => {
    const twoBotsSameTicker = data([
      {
        id: "b1",
        displayName: "Bot A",
        kind: "bot",
        personaId: "x",
        cash: 0,
        equity: 60_000,
        positions: [{ symbol: "NVDA", quantity: 100, avgPrice: 100, marketValue: 11_000 }],
      },
      {
        id: "b2",
        displayName: "Bot B",
        kind: "bot",
        personaId: "y",
        cash: 0,
        equity: 60_000,
        positions: [{ symbol: "NVDA", quantity: 50, avgPrice: 90, marketValue: 5_500 }],
      },
    ]);
    const html = renderCohortsBody(twoBotsSameTicker);
    // Combined market value 11,000 + 5,500 = 16,500 across the blended NVDA position — the
    // nation skyline should reflect the merged holding, not two separate tiny cities.
    expect(html).toContain('class="empire-skyline"');
    expect(html).not.toContain("NaN");
  });
});
