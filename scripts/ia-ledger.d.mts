// Type surface for ia-ledger.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the
// spec that imports it needs this (the same arrangement as crawl/coverage.d.mts).

export interface LedgerScreen {
  id: string;
  name: string;
  route: string;
}

export interface LedgerRow {
  id: string;
  problem: string;
  detail: string;
  screens: LedgerScreen[];
  screensCited: number;
  plans: number[];
  state: "fixed" | "plan filed" | "ready for a plan" | "waiting";
  fixedBy?: number;
}

export interface Ledger {
  source: string;
  rows: LedgerRow[];
}

export interface RegistryScreen {
  id: string;
  name: string;
  route: string;
}

export const IA_PATH: string;
export const SCREENS_PATH: string;
export const LEDGER_JSON_PATH: string;
export const EVIDENCE_PATH: string;
export function memberRoute(route: string): string;
export function cellsOf(line: string): string[];
export function plainWords(text: string): string;
export function screensIn(cell: string, registry: RegistryScreen[]): LedgerScreen[];
export function stateOf(status: string): LedgerRow["state"];
export function plansIn(status: string): number[];
export function rowOf(cells: string[], registry: RegistryScreen[]): LedgerRow;
export function buildLedger(iaText: string, registry?: RegistryScreen[]): Ledger;
export function ledgerText(ledger: Ledger): string;
export function readLedgerInputs(): { ia: string; registry: RegistryScreen[] };
export function evidenceOf(
  issues: { pull_request?: unknown; labels?: (string | { name?: string })[] }[],
): { members: number; filings: number };
export function evidenceTable(
  ledger: Ledger,
  evidenceByRow: Map<string, { members: number; filings: number }>,
  asOf: string,
): string;
