import {
  agoText,
  entryDateText,
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
  // #5044: "Beating" read as "beating the market". The chip measures one thing — whether the bot
  // is checking the market, and when it last did — so its words say exactly that.
  it("running names how recent the last check of the market was", () => {
    expect(heartbeatLine(hb())).toEqual({
      glyph: "●",
      word: "Running",
      detail: "checked the market 22s ago",
    });
  });

  it("not checking names when the last check was", () => {
    expect(heartbeatLine(hb({ state: "stale", sinceLastPassMs: 7 * 60_000 }))).toMatchObject({
      glyph: "▲",
      word: "Not checking",
      detail: "last check 7 min ago",
    });
  });

  // #4949: the server calls a closed market stale once the bot sat out the whole last session.
  it("not checking with the market closed says the bot missed the last session, never idle", () => {
    const line = heartbeatLine(
      hb({ state: "stale", marketOpen: false, sinceLastPassMs: 3 * 86_400_000 }),
    );
    expect(line).toMatchObject({
      glyph: "▲",
      word: "Not checking",
      detail: "no check last session",
    });
    expect(line.detail).not.toMatch(/idle/);
  });

  it("market-closed says what the bot does, names the last check, and leaves the market's state and open time to the top bar", () => {
    const line = heartbeatLine(hb({ state: "market-closed", sinceLastPassMs: 16 * 3_600_000 }));
    expect(line).toMatchObject({
      glyph: "◐",
      word: "Waiting for the open",
      detail: "last check 16h ago",
    });
    // #5072: never a second market badge beside the top bar's — no "Market closed" here
    expect(line.word).not.toMatch(/market closed/i);
    expect(line.detail).not.toMatch(/open/i);
  });

  it("no-record says the bot hasn't run, once", () => {
    expect(
      heartbeatLine(hb({ state: "no-record", lastPassAt: null, sinceLastPassMs: null })),
    ).toEqual({ glyph: "○", word: "Hasn't run yet", detail: "" });
  });

  it("no state's words imply a comparison with the market or anyone else", () => {
    const lines = [
      hb(),
      hb({ state: "stale", sinceLastPassMs: 7 * 60_000 }),
      hb({ state: "stale", marketOpen: false, sinceLastPassMs: 3 * 86_400_000 }),
      hb({ state: "market-closed", marketOpen: false, sinceLastPassMs: 16 * 3_600_000 }),
      hb({ state: "no-record", lastPassAt: null, sinceLastPassMs: null }),
    ].map(heartbeatLine);
    for (const { word, detail } of lines) {
      expect(`${word} ${detail}`).not.toMatch(/beat|outperform|ahead|behind|\bvs\b|than/i);
    }
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

describe("entryDateText — the day an On playbook's window next opens (#4450 slice 1)", () => {
  it("reads a date-only entry day as that day, never the one before it", () => {
    // A bare `YYYY-MM-DD` parses as UTC midnight, which is the previous evening in every US
    // offset — the off-by-one this helper exists to prevent. Asserted as "the day number is 2 and
    // the month is November", so it holds under any runner locale.
    const text = entryDateText("2026-11-02");
    expect(text).toMatch(/\b2\b/);
    expect(text).not.toMatch(/\b1\b/);
    expect(text.toLowerCase()).toContain("nov");
  });
});
