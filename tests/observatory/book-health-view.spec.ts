import type { CheckWeekRows } from "../../src/autonomous/decision-db-week.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, PlaybookVerdictState } from "../../src/domain/types.js";
import type { GuardRefusalReason } from "../../src/engine/guards.js";
import {
  capitalized,
  openedOn,
  playName,
  sessionsHeld,
} from "../../src/observatory/book-health-detectors.js";
import { detectLooping } from "../../src/observatory/book-health-looping.js";
import {
  BOOK_HEALTH_THRESHOLDS,
  type BookHealthInput,
  type BookHealthView,
  bookHealthCounts,
  bookHealthView,
  type HealthDetector,
} from "../../src/observatory/book-health-view.js";
import { REFUSAL_LABEL } from "../../src/observatory/decision-json-view.js";
import type { OpenLot } from "../../src/trading/round-trips.js";
import { aPortfolio, aPosition, aQuote, aSubscription } from "../support/builders.js";

/**
 * Book health (#5493 slice 1): the five detectors as data, each firing, clearing and crossing its
 * level, read the way a member will — the owner sees which play, anyone else does not (#885).
 */

const AS_OF = "2026-10-16T18:00:00.000Z"; // a Friday, mid-session
const BUCKET = 30 * 60_000;
const PUT = "CRWV261113P00080000"; // one sold $80 put: $8,000 set aside
const baskets = new Map([
  ["S1-NVDA", ["NVDA"]],
  ["CRWV-WHEEL", ["CRWV"]],
]);

const intent = (playbookId: string, over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "a test intent",
  playbookId,
  ...over,
});

const pass = (iso: string, over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: Date.parse(iso),
  personaId: "sauron",
  mode: "live",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...over,
});

/** `count` passes a minute apart on 2026-10-16, newest first, each refusing S1-NVDA for `reason`. */
const refusedPasses = (count: number, reason: GuardRefusalReason = "options-level") =>
  Array.from({ length: count }, (_, i) => {
    const ask = intent("S1-NVDA");
    return pass(`2026-10-16T17:${String(59 - i).padStart(2, "0")}:00.000Z`, {
      rawIntents: [ask],
      refusals: [{ intent: ask, reason }],
    });
  });

/** A week of grouped verdicts: one bucket per day, mid-session. */
const weekOf = (
  days: readonly string[],
  state: PlaybookVerdictState,
  trades: CheckWeekRows["trades"] = [],
): BookHealthInput["week"] => ({
  bucketMs: BUCKET,
  rows: {
    checks: [],
    verdicts: days.map((day) => ({
      bucket: Math.floor(Date.parse(`${day}T16:00:00.000Z`) / BUCKET),
      playbookId: "S1-NVDA",
      mode: "standard",
      state,
      n: 12,
    })),
    trades,
  },
});
const FIVE_DAYS = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"];

const lot = (symbol: string, quantity: number, at: string, over: Partial<OpenLot> = {}) => ({
  symbol,
  quantity,
  price: 180,
  at,
  ...over,
});

const read = (over: Partial<BookHealthInput> = {}): BookHealthView =>
  bookHealthView({
    asOf: AS_OF,
    portfolio: aPortfolio({ cash: 10_000, positions: [] }),
    subscriptions: [],
    baskets,
    ownerView: true,
    ...over,
  });

const only = (view: BookHealthView, detector: HealthDetector) =>
  view.findings.filter((f) => f.detector === detector);

/** $10,000 of equity: `cash` plus NVDA shares marked at `shares` dollars. */
const nvdaBook = (cash: number, shares: number) =>
  aPortfolio({
    cash,
    positions: [aPosition({ symbol: "NVDA", quantity: 10, avgPrice: 150, marketValue: shares })],
  });

