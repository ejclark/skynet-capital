import {
  addDays,
  callDelta,
  callValue,
  EXIT_DTE,
  entryExpiry,
  eventMove,
  eventsAhead,
  expiryFloor,
  heldBack,
  impliedVol,
  longCallTrade,
  NEVER,
  type RecoveryEntry,
  recoveryBand,
  strikeForCallDelta,
  TARGET_DELTA,
  thirdFriday,
} from "../../scripts/research/long-call-fence-math.mjs";
import { putValue } from "../../scripts/research/wheel-cap-math.mjs";

/**
 * The long-call fence study's pure half (#6598 slice 2, Study B). The failures these exist to
 * prevent: a crush the model runs backwards (an event term that outlives its print), an expiry floor
 * that quietly buys a longer call than the playbook's window allows (a widening), a trade scored
 * before its exit is on the tape, and a recovery band that drops the episodes that never came back.
 */

const STATE = { bucket: 3, wide: true, vix: "calm" };

/** `n` consecutive calendar days from `from`: a tape whose session count is easy to read. */
const daysFrom = (from: string, n: number): string[] =>
  Array.from({ length: n }, (_, k) => addDays(from, k));

describe("callValue and the strike picker", () => {
  it("meets put-call parity at zero rate with Study A's put", () => {
    expect(callValue(100, 90, 0.4, 0.5) - putValue(100, 90, 0.4, 0.5)).toBeCloseTo(10, 8);
  });

  it("is the intrinsic value when no time or vol is left", () => {
    expect(callValue(120, 100, 0.3, 0)).toBe(20);
    expect(callValue(90, 100, 0, 0.5)).toBe(0);
  });

  it("finds the strike at the standard mode's 0.60 delta, in the money", () => {
    const k = strikeForCallDelta(100, 0.7, 170 / 365);
    expect(callDelta(100, k, 0.7, 170 / 365)).toBeCloseTo(TARGET_DELTA, 6);
    expect(k).toBeLessThan(100);
  });
});

describe("entryExpiry", () => {
  it("takes the latest third Friday 120 to 200 days out, as the live picker does", () => {
    expect(thirdFriday(2027, 2)).toBe("2027-03-19");
    expect(thirdFriday(2027, 3)).toBe("2027-04-16");
    // 2027-05-21 is 203 days from 2026-10-30, one past the window.
    expect(entryExpiry("2026-10-30")).toEqual({
      expiry: "2027-04-16",
      days: 168,
      blocked: false,
    });
  });

  it("reads a thin chain's latest listed month, the March cycle or January", () => {
    expect(entryExpiry("2026-10-30", { scheme: "quarterly" })?.expiry).toBe("2027-03-19");
  });

  it("never reaches past 200 days for a floor: it leaves nothing to buy instead", () => {
    expect(entryExpiry("2026-10-30", { floor: "2027-03-18" })?.blocked).toBe(false);
    const fenced = entryExpiry("2026-10-30", { floor: "2027-05-01" });
    expect(fenced).toMatchObject({ expiry: "2027-04-16", blocked: true });
  });
});

describe("the modeled crush", () => {
  it("adds each print ahead as its own variance over the option's life", () => {
    expect(impliedVol({ baseVol: 0.5, years: 0.5, events: 0, eventMove: 0.1 })).toBe(0.5);
    expect(impliedVol({ baseVol: 0.5, years: 0.5, events: 1, eventMove: 0.1 })).toBeCloseTo(
      Math.sqrt(0.27),
      12,
    );
  });

  it("prices the same call lower once the print is behind it at an unchanged close", () => {
    const prints = ["2026-02-10", "2026-05-12", "2026-08-11"];
    const expiry = "2027-01-15";
    const vol = (date: string) =>
      impliedVol({
        baseVol: 0.6,
        years: 150 / 365,
        events: eventsAhead(prints, date, expiry),
        eventMove: 0.15,
      });
    expect(callValue(100, 95, vol("2026-08-11"), 150 / 365)).toBeGreaterThan(
      callValue(100, 95, vol("2026-08-12"), 150 / 365),
    );
  });

  it("counts a print filed that day as ahead, then projects the cadence past the last one", () => {
    const prints = ["2026-02-10", "2026-05-12", "2026-08-11"];
    // 08-11 itself, then 11-10 and 2027-02-09 projected; 2027-05-11 lands after the expiry.
    expect(eventsAhead(prints, "2026-08-11", "2027-03-19")).toBe(3);
    expect(eventsAhead(prints, "2026-08-12", "2027-03-19")).toBe(2);
  });

  it("prices a print at the root mean square of reactions already landed, never the day's own", () => {
    const moves = [
      { reactedOn: "2025-01-02", move: 0.1 },
      { reactedOn: "2025-04-02", move: 0.2 },
      { reactedOn: "2025-07-02", move: 0.4 },
    ];
    expect(eventMove(moves, "2025-04-02")).toBeNull();
    expect(eventMove(moves, "2025-04-03")).toBeCloseTo(Math.sqrt((0.01 + 0.04) / 2), 12);
  });
});

