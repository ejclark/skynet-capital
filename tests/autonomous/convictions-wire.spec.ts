import {
  buildConvictionsWire,
  CONVICTIONS_WIRE_KIND,
  MAX_STEERED_ACCOUNTS,
  MAX_WIRED_CONVICTIONS,
  parseConvictionsWire,
} from "../../src/autonomous/convictions-wire.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * #5482 slice 6c — the members' handed-over views on the controls poll: whole or not at all, each
 * record with the accounts it may steer, and shape only (the bots' store judges the rules).
 */

const onTheWire = (value: unknown): unknown => JSON.parse(JSON.stringify(value));
const record = { conviction: aMemberConviction(), accounts: ["futurist"] };

describe("the convictions wire", () => {
  it("round-trips a set: the records and the accounts each may steer", () => {
    const wire = buildConvictionsWire([record], 1_760_000_000_000);
    expect(wire.kind).toBe(CONVICTIONS_WIRE_KIND);
    expect(parseConvictionsWire(onTheWire(wire))).toEqual(wire);
  });

  it("reads an empty set as none, which is not the same as not reported", () => {
    expect(parseConvictionsWire(onTheWire(buildConvictionsWire([], 5)))?.records).toEqual([]);
    expect(parseConvictionsWire(undefined)).toBeUndefined();
  });

  it("refuses the whole set when any one record is off, never a partial one", () => {
    const good = onTheWire(record);
    const bad = [
      { conviction: aMemberConviction(), accounts: [] },
      { conviction: aMemberConviction() },
      { conviction: aMemberConviction(), accounts: [42] },
      { conviction: { ...aMemberConviction(), claims: "many" }, accounts: ["futurist"] },
      {
        conviction: aMemberConviction(),
        accounts: Array.from({ length: MAX_STEERED_ACCOUNTS + 1 }, (_, i) => `bot-${i}`),
      },
    ];
    for (const item of bad) {
      const wire = { kind: CONVICTIONS_WIRE_KIND, at: 5, records: [good, onTheWire(item)] };
      expect(parseConvictionsWire(wire)).toBeUndefined();
    }
  });

  it("refuses another kind, a bad stamp, and a set past its bound", () => {
    const wire = onTheWire(buildConvictionsWire([record], 5)) as Record<string, unknown>;
    expect(parseConvictionsWire({ ...wire, kind: "convictions.v2" })).toBeUndefined();
    expect(parseConvictionsWire({ ...wire, at: 0 })).toBeUndefined();
    expect(parseConvictionsWire({ ...wire, at: "5" })).toBeUndefined();
    const many = Array.from({ length: MAX_WIRED_CONVICTIONS + 1 }, () => onTheWire(record));
    expect(parseConvictionsWire({ ...wire, records: many })).toBeUndefined();
  });

  it("never reads a study, check or score a record carries: those come from the research ledgers", () => {
    const claim = { ...aMemberConviction().claims[0], score: { result: "pass" }, study: {} };
    const wire = onTheWire(
      buildConvictionsWire(
        [{ ...record, conviction: aMemberConviction({ claims: [claim] as never }) }],
        5,
      ),
    );
    const parsed = parseConvictionsWire(wire);
    expect(parsed?.records[0]?.conviction.claims[0]).toEqual(aMemberConviction().claims[0]);
  });
});