describe("book health — LOOPING: a play that looks on but goes round and round", () => {
  it("fires when one guard refused the play on every one of six checks it proposed on", () => {
    const [looping] = only(read({ records: refusedPasses(6) }), "looping");
    expect(looping).toMatchObject({
      level: "signal",
      playbookId: "S1-NVDA",
      loop: "options-level",
      reading: 6,
      threshold: BOOK_HEALTH_THRESHOLDS.loopingCycles,
    });
    expect(looping?.words).toContain("refused every time");
    expect(looping?.words).toContain(REFUSAL_LABEL["options-level"]);
  });

  it("stays quiet under the cycle count, and when the refusals' reasons differ", () => {
    expect(only(read({ records: refusedPasses(5) }), "looping")).toEqual([]);
    const mixed = [...refusedPasses(5), ...refusedPasses(1, "insufficient-cash")];
    expect(only(read({ records: mixed }), "looping")).toEqual([]);
  });

  it("reads only the last session's passes — yesterday's refusals do not carry over", () => {
    const yesterday = refusedPasses(6).map((r) => ({ ...r, at: r.at - 86_400_000 }));
    const records = [pass("2026-10-16T17:59:30.000Z"), ...yesterday];
    const view = read({ records });
    expect(view.lastSession).toBe("2026-10-16");
    expect(only(view, "looping")).toEqual([]);
  });

  it("fires when every check of the last five sessions found no window", () => {
    const [looping] = only(read({ week: weekOf(FIVE_DAYS, "no-window") }), "looping");
    expect(looping).toMatchObject({ loop: "no-window", reading: 5, level: "signal" });
    expect(looping?.words).toContain("no window on every check in its last 5 sessions");
  });

  it("needs the full run of sessions, all of them one answer", () => {
    expect(only(read({ week: weekOf(FIVE_DAYS.slice(1), "no-window") }), "looping")).toEqual([]);
    const week = weekOf(FIVE_DAYS, "no-window");
    const rows = week?.rows as CheckWeekRows;
    const flatToday = { ...rows.verdicts[4], state: "flat" } as CheckWeekRows["verdicts"][number];
    const mixed = { ...week, rows: { ...rows, verdicts: [...rows.verdicts, flatToday] } };
    expect(only(read({ week: mixed as BookHealthInput["week"] }), "looping")).toEqual([]);
  });

  it("fires on a window open every session with nothing entered, and clears once a trade is placed", () => {
    const [open] = only(read({ week: weekOf(FIVE_DAYS, "flat") }), "looping");
    expect(open).toMatchObject({ loop: "open-no-entry", playbookId: "S1-NVDA" });
    const trade = {
      at: Date.parse("2026-10-14T16:00:00Z"),
      symbol: "NVDA",
      side: "buy" as const,
      playbookId: "S1-NVDA",
    };
    expect(only(read({ week: weekOf(FIVE_DAYS, "flat", [trade]) }), "looping")).toEqual([]);
  });

  it("can be called on its own with a lower cycle line", () => {
    const view = read();
    const reading = {
      portfolio: aPortfolio(),
      book: { cash: 0, cashByUnderlying: new Map(), sharesByUnderlying: new Map() },
      equity: view.equity,
      uncommittedCash: view.uncommittedCash,
      quotes: {},
      asOf: AS_OF,
      thresholds: { ...BOOK_HEALTH_THRESHOLDS, loopingCycles: 2 },
      ownerView: true,
    };
    const session = refusedPasses(2);
    const found = detectLooping({ session, records: session, subscriptions: [] }, reading);
    expect(found.map((f) => f.loop)).toEqual(["options-level"]);
  });
});

describe("book health — IDLE: cash nothing has claimed", () => {
  it("signals above 60% of equity, never as a gate", () => {
    const [idle] = only(read({ portfolio: nvdaBook(7_000, 3_000) }), "idle");
    expect(idle).toMatchObject({ level: "signal", reading: 0.7, threshold: 0.6 });
    expect(idle?.words).toMatch(/^70% of this account's equity is cash nothing has claimed/);
  });

  it("clears at the line, and counts a sold put's collateral as claimed", () => {
    expect(only(read({ portfolio: nvdaBook(6_000, 4_000) }), "idle")).toEqual([]);
    const secured = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2, marketValue: -200 })],
    });
    const view = read({ portfolio: secured });
    expect(view.uncommittedCash).toBe(2_000);
    expect(only(view, "idle")).toEqual([]);
  });
});

describe("book health — CONCENTRATED: one underlying over a share of equity", () => {
  it("signals above 25% and gates above 40%", () => {
    expect(only(read({ portfolio: nvdaBook(7_000, 3_000) }), "concentrated")[0]).toMatchObject({
      level: "signal",
      symbol: "NVDA",
      threshold: 0.25,
    });
    expect(only(read({ portfolio: nvdaBook(5_500, 4_500) }), "concentrated")[0]).toMatchObject({
      level: "gate",
      threshold: 0.4,
    });
  });

  it("stays quiet at exactly 25%", () => {
    expect(only(read({ portfolio: nvdaBook(7_500, 2_500) }), "concentrated")).toEqual([]);
  });

  it("counts the cash held to secure a sold put toward its underlying", () => {
    const portfolio = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2, marketValue: -200 })],
    });
    const [crwv] = only(read({ portfolio }), "concentrated");
    expect(crwv).toMatchObject({ symbol: "CRWV", level: "gate" });
    expect(crwv?.words).toMatch(/^CRWV is 82% of this account's equity/);
  });

  it("values shares at the live quote when one is on hand", () => {
    const view = read({
      portfolio: nvdaBook(4_000, 3_000),
      quotes: { NVDA: aQuote({ symbol: "NVDA", last: 200 }) },
    });
    expect(view.equity).toBe(6_000);
    expect(only(view, "concentrated")[0]?.reading).toBeCloseTo(2_000 / 6_000);
  });
});

