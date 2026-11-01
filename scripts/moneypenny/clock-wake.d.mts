// Type surface for clock-wake.mjs — same arrangement as clock-watch.d.mts.

export const QUIET_HOURS: number;
export const EVENTS_RUNS_PATH: string;

export function hoursSinceNewestRun(
  runs: readonly { created_at?: string }[] | null | undefined,
  nowMs: number,
): number | null;

/** The dial as the wake reads it: the position, and the per-lane numbers it carries. */
export interface WakeDial {
  position: string;
  caps?: Record<string, number>;
}

export function readDue(
  mode: Pick<WakeDial, "caps"> | null | undefined,
  opts?: { run?: (cmd: string, args: string[]) => string; rest?: (path: string) => unknown },
): unknown[];

export function clockWake(opts?: {
  now?: number;
  readRuns?: () => readonly { created_at?: string }[] | null | undefined;
  readDial?: () => WakeDial;
  peek?: () => { number?: number } | null;
  due?: (mode: WakeDial) => unknown[];
  dispatch?: () => void;
  log?: (line: string) => void;
}): { dispatched: boolean; quiet: number | null; admissible: boolean | null; line: string };
