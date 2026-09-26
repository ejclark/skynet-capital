import type { TowerStats } from "./loop.js";

/**
 * THE ON-SCREEN PROBE (plan #3807 slice 3a-2) — `?probe=1` puts a small readout in the frame's
 * corner so the real number can be read on a real machine (Eric's, not SwiftShader's): draws per
 * second, the CPU cost of each draw (p50 / p95, ms), and the draw count. Hidden unless asked for.
 * Pure: the scene owns the element and the timer; this owns the arithmetic and the words.
 */

/** Whether the query asks for the readout. */
export function wantsProbe(search: string): boolean {
  try {
    return new URLSearchParams(search).get("probe") === "1";
  } catch {
    return false;
  }
}

/**
 * Draws per second between readings: `sample(frames, now)` returns the rate since the previous
 * sample (0 before there is a previous one, or when no time has passed).
 */
export function fpsMeter(): { sample(frames: number, now: number): number } {
  let prev: { frames: number; now: number } | undefined;
  return {
    sample(frames, now) {
      const last = prev;
      prev = { frames, now };
      if (!last || now <= last.now) return 0;
      return ((frames - last.frames) * 1000) / (now - last.now);
    },
  };
}

/** The readout's two lines: rate and count, then the submit cost. */
export function probeLines(fps: number, s: TowerStats): readonly [string, string] {
  const ms = (x: number): string => x.toFixed(1);
  return [
    `${Math.round(fps)} fps · ${s.frames} frames`,
    `submit ${ms(s.submitMs.p50)} / ${ms(s.submitMs.p95)} ms (p50 / p95)`,
  ];
}
