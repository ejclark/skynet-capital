import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import {
  renderAcademyBody,
  renderCompareBody,
  renderDashboardBody,
  renderIndividualBody,
} from "../../src/observatory/render-dashboard.js";
import { sampleDashboardData } from "../../src/observatory/sample-dashboard-data.js";

describe("renderDashboardBody", () => {
  const html = renderDashboardBody(sampleDashboardData());

  it("renders each participant with their kind chip", () => {
    expect(html).toContain("The News Fader");
    expect(html).toContain("BOT · news-fader");
    expect(html).toContain("Eric");
    expect(html).toContain(">HUMAN<");
  });

  it("shows a gain in the positive class and a loss in the negative class", () => {
    // News Fader EEM: mktValue 528,000 vs cost 12,000*42.10 = 505,200 -> +22,800 (gain)
    expect(html).toContain("+$22,800");
    // Futurist NVDA: mktValue 98,400 vs cost 800*140 = 112,000 -> -13,600 (loss)
    expect(html).toContain("-$13,600");
    expect(html).toContain('class="num neg"');
    expect(html).toContain('class="num pos"');
  });

  it("renders an error state for an unreachable account", () => {
    const withError: DashboardData = {
      generatedAt: "2026-07-24T15:30:00.000Z",
      participants: [
        {
          id: "x",
          displayName: "Broken Bot",
          kind: "bot",
          personaId: "futurist",
          cash: 0,
          equity: 0,
          positions: [],
          error: "AlpacaApiError 401",
        },
      ],
    };

    const errHtml = renderDashboardBody(withError);
    expect(errHtml).toContain("card-error");
    expect(errHtml).toContain("Account unreachable");
  });

  it("renders a recent-activity feed with the trade", () => {
    expect(html).toContain("Recent Activity");
    expect(html).toContain(">BUY<");
    // VWO fill from Eric's activity is present.
    expect(html).toContain("VWO");
  });

  it("renders Eric's activity times in his timezone (Chicago), not UTC", () => {
    // 14:05 UTC is 09:05 in America/Chicago (CDT). The Chicago label must appear.
    expect(html).toContain("CDT");
    expect(html).toContain("09:05");
  });

  it("escapes HTML in participant names", () => {
    const data: DashboardData = {
      generatedAt: "2026-07-24T15:30:00.000Z",
      participants: [
        { id: "x", displayName: "<script>", kind: "human", cash: 0, equity: 0, positions: [] },
      ],
    };
    expect(renderDashboardBody(data)).not.toContain("<script>");
  });
});

describe("renderCompareBody — two cities", () => {
  const data: DashboardData = {
    generatedAt: "2026-07-24T15:30:00.000Z",
    participants: [
      {
        id: "tech-bot",
        displayName: "Tech Titan",
        kind: "bot",
        personaId: "futurist",
        cash: 10_000,
        equity: 120_000,
        positions: [
          { symbol: "NVDA", quantity: 100, avgPrice: 900, marketValue: 100_000 },
          { symbol: "META", quantity: 20, avgPrice: 500, marketValue: 10_000 },
        ],
      },
      {
        id: "index-human",
        displayName: "Index Ivy",
        kind: "human",
        cash: 25_000,
        equity: 90_000,
        positions: [{ symbol: "EEM", quantity: 1_000, avgPrice: 42, marketValue: 65_000 }],
      },
    ],
  };

  const html = renderCompareBody(data, { aId: "tech-bot", bId: "index-human" });

  it("renders one empire skyline per participant (two cities)", () => {
    const skylines = html.match(/class="empire-skyline"/g) ?? [];
    expect(skylines).toHaveLength(2);
    expect(html).toContain("empire-cities");
  });

  it("labels each city with its participant's displayName", () => {
    expect(html).toContain('class="empire-city-name">Tech Titan<');
    expect(html).toContain('class="empire-city-name">Index Ivy<');
  });
});

