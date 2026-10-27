import {
  formatGaugeLine,
  RSS_ALARM_MB,
  startProcessGauge,
} from "../../src/server/process-gauge.js";

// The production memory gauge (#4618): one line a minute, RSS first because the Pulse OOM was
// native memory the heap never saw, and one alarm per crossing of the 300 MB line.
const MB = 1_048_576;
const usage = (rssMb: number): NodeJS.MemoryUsage => ({
  rss: rssMb * MB,
  heapUsed: 90 * MB,
  heapTotal: 120 * MB,
  external: 12 * MB,
  arrayBuffers: 1 * MB,
});

function gauge(rss: number[]) {
  const logs: string[] = [];
  const readings: number[] = [];
  let i = 0;
  const g = startProcessGauge({
    intervalMs: 3_600_000, // the timer never fires inside a spec; `read` drives it
    log: (line) => logs.push(line),
    memoryUsage: () => usage(rss[Math.min(i++, rss.length - 1)] ?? 0),
    uptime: () => 61.4,
    onReading: (r) => readings.push(r.rssMb),
  });
  return { g, logs, readings };
}

describe("the process gauge", () => {
  it("logs RSS, heap, external memory, event-loop delay and uptime on one line", () => {
    const { g, logs } = gauge([180]);
    const r = g.read();
    g.stop();
    expect(r).toMatchObject({ rssMb: 180, heapUsedMb: 90, heapTotalMb: 120, externalMb: 12 });
    expect(logs[0]).toMatch(
      /^\[gauge\] rss 180 MB \(peak 180\) · heap 90\/120 MB · external 12 MB · loop p50 \d+ ms p99 \d+ ms max \d+ ms · up 61 s$/,
    );
  });

  it("keeps the peak RSS since boot", () => {
    const { g } = gauge([200, 260, 210]);
    g.read();
    g.read();
    const r = g.read();
    g.stop();
    expect(r.peakRssMb).toBe(260);
  });

  it("raises one alarm when RSS crosses the line, and one all-clear when it falls back", () => {
    const over = RSS_ALARM_MB + 20;
    const { g, logs } = gauge([250, over, over + 5, 240]);
    for (let n = 0; n < 4; n++) g.read();
    g.stop();
    const alarms = logs.filter((l) => l.includes("ALARM"));
    expect(alarms).toEqual([`[gauge] ALARM rss ${over} MB is over the ${RSS_ALARM_MB} MB line`]);
    expect(logs.filter((l) => l.includes("back under"))).toHaveLength(1);
  });

  it("hands every reading to its listener — the run marker's heartbeat", () => {
    const { g, readings } = gauge([150, 160]);
    g.read();
    g.read();
    g.stop();
    expect(readings).toEqual([150, 160]);
  });

  it("formats a reading the same way every time, for a log search", () => {
    const line = formatGaugeLine({
      rssMb: 1,
      heapUsedMb: 2,
      heapTotalMb: 3,
      externalMb: 4,
      loopP50Ms: 5,
      loopP99Ms: 6,
      loopMaxMs: 7,
      peakRssMb: 8,
      uptimeS: 9,
    });
    expect(line).toBe(
      "[gauge] rss 1 MB (peak 8) · heap 2/3 MB · external 4 MB · loop p50 5 ms p99 6 ms max 7 ms · up 9 s",
    );
  });
});
