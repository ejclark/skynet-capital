import { describe, expect, it } from "@rstest/core";
import { DoctrineEffectivenessBreaker } from "../../src/autonomous/doctrine-effectiveness-breaker.js";

// Copied verbatim from SafetyController's own contract (safety.spec.ts) — same shape, same
// guarantees, a different signal (win-rate underperformance instead of equity drawdown).

describe("DoctrineEffectivenessBreaker", () => {
  it("starts unblocked", () => {
    const b = new DoctrineEffectivenessBreaker();
    expect(b.blockedReason()).toBeNull();
  });

  it("reports no win rate below minSampleSize — not yet a verdict", () => {
    const b = new DoctrineEffectivenessBreaker({ minSampleSize: 5 });
    for (let i = 0; i < 4; i++) b.recordOutcome(false);
    expect(b.currentWinRate()).toBeNull();
    expect(b.blockedReason()).toBeNull();
  });

  it("trips once the window's win rate falls maxUnderperformancePct below baseline", () => {
    const b = new DoctrineEffectivenessBreaker({
      minSampleSize: 10,
      windowSize: 10,
      baselineWinRate: 0.5,
      maxUnderperformancePct: 0.15,
    });
    // 2 wins / 10 = 20% — 30pp below a 50% baseline, past the 15pp margin.
    for (let i = 0; i < 8; i++) b.recordOutcome(false);
    for (let i = 0; i < 2; i++) b.recordOutcome(true);
    expect(b.blockedReason()).toBe("underperformance");
  });

  it("does not trip while within the underperformance margin", () => {
    const b = new DoctrineEffectivenessBreaker({
      minSampleSize: 10,
      windowSize: 10,
      baselineWinRate: 0.5,
      maxUnderperformancePct: 0.15,
    });
    // 4 wins / 10 = 40% — only 10pp below baseline, inside the 15pp margin.
    for (let i = 0; i < 6; i++) b.recordOutcome(false);
    for (let i = 0; i < 4; i++) b.recordOutcome(true);
    expect(b.blockedReason()).toBeNull();
  });

  it("is idempotent — first reason wins, further outcomes never overwrite it", () => {
    const b = new DoctrineEffectivenessBreaker({ minSampleSize: 3, windowSize: 3 });
    for (let i = 0; i < 3; i++) b.recordOutcome(false);
    expect(b.blockedReason()).toBe("underperformance");
    b.recordOutcome(true);
    b.recordOutcome(true);
    expect(b.blockedReason()).toBe("underperformance"); // still tripped — never silently re-arms
  });

  it("only clears on an explicit reset(), which also clears the outcome window", () => {
    const b = new DoctrineEffectivenessBreaker({ minSampleSize: 3, windowSize: 3 });
    for (let i = 0; i < 3; i++) b.recordOutcome(false);
    expect(b.blockedReason()).toBe("underperformance");
    b.reset();
    expect(b.blockedReason()).toBeNull();
    expect(b.currentWinRate()).toBeNull();
  });

  it("currentWinRate() only judges the most recent windowSize outcomes", () => {
    // A fresh breaker, never tripped, just to isolate the sliding-window behavior itself.
    const b = new DoctrineEffectivenessBreaker({ minSampleSize: 5, windowSize: 5 });
    for (let i = 0; i < 5; i++) b.recordOutcome(false);
    expect(b.currentWinRate()).toBe(0);
    for (let i = 0; i < 5; i++) b.recordOutcome(true); // slides the old losses out of the window
    expect(b.currentWinRate()).toBe(1);
  });
});
