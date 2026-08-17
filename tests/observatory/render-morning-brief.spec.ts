import type { MorningBrief } from "../../src/observatory/morning-brief.js";
import { renderMorningBriefText } from "../../src/observatory/render-morning-brief.js";
import { aPosition } from "../support/builders.js";

const baseBrief: MorningBrief = {
  asOf: "2026-08-13T10:00:00Z",
  personas: [
    {
      personaId: "sauron",
      name: "Sauron",
      thesis: "Impose order on the market's chaos.",
      ready: true,
      readinessReason: "READY — safe, quality 92/100 (threshold 70)",
    },
  ],
  playbooks: [
    {
      id: "S1-NVDA",
      symbol: "NVDA",
      thesis: "pre-print positioning bid",
      evidence: "docs/research/nvda-earnings-cycle.md",
      mode: "standard",
      desiredState: "long",
    },
  ],
  rejectedPlaybookTokens: [],
  calendar: [
    {
      id: "nvda-2026-08-26-print",
      title: "NVDA earnings print",
      symbols: ["NVDA"],
      date: "2026-08-26",
      status: "confirmed",
      daysUntil: 13,
    },
  ],
  positions: [],
  liveSignal: { available: false, note: "not available pre-market" },
};

describe("renderMorningBriefText", () => {
  it("renders every section with the persona's readiness and thesis", () => {
    const text = renderMorningBriefText(baseBrief);
    expect(text).toContain("PERSONAS");
    expect(text).toContain("Sauron — READY");
    expect(text).toContain("Impose order on the market's chaos.");
  });

  it("shows each playbook's desired state today, uppercased", () => {
    const text = renderMorningBriefText(baseBrief);
    expect(text).toContain("S1-NVDA (standard) — LONG today");
  });

  it("flags a rejected SKYNET_PLAYBOOKS token instead of hiding it", () => {
    const text = renderMorningBriefText({
      ...baseBrief,
      rejectedPlaybookTokens: ["NOT-A-PLAYBOOK:standard"],
    });
    expect(text).toContain("unrecognized token(s): NOT-A-PLAYBOOK:standard");
  });

  it("lists the event calendar with days-until", () => {
    const text = renderMorningBriefText(baseBrief);
    expect(text).toContain("EVENT CALENDAR");
    expect(text).toContain("NVDA");
    expect(text).toContain("2026-08-26");
    expect(text).toContain("13d");
  });

  it("renders a market-wide macro event alongside earnings prints", () => {
    const text = renderMorningBriefText({
      ...baseBrief,
      calendar: [
        ...baseBrief.calendar,
        {
          id: "cpi-2026-09-11",
          title: "CPI release (Aug 2026 data)",
          symbols: [],
          date: "2026-09-11",
          status: "confirmed",
          daysUntil: 29,
        },
      ],
    });
    expect(text).toContain("CPI release (Aug 2026 data)");
    expect(text).toContain("2026-09-11");
  });

  it("states the live-signal gap honestly rather than showing zeros", () => {
    const text = renderMorningBriefText(baseBrief);
    expect(text).toContain("LIVE SIGNAL");
    expect(text).toContain("not available pre-market");
  });

  it("renders live signal data once available (the future seam)", () => {
    const text = renderMorningBriefText({
      ...baseBrief,
      liveSignal: { available: true, bySymbol: { NVDA: { sentiment: 0.42, momentum: 0.015 } } },
    });
    expect(text).toContain("NVDA");
    expect(text).toContain("sentiment 0.42");
    expect(text).toContain("momentum 0.015");
  });

  it("says positions need bot credentials when none were supplied", () => {
    const text = renderMorningBriefText(baseBrief);
    expect(text).toContain("no bots supplied");
  });

  it("shows cash and each open position for a healthy bot account", () => {
    const text = renderMorningBriefText({
      ...baseBrief,
      positions: [
        {
          botId: "sauron",
          botName: "Sauron",
          cash: 250_000,
          positions: [aPosition({ symbol: "NVDA", quantity: 10, avgPrice: 187.2 })],
        },
      ],
    });
    expect(text).toContain("Sauron — $250,000 cash, 1 open position(s)");
    expect(text).toContain("NVDA");
    expect(text).toContain("x10");
  });

  it("shows an error row for a bot whose account couldn't be read", () => {
    const text = renderMorningBriefText({
      ...baseBrief,
      positions: [{ botId: "sauron", botName: "Sauron", error: "401 unauthorized" }],
    });
    expect(text).toContain("Sauron — ERROR: 401 unauthorized");
  });
});