describe("observer mode (funnel front door)", () => {
  const nav = {
    active: "board" as const,
    canAdd: true,
    authed: true,
  };

  it("shows the observer hero when signed in with no linked account", () => {
    const html = renderDashboardBody(sampleDashboardData(), { nav });
    expect(html).toContain("OBSERVER MODE");
    expect(html).toContain('href="/welcome"');
    expect(html).toContain('href="/add"');
  });

  it("hides the observer hero once the viewer has a linked account", () => {
    const html = renderDashboardBody(sampleDashboardData(), {
      nav: { ...nav, currentId: "human-eric" },
    });
    expect(html).not.toContain("OBSERVER MODE");
  });

  it("does not show the observer hero on the bare embed (no nav)", () => {
    const html = renderDashboardBody(sampleDashboardData());
    expect(html).not.toContain("OBSERVER MODE");
  });
});

describe("renderAcademyBody — the gamified journey", () => {
  const nav = { active: "learn" as const, canAdd: true, authed: true };
  const html = renderAcademyBody({ nav });

  it("frames it as a game with points and rank, not homework", () => {
    expect(html).toContain("Your trading journey");
    expect(html).toContain("data-points");
    expect(html).toContain("data-rank");
  });

  it("teaches the Wheel as the first playbook, starting with buying stock", () => {
    expect(html).toContain("The Wheel");
    expect(html).toContain("Buy the stock");
    expect(html).toContain("Buy your first stock");
    expect(html).toContain("Sell your first cash-covered put");
  });

  it("opens course 100 and locks course 200 until it's complete", () => {
    expect(html).toContain('data-course="100" open');
    expect(html).toContain('data-course="200"');
    expect(html).not.toContain('data-course="200" open');
    expect(html).toContain("Finish the level below");
  });

  it("keeps risky strategies out of reach with an explicit teaser", () => {
    expect(html).toContain("unlock as you climb");
    // long options are a level-200 unlock, not shown as an open course
    expect(html).toContain("Buy your first long call");
    // undefined-risk plays (short straddle) are not surfaced here at all yet
    expect(html).not.toContain("Short Straddle");
  });

  it("awards points on milestones", () => {
    expect(html).toContain("data-ms-check");
    expect(html).toMatch(/\+\d+/); // a points value like +25
  });
});

describe("renderIndividualBody — autonomous decisions panel", () => {
  const bot = {
    id: "day-trader",
    displayName: "Day Trader",
    kind: "bot" as const,
    personaId: "day-trader",
    cash: 500_000,
    equity: 1_000_000,
    positions: [],
  };
  const human = {
    id: "human-eric",
    displayName: "Eric",
    kind: "human" as const,
    cash: 500_000,
    equity: 1_000_000,
    positions: [],
  };

  it("renders a bot's recent decisions with mode and rationale", () => {
    const html = renderIndividualBody(bot, {
      decisions: [
        {
          at: Date.parse("2026-07-24T14:00:00Z"),
          personaId: "day-trader",
          mode: "observe",
          rawIntents: [],
          guardedIntents: [],
          outcomes: [
            {
              intent: {
                symbol: "NVDA",
                side: "buy",
                quantity: 5,
                type: "market",
                reason: "momentum",
              },
              action: "observed",
            },
          ],
        },
        {
          at: Date.parse("2026-07-24T14:05:00Z"),
          personaId: "day-trader",
          mode: "live",
          rawIntents: [],
          guardedIntents: [],
          outcomes: [],
          halted: "manual",
        },
      ],
    });
    expect(html).toContain("Autonomous decisions");
    expect(html).toContain("OBSERVE");
    expect(html).toContain("would place buy 5 NVDA — momentum");
    expect(html).toContain("HALTED");
    expect(html).toContain("manual");
  });

  it("shows the honest seam for a bot with no trail wired", () => {
    const html = renderIndividualBody(bot);
    expect(html).toContain("Autonomous decisions");
    expect(html).toContain("every cycle it decides");
  });

  it("never shows the decisions panel for a human", () => {
    const html = renderIndividualBody(human, { decisions: [] });
    expect(html).not.toContain("Autonomous decisions");
  });
});