describe("heldBack", () => {
  it("is the guard's blackout at quiet 1 and the fence's quiet period at 6", () => {
    expect([100, 101, 102].map((t) => heldBack([100], t, 1))).toEqual([true, true, false]);
    expect([106, 107].map((t) => heldBack([100], t, 6))).toEqual([true, false]);
    expect(heldBack([100], 99, 6)).toBe(false);
  });
});

describe("longCallTrade", () => {
  const dates = daysFrom("2026-01-02", 200);
  const expiry = addDays("2026-01-02", 170);
  const volAt = () => 0.5;

  it("sells at double the first close it is worth that", () => {
    const closes = dates.map((_, k) => (k === 0 ? 100 : 200));
    const r = longCallTrade({ closes, dates, t: 0, expiry, volAt });
    expect(r).toMatchObject({ cause: "profit", exitAt: 1 });
    expect(r?.roi).toBeGreaterThanOrEqual(1);
  });

  it("sells with 45 days left otherwise, after slippage both ways", () => {
    const closes = dates.map(() => 100);
    const r = longCallTrade({ closes, dates, t: 0, expiry, volAt });
    expect(r).toMatchObject({ cause: "time", exitAt: 170 - EXIT_DTE });
    expect(r?.roi).toBeLessThan(0);
  });

  it("lets time win a tie, the bot's order", () => {
    const closes = dates.map((_, k) => (k < 170 - EXIT_DTE ? 100 : 300));
    expect(longCallTrade({ closes, dates, t: 0, expiry, volAt })?.cause).toBe("time");
  });

  it("scores nothing while the exit is still off the tape", () => {
    const closes = dates.slice(0, 60).map(() => 100);
    expect(longCallTrade({ closes, dates: dates.slice(0, 60), t: 0, expiry, volAt })).toBeNull();
  });
});

describe("recoveryBand", () => {
  /** `count` one-session episodes 60 calendar days apart (each its own cluster), all matured. */
  const spaced = (backs: number[], matured = "2001-01-01"): RecoveryEntry[] =>
    backs.map((backToEntry, k) => ({
      t: k * 100,
      date: addDays("2000-01-03", k * 60),
      maturedOn: matured,
      ...STATE,
      backToEntry,
    }));
  const names = (entries: RecoveryEntry[]) => new Map([["X", { sym: "X", entries }]]);

  it("keeps the episodes that never came back, so a quarter of them reads Infinity", () => {
    const six = [10, 10, 10, 10, 10, 10];
    const two = recoveryBand({
      sym: "X",
      state: STATE,
      names: names(spaced([...six, Infinity, Infinity])),
      asOf: "2026-01-01",
    });
    expect(two?.sessions).toBe(10);
    const three = recoveryBand({
      sym: "X",
      state: STATE,
      names: names(spaced([...six.slice(1), Infinity, Infinity, Infinity])),
      asOf: "2026-01-01",
    });
    expect(three?.sessions).toBe(Infinity);
  });

  it("reads no band from recoveries still open on the day", () => {
    const entries = spaced([10, 10, 10, 10, 10, 10, 10, 10], "2026-06-01");
    expect(
      recoveryBand({ sym: "X", state: STATE, names: names(entries), asOf: "2026-01-01" }),
    ).toBeNull();
  });
});

describe("expiryFloor", () => {
  const dates = daysFrom("2026-10-16", 100);

  it("puts the 45-day exit on the band's edge, counted on the tape", () => {
    // Session 72 of a calendar-day tape from 10-16 is 2026-12-27.
    expect(expiryFloor(dates, 0, 72)).toBe(addDays("2026-12-27", EXIT_DTE));
  });

  it("counts weekdays past the tape's end", () => {
    // The tape ends Saturday 2027-01-23; three weekdays on is Wednesday 01-27.
    expect(expiryFloor(dates, 0, 102)).toBe(addDays("2027-01-27", EXIT_DTE));
  });

  it("sets a floor nothing listed can meet when the band never came back", () => {
    expect(expiryFloor(dates, 0, Infinity)).toBe(NEVER);
    expect(entryExpiry("2026-10-16", { floor: NEVER })?.blocked).toBe(true);
  });
});
