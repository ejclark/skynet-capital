import {
  AUTHORED_PLAYS_KIND,
  buildAuthoredPlaysWire,
  MAX_PROMOTED_PLAYS,
  parseAuthoredPlaysWire,
} from "../../src/autonomous/authored-plays-wire.js";
import { PROMOTION_BAR, promotionVerdict } from "../../src/autonomous/authored-promotion.js";
import type { ShadowReportEntry } from "../../src/autonomous/authored-shadow-wire.js";
import type { AuthoredPlayRecord } from "../../src/playbooks/authored-play-draft.js";
import { aSpec } from "../support/authored-shadow.js";

/**
 * WHAT A PASSING SHADOW TEST MEANS (#5457 slice 3): S ≥ 10 sessions, R ≥ 1 closed would-be round
 * trip, Z = 0 guard refusals, and no P/L minimum — judged on the report alone.
 */

const entry = (over: Partial<ShadowReportEntry> = {}): ShadowReportEntry => ({
  id: "U-futurist-amd-run-up",
  since: "2026-10-16T22:00:00.000Z",
  state: "watching",
  window: "long",
  sessions: 10,
  tradeCount: 2,
  roundTrips: 1,
  realized: 0,
  refused: 0,
  recent: [],
  ...over,
});

describe("promotionVerdict", () => {
  it("the bar is 10 sessions, 1 round trip, 0 refusals", () => {
    expect(PROMOTION_BAR).toEqual({ sessions: 10, roundTrips: 1, refusals: 0 });
  });

  it("passes exactly at the edge of all three", () => {
    const verdict = promotionVerdict(entry());
    expect(verdict.passes).toBe(true);
    expect(verdict).not.toHaveProperty("blocker");
    expect(verdict.checks.every((c) => c.met)).toBe(true);
  });

  it("fails one session short, saying how many more", () => {
    const verdict = promotionVerdict(entry({ sessions: 9 }));
    expect(verdict.passes).toBe(false);
    expect(verdict.blocker).toBe("1 more session to watch before it can trade.");
    expect(verdict.checks.find((c) => c.id === "sessions")).toMatchObject({
      met: false,
      progress: "9 of 10 sessions watched",
    });
  });

  it("fails with no closed round trip, however long it watched or how many it bought", () => {
    const verdict = promotionVerdict(entry({ sessions: 40, tradeCount: 1, roundTrips: 0 }));
    expect(verdict.passes).toBe(false);
    expect(verdict.blocker).toContain("hasn't bought and sold yet");
  });

  it("fails on a single guard refusal, even with everything else met", () => {
    const verdict = promotionVerdict(entry({ refused: 1, roundTrips: 5, sessions: 60 }));
    expect(verdict.passes).toBe(false);
    expect(verdict.blocker).toBe(
      "A guard refused it 1 time, so the live play would not have traded as written.",
    );
    expect(promotionVerdict(entry({ refused: 3 })).blocker).toContain("3 times");
  });

  it("has no P/L minimum: a losing test passes as readily as a winning one", () => {
    expect(promotionVerdict(entry({ realized: -250 })).passes).toBe(true);
    expect(promotionVerdict(entry({ realized: 0 })).passes).toBe(true);
  });

  it("no report is zero sessions, never a pass; an invalid play never passes", () => {
    expect(promotionVerdict(undefined).passes).toBe(false);
    expect(promotionVerdict(undefined).blocker).toBe(
      "10 more sessions to watch before it can trade.",
    );
    expect(promotionVerdict(entry({ state: "invalid" })).passes).toBe(false);
    expect(promotionVerdict(entry({ state: "invalid" })).blocker).toContain("no longer clears");
  });

  it("names the first unmet check, in the order a member can act on", () => {
    expect(promotionVerdict(entry({ sessions: 2, roundTrips: 0, refused: 2 })).blocker).toContain(
      "8 more sessions",
    );
  });
});

describe("the promoted-plays wire", () => {
  const record = (status: AuthoredPlayRecord["status"], slug: string): AuthoredPlayRecord => ({
    id: `U-futurist-${slug}`,
    name: slug,
    status,
    spec: aSpec({ slug }),
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
  });

  it("carries only promoted specs: a draft or a shadow test never rides it", () => {
    const wire = buildAuthoredPlaysWire(
      { ada: [record("draft", "a"), record("shadow", "b"), record("promoted", "c")] },
      5,
    );
    expect(wire.kind).toBe(AUTHORED_PLAYS_KIND);
    expect(wire.plays.map((s) => s.slug)).toEqual(["c"]);
  });

  it("round-trips, and parses anything short of a clean whole set to nothing", () => {
    const wire = buildAuthoredPlaysWire({ ada: [record("promoted", "c")] }, 5);
    expect(parseAuthoredPlaysWire(JSON.parse(JSON.stringify(wire)))).toEqual(wire);
    expect(parseAuthoredPlaysWire(undefined)).toBeUndefined();
    expect(parseAuthoredPlaysWire({ ...wire, kind: "authored-plays.v2" })).toBeUndefined();
    expect(parseAuthoredPlaysWire({ ...wire, at: "now" })).toBeUndefined();
    expect(parseAuthoredPlaysWire({ ...wire, plays: [{ slug: "x" }] })).toBeUndefined();
    expect(
      parseAuthoredPlaysWire({
        ...wire,
        plays: Array.from({ length: MAX_PROMOTED_PLAYS + 1 }, () => wire.plays[0]),
      }),
    ).toBeUndefined();
  });
});
