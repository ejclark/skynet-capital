import {
  agoText,
  type Heartbeat,
  heartbeatLine,
  type PlaybookHeartbeat,
  sinceText,
} from "../../src/live/heartbeat";

const hb = (over: Partial<Heartbeat> = {}): Heartbeat => ({
  state: "beating",
  marketOpen: true,
  lastPassAt: "2026-09-24T15:00:00Z",
  sinceLastPassMs: 22_000,
  cadenceMs: 15_000,
  staleAfterMs: 120_000,
  playbooks: null,
  ...over,
});

describe("heartbeatLine — a glyph and a word for every state, never hue alone", () => {
  it("beating names how recent the last pass was", () => {
    expect(heartbeatLine(hb())).toEqual({
      glyph: "●",
      word: "Beating",
      detail: "last pass 22s ago",
    });
  });

  it("stale names how long the silence has run", () => {
    expect(heartbeatLine(hb({ state: "stale", sinceLastPassMs: 7 * 60_000 }))).toMatchObject({
      glyph: "▲",
      word: "Stale",
      detail: "no pass for 7 min",
    });
  });

  it("market-closed says idle, and leaves the open time to the topbar clock", () => {
    const line = heartbeatLine(hb({ state: "market-closed", sinceLastPassMs: 16 * 3_600_000 }));
    expect(line).toMatchObject({
      glyph: "◐",
      word: "Market closed",
      detail: "idle, last pass 16h ago",
    });
    expect(line.detail).not.toMatch(/open/i);
  });

  it("no-record says the bot hasn't run", () => {
    expect(
      heartbeatLine(hb({ state: "no-record", lastPassAt: null, sinceLastPassMs: null })),
    ).toMatchObject({ glyph: "○", word: "No passes yet" });
  });
});

describe("agoText", () => {
  it("picks the unit a person would say", () => {
    expect(agoText(45_000)).toBe("45s");
    expect(agoText(7 * 60_000)).toBe("7 min");
    expect(agoText(5 * 3_600_000)).toBe("5h");
    expect(agoText(3 * 86_400_000)).toBe("3 days");
  });
});

describe("sinceText", () => {
  const p = (since: string, sinceIsLowerBound = false): PlaybookHeartbeat => ({
    playbookId: "S1-NVDA",
    mode: "standard",
    state: "no-window",
    since,
    sinceIsLowerBound,
  });
  const now = new Date("2026-09-24T18:00:00Z");

  it("says 'at least since' when the run may be older than the passes on hand", () => {
    expect(sinceText(p("2026-09-22T15:00:00Z", true), now)).toMatch(/^at least since /);
    expect(sinceText(p("2026-09-22T15:00:00Z", false), now)).toMatch(/^since /);
  });
});
