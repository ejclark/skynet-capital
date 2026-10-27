export interface Band {
  middle: number;
  upper: number;
  lower: number;
}

export interface TouchEvent {
  date: string;
  side: "upper" | "lower";
  forwardPct: number;
}

export function bands(
  closes: readonly number[],
  period?: number,
  multiplier?: number,
): (Band | undefined)[];
export function touchEvents(
  bars: readonly { date: string; close: number }[],
  opts: { horizon: number; benchmark?: readonly { date: string; close: number }[] },
): TouchEvent[];
export function summarize(
  events: readonly TouchEvent[],
  side?: "upper" | "lower",
): { n: number; meanPct: number };
