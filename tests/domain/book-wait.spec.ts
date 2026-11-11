import {
  bookWaitFrom,
  bookWaitState,
  cleanWaitReason,
  MAX_WAIT_REASON,
} from "../../src/domain/book-wait.js";

/**
 * #4608 slice 1: a wait on the whole book is recorded only with the day it reopens, and from that
 * day on it reads as retired — the question is open again (`docs/members/eric.md` j4 s2).
 */

const TODAY = "2026-11-10";
const SET_AT = "2026-11-10T15:00:00.000Z";

describe("bookWaitFrom", () => {
  it("records a wait with its reopen day and the member's reason", () => {
    expect(
      bookWaitFrom(
        { reopensOn: "2026-11-20", reason: "  CPI first,\n then decide " },
        TODAY,
        SET_AT,
      ),
    ).toEqual({
      ok: true,
      wait: { reopensOn: "2026-11-20", reason: "CPI first, then decide", setAt: SET_AT },
    });
  });

  it("refuses a wait with no reopen day — there is no open-ended wait", () => {
    for (const reopensOn of [undefined, "", "soon", "2026-11-2", "2026-02-31", 20261120]) {
      expect(bookWaitFrom({ reopensOn, reason: "why" }, TODAY, SET_AT)).toEqual({
        ok: false,
        error: "no-reopen-day",
      });
    }
  });

  it("refuses a reopen day that is today or already past", () => {
    for (const reopensOn of [TODAY, "2026-11-09", "2025-01-01"]) {
      expect(bookWaitFrom({ reopensOn, reason: "why" }, TODAY, SET_AT)).toEqual({
        ok: false,
        error: "reopen-day-not-ahead",
      });
    }
  });

  it("takes tomorrow and a year out, and refuses a day past that", () => {
    expect(bookWaitFrom({ reopensOn: "2026-11-11", reason: "why" }, TODAY, SET_AT).ok).toBe(true);
    expect(bookWaitFrom({ reopensOn: "2027-11-11", reason: "why" }, TODAY, SET_AT).ok).toBe(true);
    expect(bookWaitFrom({ reopensOn: "2027-11-12", reason: "why" }, TODAY, SET_AT)).toEqual({
      ok: false,
      error: "reopen-day-too-far",
    });
  });

  it("refuses a wait with no reason, or one longer than a line", () => {
    for (const reason of [undefined, "", "   ", 42, "x".repeat(MAX_WAIT_REASON + 1)]) {
      expect(bookWaitFrom({ reopensOn: "2026-11-20", reason }, TODAY, SET_AT)).toEqual({
        ok: false,
        error: "no-reason",
      });
    }
  });
});

describe("bookWaitState", () => {
  const wait = { reopensOn: "2026-11-20", reason: "CPI first", setAt: SET_AT };

  it("is standing before the reopen day, with the days left", () => {
    expect(bookWaitState(wait, TODAY)).toEqual({ state: "standing", wait, daysLeft: 10 });
    expect(bookWaitState(wait, "2026-11-19")).toEqual({ state: "standing", wait, daysLeft: 1 });
  });

  it("retires on the reopen day and after — the question is open again", () => {
    expect(bookWaitState(wait, "2026-11-20")).toEqual({ state: "reopened", wait });
    expect(bookWaitState(wait, "2026-12-01")).toEqual({ state: "reopened", wait });
  });
});

describe("the input guards", () => {
  it("reads only real calendar days", () => {
    expect(bookWaitFrom({ reopensOn: "2028-02-29", reason: "why" }, "2028-02-01", SET_AT).ok).toBe(
      true,
    );
    for (const reopensOn of ["2027-02-29", "2026-11-20T00:00:00Z"]) {
      expect(bookWaitFrom({ reopensOn, reason: "why" }, TODAY, SET_AT)).toMatchObject({
        error: "no-reopen-day",
      });
    }
  });

  it("strips control, zero-width and direction-override characters from a reason", () => {
    expect(cleanWaitReason("CPI\u202e first\u0000\u200b ok")).toBe("CPI first ok");
    expect(cleanWaitReason("\u202e\u200b")).toBeUndefined();
  });

  it("folds a reason onto one trimmed line", () => {
    expect(cleanWaitReason("a\n\tb  c ")).toBe("a b c");
    expect(cleanWaitReason("x".repeat(MAX_WAIT_REASON))).toHaveLength(MAX_WAIT_REASON);
  });
});
