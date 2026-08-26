import type { UnusualFlowFlag, UnusualFlowScan } from "../../src/options/unusual-flow.js";
import {
  flowCoverage,
  latestFlowScan,
  orderedScans,
  quietStreak,
  repeatFlags,
} from "../../src/options/unusual-flow-metrics.js";

const flag = (occSymbol: string, over: Partial<UnusualFlowFlag> = {}): UnusualFlowFlag => ({
  occSymbol,
  expiration: "2026-09-18",
  strike: 200,
  type: "call",
  volume: 1_000,
  openInterest: 250,
  reason: "volume-over-open-interest",
  ratio: 4,
  ...over,
});

const scan = (
  underlying: string,
  at: string,
  flags: UnusualFlowFlag[] = [],
  census: Partial<UnusualFlowScan> = {},
): UnusualFlowScan => ({
  at,
  underlying,
  thresholds: { minRatio: 2, minVolume: 250 },
  contractsScanned: 100,
  contractsJudged: 90,
  indeterminate: 10,
  flags,
  ...census,
});

const DAY1 = "2026-08-24T18:00:00.000Z";
const DAY2 = "2026-08-25T18:00:00.000Z";
const DAY3 = "2026-08-26T18:00:00.000Z";

describe("orderedScans", () => {
  it("sorts oldest-first regardless of input order", () => {
    const sorted = orderedScans([scan("NVDA", DAY3), scan("NVDA", DAY1), scan("NVDA", DAY2)]);
    expect(sorted.map((s) => s.at)).toEqual([DAY1, DAY2, DAY3]);
  });

  it("does not mutate the input", () => {
    const input = [scan("NVDA", DAY3), scan("NVDA", DAY1)];
    orderedScans(input);
    expect(input[0]?.at).toBe(DAY3);
  });
});

describe("latestFlowScan", () => {
  it("returns the newest scan, optionally scoped to one underlying", () => {
    const scans = [scan("NVDA", DAY1), scan("AMD", DAY3), scan("NVDA", DAY2)];
    expect(latestFlowScan(scans)?.underlying).toBe("AMD");
    expect(latestFlowScan(scans, "NVDA")?.at).toBe(DAY2);
  });

  it("is undefined with no history — never a fabricated empty scan", () => {
    expect(latestFlowScan([])).toBeUndefined();
    expect(latestFlowScan([scan("NVDA", DAY1)], "TSLA")).toBeUndefined();
  });
});

describe("flowCoverage", () => {
  it("totals the census across scans and reports the judged share", () => {
    const coverage = flowCoverage([scan("NVDA", DAY1), scan("NVDA", DAY2)]);
    expect(coverage).toEqual({
      scans: 2,
      contractsScanned: 200,
      contractsJudged: 180,
      indeterminate: 20,
      judgedShare: 0.9,
    });
  });

  it("leaves the share ABSENT when nothing was scanned — not a false 100%", () => {
    const coverage = flowCoverage([]);
    expect(coverage.judgedShare).toBeUndefined();
    expect(coverage).toMatchObject({ scans: 0, contractsScanned: 0, indeterminate: 0 });
  });

  it("surfaces a blind feed as poor coverage rather than a clean sheet", () => {
    const blind = scan("NVDA", DAY1, [], { contractsJudged: 0, indeterminate: 100 });
    expect(flowCoverage([blind]).judgedShare).toBe(0);
  });
});

describe("repeatFlags", () => {
  it("keeps only contracts flagged in at least the requested number of scans", () => {
    const scans = [
      scan("NVDA", DAY1, [flag("REPEAT"), flag("ONCE")]),
      scan("NVDA", DAY2, [flag("REPEAT")]),
    ];
    expect(repeatFlags(scans).map((r) => r.occSymbol)).toEqual(["REPEAT"]);
    expect(
      repeatFlags(scans, 1)
        .map((r) => r.occSymbol)
        .sort(),
    ).toEqual(["ONCE", "REPEAT"]);
  });

  it("tracks the peak numbers and the most recent flagging scan", () => {
    const scans = [
      scan("NVDA", DAY1, [flag("REPEAT", { volume: 1_000, ratio: 4 })]),
      scan("NVDA", DAY2, [flag("REPEAT", { volume: 8_000, ratio: 2.5 })]),
    ];
    const [repeat] = repeatFlags(scans);
    expect(repeat).toMatchObject({
      occSymbol: "REPEAT",
      underlying: "NVDA",
      scans: 2,
      lastFlagged: DAY2,
      peakVolume: 8_000,
      peakRatio: 4,
    });
  });

  it("leaves peakRatio ABSENT when every flag was a no-open-interest one", () => {
    const noOi = { reason: "no-open-interest" as const, openInterest: 0 };
    const scans = [
      scan("NVDA", DAY1, [flag("NEW", { ...noOi, ratio: undefined })]),
      scan("NVDA", DAY2, [flag("NEW", { ...noOi, ratio: undefined })]),
    ];
    expect(repeatFlags(scans)[0]?.peakRatio).toBeUndefined();
    expect(repeatFlags(scans)[0]?.scans).toBe(2);
  });

  it("ranks the most-repeated contract first", () => {
    const scans = [
      scan("NVDA", DAY1, [flag("A"), flag("B")]),
      scan("NVDA", DAY2, [flag("A"), flag("B")]),
      scan("NVDA", DAY3, [flag("A")]),
    ];
    expect(repeatFlags(scans).map((r) => r.occSymbol)).toEqual(["A", "B"]);
  });

  it("is empty when nothing ever flagged", () => {
    expect(repeatFlags([scan("NVDA", DAY1), scan("NVDA", DAY2)])).toEqual([]);
  });
});

describe("quietStreak", () => {
  it("counts consecutive most-recent scans that flagged nothing", () => {
    const scans = [scan("NVDA", DAY1, [flag("A")]), scan("NVDA", DAY2), scan("NVDA", DAY3)];
    expect(quietStreak(scans, "NVDA")).toBe(2);
  });

  it("is 0 when the latest scan did flag something", () => {
    expect(quietStreak([scan("NVDA", DAY1), scan("NVDA", DAY2, [flag("A")])], "NVDA")).toBe(0);
  });

  it("is UNDEFINED for a never-scanned underlying — a different fact from 'quiet'", () => {
    expect(quietStreak([scan("NVDA", DAY1)], "TSLA")).toBeUndefined();
    expect(quietStreak([], "NVDA")).toBeUndefined();
  });

  it("ignores other underlyings' scans", () => {
    const scans = [scan("NVDA", DAY1), scan("AMD", DAY2, [flag("A")]), scan("NVDA", DAY3)];
    expect(quietStreak(scans, "NVDA")).toBe(2);
  });
});
