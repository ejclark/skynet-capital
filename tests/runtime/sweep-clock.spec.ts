import { armSweepClock } from "../../src/runtime/sweep-clock.js";

// The clock the bots' and the dashboard's option lifecycle sweeps share (#4650). Its guard against
// overlapping passes is specced through each caller; this is the part neither caller can see.

describe("armSweepClock", () => {
  it("reports a pass that rejects by its error's name alone, and keeps ticking", async () => {
    rstest.useFakeTimers();
    const warnings: string[] = [];
    const warn = rstest.spyOn(process, "emitWarning").mockImplementation((warning) => {
      warnings.push(String(warning));
    });
    try {
      let passes = 0;
      const timer = armSweepClock(() => {
        passes += 1;
        return Promise.reject(new TypeError("GET https://paper.example/v2?token=SECRET"));
      }, 1_000);
      await rstest.advanceTimersByTimeAsync(1_000);
      expect(passes).toBe(2);
      expect(warnings).toEqual([
        "[sweep] a pass failed: TypeError",
        "[sweep] a pass failed: TypeError",
      ]);
      clearInterval(timer);
    } finally {
      warn.mockRestore();
      rstest.useRealTimers();
    }
  });
});
