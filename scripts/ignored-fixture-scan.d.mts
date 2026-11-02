// Type surface for ignored-fixture-scan.mjs, so tests/arch/ignored-fixture.spec.ts can test its rules
// directly — the same arrangement envelope-scan.d.mts makes (scripts/ is plain ESM, `allowJs` off).
export const SPEC_ROOTS: string[];
/** Every path-shaped literal in one file's source, with its 1-based line. */
export function pathLiterals(source: string): Array<{ literal: string; line: number }>;
/** The repo-relative path a literal in `file` names, when it has a fixture's shape. */
export function resolutions(file: string, literal: string): string[];
/** Every spec-tree literal that names an ignored, untracked path, with the rule that ignores it. */
export function scan(opts?: { cwd?: string }): Array<{
  file: string;
  line: number;
  literal: string;
  path: string;
  rule: string;
}>;
