export interface Bar {
  date: string;
  close: number;
}

export interface PeakAndDrawdown {
  peakDate: string;
  peak: number;
  drawdownPct: number;
}

export interface ShockDay {
  date: string;
  median: number;
  moves: Record<string, number>;
}

export function barOn<T extends Bar>(bars: T[], date: string): T | null;
export function changePct(bars: Bar[], from: string, to: string): number | null;
export function peakAndDrawdown(bars: Bar[], from: string, to: string): PeakAndDrawdown | null;
export function dailyReturns(bars: Bar[], from: string, to: string): Map<string, number>;
export function median(xs: number[]): number | null;
export function shockDays(
  returnsBySymbol: Record<string, Map<string, number>>,
  opts?: { n?: number; minNames?: number },
): ShockDay[];
