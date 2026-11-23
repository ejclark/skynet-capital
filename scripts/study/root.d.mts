// Type surface for root.mjs (`allowJs` is off).

import type { LedgerRow } from "./ia-roots.mjs";

export const ROOT_DIR: string;
export function rootArgs(argv: string[]): {
  round: string;
  grade?: string;
  ia: string;
  chunk: number;
  stub?: string;
};
export function runRoot(args: {
  leads: {
    id: string;
    what: string;
    surface?: { route?: string | null; viewport?: string | null };
  }[];
  rows: LedgerRow[];
  size: number;
  call: (text: string) => Promise<unknown>;
}): Promise<{ roots: Record<string, string>; left: string[]; calls: number }>;
export function main(argv: string[]): Promise<number>;
