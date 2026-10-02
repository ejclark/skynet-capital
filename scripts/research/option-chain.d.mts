export interface Contract {
  osi: string;
  root: string;
  expiry: string;
  right: "C" | "P";
  strike: number;
  bid: number;
  ask: number;
  mid: number;
  iv: number;
  delta: number;
  openInterest: number;
  volume: number;
}

export interface Chain {
  symbol: string;
  spot: number;
  iv30: number;
  asOf: string;
  contracts: Contract[];
}

export function chainUrl(symbol: string): string;
export function parseOsi(osi: string): {
  root: string;
  expiry: string;
  right: "C" | "P";
  strike: number;
};
export function spreadPct(contract: { bid: number; ask: number }): number | null;
export function fetchChain(
  symbol: string,
  opts?: { refresh?: boolean; fetchImpl?: typeof fetch; today?: string },
): Promise<Chain>;
export function normalizeChain(raw: unknown): Chain;
export function expiriesOf(contracts: readonly Contract[]): string[];
export function atmIv(
  contracts: readonly Contract[],
  expiry: string,
  spot: number,
): { expiry: string; strike: number; iv: number | null };
export function expectedMove(
  contracts: readonly Contract[],
  expiry: string,
  spot: number,
): { strike: number; move: number } | null;
export function putAtDelta(
  contracts: readonly Contract[],
  expiry: string,
  target: number,
): Contract | null;
