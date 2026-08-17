import type { Bot } from "../../src/bots/bot.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { MarketEvent } from "../../src/domain/market-events.js";
import { buildMorningBrief } from "../../src/observatory/morning-brief.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { aPortfolio, aPosition } from "../support/builders.js";

const sauron = createDefaultPersonas().find((p) => p.id === "sauron");
if (!sauron) throw new Error("fixture setup: sauron persona missing from the default registry");

const PRINTS: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "IR: test" },
  { symbol: "GOOG", date: "2026-09-15", status: "estimate", source: "cadence" },
];

const MACRO_EVENTS: readonly MarketEvent[] = [
  {
    id: "pjm-capacity-auction-2026-09",
    kind: "sector",
    title: "PJM capacity auction window closes",
    date: "2026-09-11",
    status: "estimate",
    source: "EST: test",
    impact: "medium",
    symbols: [],
  },
];

const bot = (personaId: string): Bot => ({
  persona: createDefaultPersonas().find((p) => p.id === personaId) ?? sauron,
  credentials: { apiKey: "k", apiSecret: "s" },
});

describe("buildMorningBrief", () => {
  it("reports persona readiness and thesis even with nothing else configured", async () => {
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      playbookEnv: {},
    });
    expect(brief.personas).toHaveLength(1);
    expect(brief.personas[0]?.personaId).toBe("sauron");
    expect(brief.personas[0]?.thesis).toContain("order");
    expect(typeof brief.personas[0]?.ready).toBe("boolean");
  });

  it("computes each enabled playbook's desired state for today, offline", async () => {
    const brief = await buildMorningBrief("2026-08-10T10:00:00Z", {
      personas: [sauron],
      playbookEnv: { SKYNET_PLAYBOOKS: "S1-NVDA:standard" },
      calendar: PRINTS,
    });
    expect(brief.playbooks).toHaveLength(1);
    expect(brief.playbooks[0]?.id).toBe("S1-NVDA");
    // 2026-08-10 is 16 days before the confirmed 2026-08-26 print — inside S1's long window.
    expect(brief.playbooks[0]?.desiredState).toBe("long");
  });

  it("surfaces unrecognized SKYNET_PLAYBOOKS tokens rather than silently dropping them", async () => {
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      playbookEnv: { SKYNET_PLAYBOOKS: "S1-NVDA:standard,NOT-A-PLAYBOOK:standard" },
      calendar: PRINTS,
    });
    expect(brief.rejectedPlaybookTokens).toEqual(["NOT-A-PLAYBOOK:standard"]);
  });

  it("lists upcoming prints within the window, nearest first", async () => {
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      playbookEnv: { SKYNET_PLAYBOOKS: "S1-NVDA:standard" },
      calendar: PRINTS,
      events: [],
      calendarWindowDays: 60,
    });
    expect(brief.calendar.map((c) => c.title)).toEqual([
      "NVDA earnings print",
      "GOOG earnings print",
    ]);
    expect(brief.calendar[0]?.daysUntil).toBe(13);
  });

  it("widens the calendar section to the full event horizon, not just earnings prints", async () => {
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      playbookEnv: { SKYNET_PLAYBOOKS: "S1-NVDA:standard" },
      calendar: PRINTS,
      events: MACRO_EVENTS,
      calendarWindowDays: 60,
    });
    expect(brief.calendar.map((c) => c.id)).toContain("pjm-capacity-auction-2026-09");
    const macro = brief.calendar.find((c) => c.id === "pjm-capacity-auction-2026-09");
    // the estimate/confirmed label must survive untouched from the domain record
    expect(macro?.status).toBe("estimate");
  });

  it("skips positions entirely when no bots are supplied — no credentials required", async () => {
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      playbookEnv: {},
    });
    expect(brief.positions).toEqual([]);
  });

  it("reads live positions per bot when a brokerFactory is supplied", async () => {
    const portfolio = aPortfolio({
      cash: 250_000,
      positions: [aPosition({ symbol: "NVDA", quantity: 10 })],
    });
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      bots: [bot("sauron")],
      brokerFactory: () => ({
        getPortfolio: () => Promise.resolve(portfolio),
        submit: () => Promise.reject(new Error("not used")),
      }),
      playbookEnv: {},
    });
    expect(brief.positions).toEqual([
      { botId: "sauron", botName: "Sauron", cash: 250_000, positions: portfolio.positions },
    ]);
  });

  it("degrades one bot's broken account to an error row instead of failing the whole brief", async () => {
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      bots: [bot("sauron")],
      brokerFactory: () => ({
        getPortfolio: () => Promise.reject(new Error("401 unauthorized")),
        submit: () => Promise.reject(new Error("not used")),
      }),
      playbookEnv: {},
    });
    expect(brief.positions[0]?.error).toBe("401 unauthorized");
  });

  it("marks live sentiment/momentum as unavailable — the honest seam for the insight loop", async () => {
    const brief = await buildMorningBrief("2026-08-13T10:00:00Z", {
      personas: [sauron],
      playbookEnv: {},
    });
    expect(brief.liveSignal.available).toBe(false);
  });
});
