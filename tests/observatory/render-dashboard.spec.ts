import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import {
  renderAcademyBody,
  renderCompareBody,
  renderIndividualBody,
} from "../../src/observatory/render-dashboard.js";

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
    collisions: [],
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

  it("invites the first play on your OWN funded-but-untraded desk", () => {
    const html = renderIndividualBody(human, { isSelf: true });
    expect(html).toContain("founding-cta");
    expect(html).toContain("Begin the Wheel");
  });

  it("does not show the founding CTA when you already hold positions", () => {
    const funded = {
      ...human,
      positions: [{ symbol: "NVDA", quantity: 1, avgPrice: 100, marketValue: 120 }],
    };
    const html = renderIndividualBody(funded, { isSelf: true });
    expect(html).not.toContain("Begin the Wheel"); // CTA copy is markup-only (the class lives in CSS always)
  });

  it("does not show the founding CTA on someone else's desk", () => {
    const html = renderIndividualBody(human, { isSelf: false });
    expect(html).not.toContain("Begin the Wheel"); // CTA copy is markup-only (the class lives in CSS always)
  });

  it("offers a rotate-credentials link on your own unreachable account page", () => {
    const html = renderIndividualBody({ ...human, error: "AlpacaApiError 401" }, { isSelf: true });
    expect(html).toContain('<a href="/rotate">');
  });

  it("omits the rotate link on someone else's unreachable account page", () => {
    const html = renderIndividualBody({ ...human, error: "AlpacaApiError 401" }, { isSelf: false });
    expect(html).not.toContain("/rotate");
  });
});