describe("book health — STUCK BY AGE: held past what the play declares", () => {
  const s1 = aSubscription("sauron", "S1-NVDA", { capitalAllocated: 5_000 });
  const intraday = new Map([["S1-NVDA", { intraday: true }]]);
  const heldSince = (at: string, over: Partial<BookHealthInput> = {}) =>
    read({
      portfolio: nvdaBook(8_200, 1_800),
      subscriptions: [s1],
      openLots: [lot("NVDA", 10, at)],
      holds: intraday,
      ...over,
    });

  it("signals on an intraday play's third session and gates on its fifth", () => {
    expect(only(heldSince("2026-10-14T15:00:00Z"), "stuck")).toEqual([]);
    expect(only(heldSince("2026-10-13T15:00:00Z"), "stuck")[0]).toMatchObject({
      level: "signal",
      symbol: "NVDA",
      reading: 3,
      threshold: 3,
    });
    const [gate] = only(heldSince("2026-10-09T15:00:00Z"), "stuck");
    expect(gate).toMatchObject({ level: "gate", reading: 5, threshold: 5 });
    expect(gate?.words).toContain("a play meant to close within the day");
  });

  it("reads a play-supplied expected hold: past it a signal, two sessions further a gate", () => {
    const holds = new Map([["S1-NVDA", { expectedHoldSessions: 2 }]]);
    expect(only(heldSince("2026-10-14T15:00:00Z", { holds }), "stuck")).toEqual([]);
    expect(only(heldSince("2026-10-13T15:00:00Z", { holds }), "stuck")[0]?.level).toBe("signal");
    expect(only(heldSince("2026-10-09T15:00:00Z", { holds }), "stuck")[0]?.level).toBe("gate");
  });

  it("produces nothing for a play that declares no hold, however old the position", () => {
    expect(only(heldSince("2026-09-01T15:00:00Z", { holds: new Map() }), "stuck")).toEqual([]);
  });

  it("leaves the age undefined — never 0 — when the open lots do not account for the position", () => {
    const view = heldSince("2026-10-01T15:00:00Z", {
      openLots: [lot("NVDA", 4, "2026-10-01T15:00:00Z")],
    });
    expect(only(view, "stuck")).toEqual([]);
    expect(view.plays?.[0]?.openPositions).toBe(1);
    expect(view.plays?.[0]?.oldestOpenSessions).toBeUndefined();
    expect(
      read({ portfolio: nvdaBook(8_200, 1_800), subscriptions: [s1] }).plays?.[0]
        ?.oldestOpenSessions,
    ).toBeUndefined();
  });
});

describe("book health — IMBALANCED, the placeholder for a play with no target", () => {
  const budget = (over = {}) =>
    aSubscription("sauron", "S1-NVDA", { capitalAllocated: 2_000, ...over });

  it("signals when an enabled play has over 90% of its allocation committed", () => {
    const [high] = only(
      read({ portfolio: nvdaBook(8_100, 1_900), subscriptions: [budget()] }),
      "imbalanced",
    );
    expect(high).toMatchObject({ level: "signal", playbookId: "S1-NVDA", threshold: 0.9 });
    expect(high?.reading).toBeCloseTo(0.95);
    expect(high?.words).toContain("95% of its $2,000 budget committed");
  });

  it("signals under 10%, unless the play is switched off or out of its window", () => {
    const thin = { portfolio: nvdaBook(9_900, 100), subscriptions: [budget()] };
    expect(only(read(thin), "imbalanced")[0]?.threshold).toBe(0.1);
    expect(
      only(read({ ...thin, subscriptions: [budget({ enabled: false })] }), "imbalanced"),
    ).toEqual([]);
    const outOfWindow = pass("2026-10-16T17:59:00Z", {
      playbookVerdicts: [{ playbookId: "S1-NVDA", mode: "standard", state: "no-window" }],
    });
    expect(only(read({ ...thin, records: [outOfWindow] }), "imbalanced")).toEqual([]);
  });

  it("stays quiet in the band, and for an uncapped play", () => {
    expect(
      only(read({ portfolio: nvdaBook(9_000, 1_000), subscriptions: [budget()] }), "imbalanced"),
    ).toEqual([]);
    const uncapped = aSubscription("sauron", "S1-NVDA");
    expect(
      only(read({ portfolio: nvdaBook(8_100, 1_900), subscriptions: [uncapped] }), "imbalanced"),
    ).toEqual([]);
  });
});

