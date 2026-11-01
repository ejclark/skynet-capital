// Type surface for dial-spend.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a spec that
// imports from it needs this.

export interface DialEvent {
  readonly event: string;
  readonly label?: string;
  readonly at: string;
}

export interface DialWindow {
  readonly position: string;
  readonly from: number;
  readonly to: number;
}

export interface Leg {
  readonly lane: string;
  readonly at: string;
  readonly usd: number | null;
  readonly run: number;
}

export interface SpendRow {
  readonly position: string;
  readonly lane: string;
  readonly hours: number;
  readonly legs: number;
  readonly runs: number;
  readonly usd: number;
  readonly unpriced: number;
  readonly usdPerHour: number;
  readonly legsPerHour: number;
  readonly legsPerRun: number;
  readonly usdPerLeg: number | null;
  readonly unreadRuns: number;
}

export type Exec = (cmd: string, args: readonly string[]) => string | Buffer;

export function dialWindows(
  events: readonly DialEvent[],
  opts: { since?: number; until: number },
): DialWindow[];
export function legFromLog(fileName: string, text: string, run: number): Leg | null;
export function summarize(
  legs: readonly Leg[],
  windows: readonly DialWindow[],
  opts?: { unread?: ReadonlyArray<{ at: string }> },
): SpendRow[];
export function renderTable(rows: readonly SpendRow[]): string;
export function readLegs(opts: {
  since: number;
  until: number;
  cacheDir: string;
  maxCalls: number;
  exec?: Exec;
  unzip?: (zip: string | Buffer) => ReadonlyArray<{ name: string; text: string }>;
  now?: number;
}): { legs: Leg[]; unread: Array<{ at: string }>; calls: number };
