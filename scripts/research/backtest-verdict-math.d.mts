export interface Power {
  sdPct: number;
  effectPct: number;
  zBar: number;
  zPower: number;
}

export interface Cluster {
  date: string;
  value: number;
  events: number;
}

export interface BacktestVerdict {
  outcome: "pass" | "kill" | "underpowered";
  clusters: number;
  needed: number;
  meanPct?: number;
  t?: number;
}

export function requiredClusters(power: Power): number;
export function clusterByDate(events: readonly { date: string; value: number }[]): Cluster[];
export function meanT(values: readonly number[]): { mean: number; t: number };
export function backtestVerdict(
  clusters: readonly { value: number }[],
  power: Power,
  latestEraSameSign: boolean,
): BacktestVerdict;
