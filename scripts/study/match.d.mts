// Type surface for match.mjs (`allowJs` is off; same arrangement as grade.d.mts).

export const MATCH_DIR: string;
export function matchArgs(argv: string[]): {
  sealed: string;
  round: string;
  expect?: string;
  stub?: string;
  chunk: number;
};
export function main(argv: string[]): Promise<number>;
