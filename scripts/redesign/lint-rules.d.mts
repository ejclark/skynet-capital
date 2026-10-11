// Type surface for lint-rules.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface LintEnv {
  pictureSize: (path: string) => number | null;
  sourcesFor: (question: Record<string, unknown>, manifest: Record<string, unknown>) => string;
  ui: { text: string; lower: string };
}

export function splitQuotes(text: string): { quotes: string[]; rest: string };
export function quoteFound(quote: string, source: string): boolean;
export function titleRuns(text: string): string[];
export function copyProblems(where: string, text: string, ui: LintEnv["ui"]): string[];
export function lintDesign(raw: unknown, env: LintEnv): string[];
