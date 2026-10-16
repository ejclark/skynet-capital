import { monitorEventLoopDelay } from "node:perf_hooks";

/**
 * The production memory gauge (#4618, slice 6 of #4612). Two OOM kills ran 47 and 69 days before
 * anyone saw them because nothing in the process measured itself: 0 calls to `process.memoryUsage`
 * or an event-loop monitor anywhere in src. This logs one stdout line a minute — stdout because it
 * is the contract every host shares (Fly's log buffer today, CloudWatch on AWS), no APM product.
 *
 * RSS is the number that matters, not the heap: the Pulse OOM was native ICU memory (10k Intl
 * formatters added 272 MB of RSS and 7 MB of heap), which a heap-only reading cannot see.
 */
export const GAUGE_INTERVAL_MS = 60_000;
/** The same line the CI budget run holds (slice 5): a 512 MB machine with ~200 MB of headroom. */
export const RSS_ALARM_MB = 300;

export interface GaugeReading {
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
  externalMb: number;
  /** Event-loop delay over the last interval, ms — how long a click waited behind other work. */
  loopP50Ms: number;
  loopP99Ms: number;
  loopMaxMs: number;
  /** Highest RSS any reading has seen since boot. */
  peakRssMb: number;
  uptimeS: number;
}

export interface GaugeSeams {
  intervalMs?: number;
  log?: (line: string) => void;
  memoryUsage?: () => NodeJS.MemoryUsage;
  uptime?: () => number;
  /** Called after every reading — the unclean-restart marker keeps its "last seen" fresh here. */
  onReading?: (reading: GaugeReading) => void;
}

/** The loop monitor's sampling tick. Node records the whole interval between ticks, tick included,
 *  so an idle loop reads ~20 ms; `delayMs` subtracts it to leave only the time a click waited. */
const LOOP_RESOLUTION_MS = 20;
const mb = (bytes: number): number => Math.round(bytes / 1_048_576);
const delayMs = (nanos: number): number =>
  Number.isFinite(nanos) ? Math.max(0, Math.round(nanos / 1e6) - LOOP_RESOLUTION_MS) : 0;

/** The one-line shape, kept stable so a log search (`[gauge]`) and a later parser can rely on it. */
export function formatGaugeLine(r: GaugeReading): string {
  return (
    `[gauge] rss ${r.rssMb} MB (peak ${r.peakRssMb}) · heap ${r.heapUsedMb}/${r.heapTotalMb} MB` +
    ` · external ${r.externalMb} MB · loop p50 ${r.loopP50Ms} ms p99 ${r.loopP99Ms} ms` +
    ` max ${r.loopMaxMs} ms · up ${r.uptimeS} s`
  );
}

/** Start the gauge. Returns `read` (take a reading now, logging it) and `stop`. */
export function startProcessGauge(seams: GaugeSeams = {}): {
  read: () => GaugeReading;
  stop: () => void;
} {
  const log = seams.log ?? (() => undefined); // library code: the caller owns the console
  const memoryUsage = seams.memoryUsage ?? (() => process.memoryUsage());
  const uptime = seams.uptime ?? (() => process.uptime());
  const loop = monitorEventLoopDelay({ resolution: LOOP_RESOLUTION_MS });
  loop.enable();
  let peakRssMb = 0;
  let overLine = false;

  const read = (): GaugeReading => {
    const mem = memoryUsage();
    const rssMb = mb(mem.rss);
    peakRssMb = Math.max(peakRssMb, rssMb);
    const reading: GaugeReading = {
      rssMb,
      heapUsedMb: mb(mem.heapUsed),
      heapTotalMb: mb(mem.heapTotal),
      externalMb: mb(mem.external),
      loopP50Ms: delayMs(loop.percentile(50)),
      loopP99Ms: delayMs(loop.percentile(99)),
      loopMaxMs: delayMs(loop.max),
      peakRssMb,
      uptimeS: Math.round(uptime()),
    };
    loop.reset(); // each line reports its own minute, not a since-boot blur
    log(formatGaugeLine(reading));
    // One alarm per crossing, not one a minute while it stays high — and one all-clear back.
    if (rssMb > RSS_ALARM_MB && !overLine) {
      overLine = true;
      log(`[gauge] ALARM rss ${rssMb} MB is over the ${RSS_ALARM_MB} MB line`);
    } else if (rssMb <= RSS_ALARM_MB && overLine) {
      overLine = false;
      log(`[gauge] rss ${rssMb} MB is back under the ${RSS_ALARM_MB} MB line`);
    }
    seams.onReading?.(reading);
    return reading;
  };

  const timer = setInterval(read, seams.intervalMs ?? GAUGE_INTERVAL_MS);
  timer.unref(); // the gauge never keeps a draining process alive
  return {
    read,
    stop: () => {
      clearInterval(timer);
      loop.disable();
    },
  };
}
