import { existsSync, readFileSync } from "node:fs";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10, SEEDED_CONVICTIONS } from "../../src/playbooks/conviction-seeds.js";
import {
  CONVICTIONS,
  ConvictionStore,
  lookupConviction,
  statedCheck,
} from "../../src/playbooks/conviction-store.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import { aSubscription } from "../support/builders.js";

/** #5482 slice 2 — the store of conviction records, its seed, and which check a subscription is
 *  held to once it may point at one. */

// Without the AI-dip view's narrowings, which name its own two pairs (slice 4 has its own spec).
const { narrowings: _narrowings, ...AI_DIP_PLAIN } = AI_DIP_2026_10;

const record = (over: Partial<Conviction> = {}): Conviction => ({
  ...AI_DIP_PLAIN,
  id: "other-view",
  steers: ["CRWV-WHEEL"],
  ...over,
});

describe("ConvictionStore", () => {
  it("serves what passes the rules, by id and by the pairs it steers", () => {
    const store = new ConvictionStore([record()]);
    expect(store.all().map((c) => c.id)).toEqual(["other-view"]);
    expect(store.get("other-view")?.owner).toBe("Eric");
    expect(store.get("nope")).toBeUndefined();
    expect(store.steering("CRWV-WHEEL").map((c) => c.id)).toEqual(["other-view"]);
    expect(store.steering("CRWV-LONG-CALL")).toEqual([]);
    expect(store.refused).toEqual([]);
  });

  it("refuses a record that breaks a rule, says why, and never serves it", () => {
    const store = new ConvictionStore([record({ claims: [] })]);
    expect(store.get("other-view")).toBeUndefined();
    expect(store.steering("CRWV-WHEEL")).toEqual([]);
    expect(store.refused).toEqual([
      { id: "other-view", problems: ["a conviction needs at least one claim"] },
    ]);
  });

  it("keeps the first record stated under an id and refuses the second", () => {
    const later = record({ checkOn: "2027-06-30" });
    const store = new ConvictionStore([record(), later]);
    expect(store.get("other-view")?.checkOn).toBe("2027-01-29");
    expect(store.refused).toEqual([
      { id: "other-view", problems: ["a conviction with this id is already stored"] },
    ]);
  });
});

describe("the seeded AI-dip conviction", () => {
  it("is stored, none refused", () => {
    expect(CONVICTIONS.refused).toEqual([]);
    expect(CONVICTIONS.all()).toEqual(SEEDED_CONVICTIONS);
    expect(lookupConviction("ai-dip-2026-10")).toBe(AI_DIP_2026_10);
  });

  it("steers CRWV-WHEEL and CRWV-LONG-CALL and cites S1-NVDA without steering it", () => {
    expect(AI_DIP_2026_10.steers).toEqual(["CRWV-WHEEL", "CRWV-LONG-CALL"]);
    expect(CONVICTIONS.steering("S1-NVDA")).toEqual([]);
    expect(AI_DIP_2026_10.claims.some((c) => c.statement.includes("S1-NVDA"))).toBe(true);
  });

  it("is checked on the date both pair rows already carry, so a pointer moves no check day", () => {
    for (const id of AI_DIP_2026_10.steers) {
      expect(findPair(id)?.evidence.checkOn).toBe(AI_DIP_2026_10.checkOn);
    }
  });

  it("carries the call sheet's claims: 14 rows (four added 2026-10-18), 3 forward tests, 6 untestable", () => {
    const { claims } = AI_DIP_2026_10;
    expect(claims).toHaveLength(14);
    // Claim 9 moved to forward-only on 2026-10-18 (#5718): its implied move was never measured here.
    expect(claims.filter((c) => c.bucket === "forward")).toHaveLength(3);
    expect(claims.filter((c) => c.bucket === "untestable")).toHaveLength(6);
    expect(claims.filter((c) => c.bucket === "untestable").every((c) => !c.scoreBy)).toBe(true);
  });

  it("accepts assignment, as its owner said on 2026-10-18", () => {
    expect(AI_DIP_2026_10.acceptsAssignment).toBe(true);
  });

  it("names a call sheet that exists and names this record's owner and check date", () => {
    expect(AI_DIP_2026_10.source).toBeDefined();
    const path = AI_DIP_2026_10.source ?? "";
    expect(existsSync(path)).toBe(true);
    const doc = readFileSync(path, "utf8");
    expect(doc).toContain(`**Owner** | ${AI_DIP_2026_10.owner}`);
    expect(doc).toContain(`**${AI_DIP_2026_10.checkOn}**`);
  });
});

describe("statedCheck", () => {
  const lookup = (id: string) => (id === "other-view" ? record() : undefined);
  const own = { reason: "my call", checkOn: "2027-04-30" };

  it("is the subscription's own conviction when it points at no record", () => {
    expect(statedCheck(aSubscription("sauron", "CRWV-WHEEL", { conviction: own }), lookup)).toEqual(
      { checkOn: "2027-04-30", from: "subscription" },
    );
    expect(statedCheck(aSubscription("sauron", "CRWV-WHEEL"), lookup)).toEqual({});
  });

  it("is the record's date when the record steers the pair, over the subscription's own", () => {
    const sub = aSubscription("sauron", "CRWV-WHEEL", {
      conviction: own,
      convictionId: "other-view",
    });
    expect(statedCheck(sub, lookup)).toEqual({
      checkOn: "2027-01-29",
      from: "record",
      convictionId: "other-view",
    });
  });

  it("falls back to its own conviction, said, when the pointer names no stored record", () => {
    const sub = aSubscription("sauron", "CRWV-WHEEL", { conviction: own, convictionId: "gone" });
    expect(statedCheck(sub, lookup)).toEqual({
      checkOn: "2027-04-30",
      from: "subscription",
      note: 'CRWV-WHEEL points at conviction "gone", which is not stored',
    });
  });

  it("falls back, said, when the record does not steer the pair", () => {
    const sub = aSubscription("sauron", "CRWV-LONG-CALL", { convictionId: "other-view" });
    expect(statedCheck(sub, lookup)).toEqual({
      note: 'CRWV-LONG-CALL points at conviction "other-view", which does not steer it',
    });
  });

  it("reads the build's store by default", () => {
    const sub = aSubscription("sauron", "CRWV-LONG-CALL", { convictionId: "ai-dip-2026-10" });
    expect(statedCheck(sub).from).toBe("record");
  });
});
