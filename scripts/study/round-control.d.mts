// Type surface for round-control.mjs (`allowJs` is off) — the pure parts a spec imports.

export function sourceProblems(args: {
  source: { control?: unknown; profileSha?: string } | null;
  frozen: { sha256?: string } | null;
  profileSha: string;
}): string[];
export function cardMismatches(
  source: Record<string, string> | null | undefined,
  now: Record<string, string> | null | undefined,
): string[];
export function factDrift(
  tasks: { id: string; fact: string; world: string; answer: unknown }[],
  facts: { id: string; world?: string; answer: unknown }[],
): { task: string; fact: string; drift: "missing" | "answer" }[];
export function expectIds(list: unknown[]): string[];
