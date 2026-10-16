import { simulate, triggerMoves } from "../../scripts/research/rebalance-band-math.mjs";
import {
  DEFAULT_PLAY_TARGET,
  HOUSE_PLAY_BOUNDS,
  leanedTarget,
  type PlayTargetBounds,
  type ResolvedPlayTarget,
  readPlayTarget,
  resolvePlayTarget,
  tripMoves,
} from "../../src/playbooks/play-target.js";

/**
 * #5483 slice 3, the pure half: what a play's target may be (narrow-only), and what the band says
 * about a book. The numbers are the backtest's (#5509): a 70% weight, signal at 5 points, gate at
 * 10, with 30% of the budget held back. The reading must be the drift `simulate` traded on, so a
 * history that chose the default and a bot watching it can never disagree about what drift is.
 */

const resolved = (): ResolvedPlayTarget => {
  const r = resolvePlayTarget(DEFAULT_PLAY_TARGET);
  if (!r.ok) throw new Error(r.reason);
  return r.target;
};

/** A $100k budget with $70k deployed at cost; `active` is what that is worth now. */
const book = (active: number) => ({ ceiling: 100_000, active, deployedCost: 70_000 });

describe("resolvePlayTarget: a setting may only narrow its playbook's bounds", () => {
  it("accepts the backtest's default under the house bounds", () => {
    expect(resolvePlayTarget(DEFAULT_PLAY_TARGET)).toEqual({
      ok: true,
      target: DEFAULT_PLAY_TARGET,
    });
  });

  it("fills a missing lean (10 points either side) and band (5 and 10) from the default", () => {
    expect(resolvePlayTarget({ weight: 0.7 })).toEqual({
      ok: true,
      target: { weight: 0.7, lean: { min: 0.6, max: 0.8 }, band: { signal: 0.05, gate: 0.1 } },
    });
  });

  it("clips a defaulted lean to the bounds instead of widening past them", () => {
    const r = resolvePlayTarget({ weight: 0.78 });
    expect(r.ok && r.target.lean).toEqual({ min: 0.68, max: 0.8 });
  });

  it("refuses a weight outside the bounds, whole, instead of clamping it", () => {
    for (const weight of [0.85, 0.5, 1, 0]) {
      expect(resolvePlayTarget({ weight }).ok).toBe(false);
    }
  });

  it("refuses a lean range wider than the bounds, or one that leaves the weight out", () => {
    expect(resolvePlayTarget({ weight: 0.7, lean: { min: 0.5, max: 0.8 } }).ok).toBe(false);
    expect(resolvePlayTarget({ weight: 0.7, lean: { min: 0.6, max: 0.9 } }).ok).toBe(false);
    expect(resolvePlayTarget({ weight: 0.7, lean: { min: 0.72, max: 0.78 } }).ok).toBe(false);
  });

  it("refuses a band wider than the bounds, or with its gate not above its signal", () => {
    expect(resolvePlayTarget({ weight: 0.7, band: { signal: 0.2, gate: 0.2 } }).ok).toBe(false);
    expect(resolvePlayTarget({ weight: 0.7, band: { signal: 0.05, gate: 0.25 } }).ok).toBe(false);
    expect(resolvePlayTarget({ weight: 0.7, band: { signal: 0.16, gate: 0.18 } }).ok).toBe(false);
    expect(resolvePlayTarget({ weight: 0.7, band: { signal: 0.1, gate: 0.05 } }).ok).toBe(false);
  });

  it("accepts a narrower band and lean than the defaults", () => {
    const r = resolvePlayTarget({
      weight: 0.7,
      lean: { min: 0.65, max: 0.75 },
      band: { signal: 0.03, gate: 0.06 },
    });
    expect(r.ok).toBe(true);
  });

  it("holds a playbook's own, tighter bounds: what the house allows, it may still refuse", () => {
    const tight: PlayTargetBounds = {
      weight: { min: 0.65, max: 0.75 },
      signalMax: 0.04,
      gateMax: 0.08,
    };
    expect(resolvePlayTarget({ weight: 0.78 }, tight).ok).toBe(false);
    expect(resolvePlayTarget({ weight: 0.7, band: { signal: 0.05, gate: 0.08 } }, tight).ok).toBe(
      false,
    );
    // The defaulted pieces shrink to fit, so a bare weight is still readable.
    expect(resolvePlayTarget({ weight: 0.7 }, tight)).toEqual({
      ok: true,
      target: { weight: 0.7, lean: { min: 0.65, max: 0.75 }, band: { signal: 0.04, gate: 0.08 } },
    });
  });

  it("states why, in the owner's words", () => {
    const r = resolvePlayTarget({ weight: 0.9 });
    expect(r.ok === false && r.reason).toBe("a 90% weight is outside this playbook's 60-80%");
    expect(HOUSE_PLAY_BOUNDS.weight).toEqual({ min: 0.6, max: 0.8 });
  });
});

describe("leanedTarget: the lean stays inside its range, and has no source yet", () => {
  it("is the weight with no lean", () => {
    expect(leanedTarget(resolved())).toBe(0.7);
  });

  it("shifts by the lean and stops at the ends of the range", () => {
    expect(leanedTarget(resolved(), 0.05)).toBeCloseTo(0.75, 12);
    expect(leanedTarget(resolved(), 0.5)).toBe(0.8);
    expect(leanedTarget(resolved(), -0.5)).toBe(0.6);
  });
});

