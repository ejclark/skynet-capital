import {
  renderAcademyBody,
  renderIndividualBody,
  renderPortfolioIndexBody,
} from "../../src/observatory/render-dashboard.js";

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
    expect(html).toContain("Sell your first cash-secured put");
  });

  it("opens course 100 and locks the higher courses until each level below is complete", () => {
    expect(html).toContain('data-course="stock-basics" open');
    expect(html).toContain('data-course="the-wheel"');
    expect(html).not.toContain('data-course="the-wheel" open');
    expect(html).toContain('data-course="directional-longs"');
    expect(html).not.toContain('data-course="directional-longs" open');
    expect(html).toContain("Finish the level below");
  });

  it("stacks the community track beside level 100 and never locks it — it gates no trade", () => {
    expect(html).toContain('data-course="community" open');
    expect(html.indexOf('data-course="community"')).toBeLessThan(
      html.indexOf('data-course="the-wheel"'),
    );
    expect(html).toContain("File your first piece of feedback");
    expect(html).toContain('href="/feedback">share feedback →');
  });

  it("keeps risky strategies out of reach with an explicit teaser", () => {
    expect(html).toContain("unlock as you climb");
    // long options are a level-200 unlock, not shown as an open course
    expect(html).toContain("Buy your first long call");
    // undefined-risk plays (short straddle) are not surfaced here at all yet
    expect(html).not.toContain("Short Straddle");
  });

  it("offers no self-marking — milestones are earned by fills, never checked off", () => {
    expect(html).not.toContain("data-ms-check");
    expect(html).not.toContain("checkbox");
    expect(html).not.toContain("skynet.academy.done");
    expect(html).toMatch(/\+\d+/); // a points value like +25
    expect(html).toContain("Nothing here is self-marked");
  });

  it("renders an earned milestone with its fill date and order id as the proof", () => {
    const withProgress = renderAcademyBody({
      nav,
      progress: {
        earned: [
          {
            milestoneId: "first-buy",
            code: "101",
            orderId: "order-9f3c",
            at: "2026-08-25T14:30:00.000Z",
          },
        ],
        points: 25,
        rank: { title: "Apprentice", atPoints: 25 },
        unlockedLevels: new Set([100 as const]),
      },
    });
    expect(withProgress).toContain('class="ms done"');
    expect(withProgress).toContain("filled 2026-08-25 · order order-9f3c");
    expect(withProgress).toContain(">Apprentice<");
    expect(withProgress).toContain("data-points>25<");
    // an earned milestone no longer needs its "open the ticket" nudge
    expect(withProgress.split('data-ms="first-buy"')[1]?.split("</div>")[0]).not.toContain("ms-go");
  });

  it("renders an earned community milestone with its FILED date and issue number as the proof", () => {
    const withProgress = renderAcademyBody({
      nav,
      progress: {
        earned: [],
        points: 15,
        rank: { title: "Observer", atPoints: 0 },
        unlockedLevels: new Set([100 as const]),
        contributions: [
          { milestoneId: "first-feedback", issueNumber: 567, at: "2026-08-25T14:30:00.000Z" },
        ],
      },
    });
    expect(withProgress).toContain("filed 2026-08-25 · issue #567");
    // never "filled" — a filing is not a trade, and the copy must not imply it was
    expect(withProgress).not.toContain("filled 2026-08-25 · issue");
    expect(withProgress.split('data-ms="first-feedback"')[1]?.split("</div>")[0]).not.toContain(
      "ms-go",
    );
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

describe("renderPortfolioIndexBody — the member's accounts index (/u)", () => {
  const nav = { active: "you" as const, canAdd: true, authed: true, currentId: "human-eric" };
  const account = (overrides: Record<string, unknown> = {}) => ({
    id: "human-eric",
    displayName: "Eric",
    kind: "human" as const,
    cash: 40_000,
    equity: 100_000,
    positions: [{ symbol: "NVDA", quantity: 100, avgPrice: 500, marketValue: 60_000 }],
    ...overrides,
  });

  it("opens with the Portfolio eyebrow, an honest count line, and a combined-equity hero", () => {
    const html = renderPortfolioIndexBody([account()], { nav });

    expect(html).toContain("Portfolio");
    expect(html).toContain("Your accounts");
    expect(html).toContain("1 Alpaca paper account — 1 human");
    expect(html).toContain("Combined equity");
    expect(html).toContain("$100,000");
  });

  it("sums equity, cash, invested, and unrealized across every readable account", () => {
    const bot = account({
      id: "news-fader",
      displayName: "News Fader",
      kind: "bot",
      personaId: "news-fader",
      cash: 10_000,
      equity: 50_000,
      positions: [{ symbol: "TSM", quantity: 10, avgPrice: 100, marketValue: 2_000 }],
    });
    const html = renderPortfolioIndexBody([account(), bot], { nav });

    expect(html).toContain("$150,000"); // combined equity
    expect(html).toContain("$50,000"); // combined cash
    expect(html).toContain("$62,000"); // combined invested
    expect(html).toContain("2 Alpaca paper accounts — 1 human, 1 bot");
  });

  it("links each row to that account's desk with a YOU mark", () => {
    const html = renderPortfolioIndexBody([account()], { nav });

    expect(html).toContain('href="/u/human-eric"');
    expect(html).toContain("you-mark");
  });

  it("lists an unreachable account but excludes it from the combined figures", () => {
    const dead = account({ id: "b", displayName: "Broken", error: "AlpacaApiError 401" });
    const html = renderPortfolioIndexBody([account(), dead], { nav });

    expect(html).toContain("unreachable");
    expect(html).toContain("$100,000"); // only the readable account's equity
    expect(html).toContain("1 account unreachable — excluded from the combined figures above.");
  });

  it("renders the honest empty state with a connect CTA when nothing is owned", () => {
    const html = renderPortfolioIndexBody([], { nav });

    expect(html).toContain("No accounts linked yet");
    expect(html).toContain('href="/add"');
  });

  it("omits the connect CTA when the viewer cannot add an account", () => {
    const html = renderPortfolioIndexBody([], { nav: { ...nav, canAdd: false } });

    expect(html).not.toContain('href="/add"');
  });
});
