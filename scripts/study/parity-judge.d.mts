// Type surface for parity-judge.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface Measured {
  box: { left: number; top: number; width: number; height: number };
  viewport: { width: number; height: number };
  hitInside: boolean;
}

export interface FrameResult {
  miss: string | null;
  notes: string[];
}

export interface ParityRow {
  world: string;
  surface: { label: string; struck?: string; only?: string };
  phone?: FrameResult;
  desktop?: FrameResult;
}

export function judgeVisible(m: Measured): { ok: true } | { ok: false; why: string };
export function interceptorOf(log: string): string | undefined;
export function parityTable(rows: ParityRow[]): string;
export function worstExit(rows: ParityRow[], unstubbed?: string[]): 0 | 1;
