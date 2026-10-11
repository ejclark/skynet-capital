// Type surface for commons.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface Finding {
  at?: string;
  screen?: string;
  kind: string;
  what: string;
  where?: string;
  principle?: string;
  to?: string;
  why?: string;
}

export const KINDS: string[];
export function commonsPaths(env?: Record<string, string | undefined>): {
  dir: string;
  log: string;
  page: string;
};
export function parseFlags(argv: string[], known: string[]): Record<string, string>;
export function makeFinding(
  flags: Record<string, string | undefined>,
  ids: string[],
  now?: Date,
): { finding?: Finding; problems: string[] };
export function readFindings(log: string): Finding[];
export function formatFinding(f: Finding): string;
export function clusters(findings: Finding[]): { kind: string; items: Finding[] }[];
export function digest(findings: Finding[]): string;