describe("readPlayTarget: the cascading threshold", () => {
  it("is inside at the target, with nothing to do", () => {
    const r = readPlayTarget(resolved(), book(70_000));
    expect(r).toMatchObject({ level: "inside", direction: null, share: 0.7, holding: 30_000 });
    expect(r.drift).toBeCloseTo(0, 12);
    expect(r.wouldDo).toBe("nothing: inside its band");
  });

  it("reads a fall the way the backtest did: the share of active plus holding, not of the budget", () => {
    // A 20% fall: 56k active, 30k still held. 56/86 = 65.1% - 70% = -4.9 points: still inside.
    const r = readPlayTarget(resolved(), book(56_000));
    expect(r.share).toBeCloseTo(56 / 86, 12);
    expect(r.level).toBe("inside");
    // A 21% fall crosses the signal edge, which is what the study's "buys after a ~20% fall" says.
    expect(readPlayTarget(resolved(), book(55_300))).toMatchObject({
      level: "signal",
      direction: "under",
    });
  });

  it("agrees with the backtest's own drift on the same book", () => {
    const run = simulate([100, 70], [1, 1], { hold: 0.3, band: 0.05 });
    const trade = run.trades[0];
    const r = readPlayTarget(resolved(), { ceiling: 1, active: 0.49, deployedCost: 0.7 });
    expect(trade?.drift).toBeCloseTo(r.drift, 12);
    expect(trade?.moved).toBeCloseTo(r.moveDollars / (0.49 + 0.3), 12);
  });

  it("keeps a share exactly on an edge inside, as the backtest's strict comparison does", () => {
    // 90k / (90k + 30k) = 75%: exactly 5 points over.
    expect(readPlayTarget(resolved(), book(90_000)).level).toBe("inside");
    expect(readPlayTarget(resolved(), book(90_100)).level).toBe("signal");
    // 60% is exactly 10 under: 45k / (45k + 30k).
    expect(readPlayTarget(resolved(), book(45_000)).level).toBe("signal");
    expect(readPlayTarget(resolved(), book(44_900)).level).toBe("gate");
  });

  it("runs the signal first and the gate second, on either side", () => {
    expect(readPlayTarget(resolved(), book(95_000))).toMatchObject({
      level: "signal",
      direction: "over",
    });
    expect(readPlayTarget(resolved(), book(130_000))).toMatchObject({
      level: "gate",
      direction: "over",
    });
    expect(readPlayTarget(resolved(), book(30_000))).toMatchObject({
      level: "gate",
      direction: "under",
    });
  });

  it("names the dollars the backtest's rule would move to put the share back", () => {
    // 95k active, 30k holding: eq 125k, 70% of it is 87.5k, so 7.5k comes off.
    expect(readPlayTarget(resolved(), book(95_000)).moveDollars).toBeCloseTo(7_500, 6);
    // 55k active: eq 85k, 70% is 59.5k, so 4.5k goes in.
    expect(readPlayTarget(resolved(), book(55_000)).moveDollars).toBeCloseTo(4_500, 6);
  });

  it("says a signal lets capital flow and a gate never holds an exit", () => {
    expect(readPlayTarget(resolved(), book(95_000)).wouldDo).toContain("capital keeps flowing");
    expect(readPlayTarget(resolved(), book(55_000)).wouldDo).toContain("capital keeps flowing");
    for (const active of [130_000, 30_000]) {
      const gate = readPlayTarget(resolved(), book(active)).wouldDo;
      expect(gate).toContain("exits are never held back");
      expect(gate).not.toContain("capital keeps flowing");
    }
  });

  it("holds the budget's undeployed part as holding, never below zero", () => {
    // Cost above the ceiling (a budget lowered under a held position): nothing is held back.
    const r = readPlayTarget(resolved(), { ceiling: 50_000, active: 80_000, deployedCost: 70_000 });
    expect(r).toMatchObject({ holding: 0, share: 1, level: "gate", direction: "over" });
  });

  it("reads a book with nothing in it as no share, not NaN", () => {
    const r = readPlayTarget(resolved(), { ceiling: 0, active: 0, deployedCost: 0 });
    expect(r.share).toBe(0);
    expect(Number.isNaN(r.drift)).toBe(false);
  });

  it("reads against the leaned target when a lean is given", () => {
    const r = readPlayTarget(resolved(), book(65_000), 0.1);
    expect(r.target).toBeCloseTo(0.8, 12);
    expect(r).toMatchObject({ level: "gate", direction: "under" });
  });
});

describe("tripMoves: what the points mean as a price move", () => {
  it("is the backtest's translation", () => {
    const { signal, gate } = tripMoves(resolved());
    expect(signal.fall).toBeCloseTo(triggerMoves(0.3, 0.05).fall, 12);
    expect(signal.rise).toBeCloseTo(triggerMoves(0.3, 0.05).rise, 12);
    expect(gate.fall).toBeCloseTo(triggerMoves(0.3, 0.1).fall, 12);
    expect(signal.fall).toBeCloseTo(-0.204, 3);
  });
});