describe("book health — each play's numbers", () => {
  it("reads committed from the guards' own math: a sold put's collateral against the wheel's budget", () => {
    const portfolio = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2, marketValue: -200 })],
    });
    const wheel = aSubscription("sauron", "CRWV-WHEEL", { capitalAllocated: 10_000 });
    const placed = intent("CRWV-WHEEL", { symbol: "CRWV", side: "sell" });
    const records = [
      pass("2026-10-16T17:00:00Z", {
        rawIntents: [placed],
        outcomes: [{ intent: placed, action: "placed" }],
        refusals: [{ intent: placed, reason: "put-not-secured" }],
      }),
    ];
    const [play] = read({ portfolio, subscriptions: [wheel], records }).plays ?? [];
    expect(play).toMatchObject({
      allocation: 10_000,
      committed: 8_000,
      idle: 2_000,
      openPositions: 1,
    });
    expect(play?.refusalsLastSession).toEqual({ "put-not-secured": 1 });
    expect(play?.oldestOpenSessions).toBeUndefined();
  });

  it("dates the last entry from a placed opening order or a lot the play still holds", () => {
    const s1 = aSubscription("sauron", "S1-NVDA");
    const tagged = [lot("NVDA", 10, "2026-10-13T15:00:00.000Z", { playbookId: "S1-NVDA" })];
    const [play] =
      read({ portfolio: nvdaBook(8_200, 1_800), subscriptions: [s1], openLots: tagged }).plays ??
      [];
    expect(play).toMatchObject({ lastEntryAt: "2026-10-13T15:00:00.000Z", oldestOpenSessions: 3 });
    expect(play?.allocation).toBeUndefined();
    expect(play?.idle).toBeUndefined();
  });

  it("leaves committed undefined for a play whose basket is unknown", () => {
    const store = aSubscription("eric", "ERIC-OWN-PLAY", { capitalAllocated: 1_000 });
    expect(read({ subscriptions: [store] }).plays?.[0]?.committed).toBeUndefined();
  });
});

describe("book health — who sees what (#885)", () => {
  const looping = { records: refusedPasses(6), portfolio: nvdaBook(5_500, 4_500) };

  it("names the play in the owner's words", () => {
    const view = read(looping);
    expect(only(view, "looping")[0]?.words).toMatch(/^The pre-print run-up on NVDA asked/);
    expect(playName("CRWV-WHEEL", true)).toBe("the wheel on CRWV");
    expect(capitalized(playName("NOT-A-PAIR", true))).toBe("NOT-A-PAIR");
  });

  it("strips every playbook id, strategy name and play row for anyone else", () => {
    const view = read({ ...looping, ownerView: false });
    expect(view.plays).toBeUndefined();
    expect(view.findings.every((f) => f.playbookId === undefined)).toBe(true);
    const text = JSON.stringify(view.findings);
    for (const name of ["S1-NVDA", "run-up", "pre-print"]) expect(text).not.toContain(name);
    expect(only(view, "looping")[0]?.words).toMatch(/^One of this account's playbooks asked/);
  });

  it("counts the same findings either way, gates listed first", () => {
    const owner = read(looping);
    expect(read({ ...looping, ownerView: false }).counts).toEqual(owner.counts);
    expect(owner.findings[0]?.level).toBe("gate");
    expect(owner.counts).toEqual(bookHealthCounts(owner.findings));
    expect(owner.counts).toMatchObject({ gate: 1, byDetector: { concentrated: 1, looping: 1 } });
  });
});

describe("book health — open dates and session counts", () => {
  const nvda = aPosition({ symbol: "NVDA", quantity: 10 });

  it("dates a position by its earliest lot only when the lots add up to it", () => {
    const lots = [lot("NVDA", 4, "2026-10-14T15:00:00Z"), lot("NVDA", 6, "2026-10-12T15:00:00Z")];
    expect(openedOn(nvda, lots)).toBe("2026-10-12T15:00:00Z");
    expect(openedOn(nvda, lots.slice(1))).toBeUndefined();
    expect(openedOn(nvda, undefined)).toBeUndefined();
  });

  it("counts the sessions since the day it opened, 0 on that day", () => {
    expect(sessionsHeld("2026-10-16T14:00:00Z", AS_OF)).toBe(0);
    expect(sessionsHeld("2026-10-09T14:00:00Z", AS_OF)).toBe(5);
  });
});
