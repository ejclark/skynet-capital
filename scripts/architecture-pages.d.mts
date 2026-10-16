// Type surface for architecture-pages.mjs — same arrangement as code-lines.d.mts: the scripts/ tree
// is plain ESM with `allowJs` off, so a spec that imports from it needs this rather than a
// repo-wide loosening.

/** A hand-kept page: one component's anatomy, cited to the code by `path:line`. */
export interface HandKeptPage {
  readonly file: string;
  readonly title: string;
  readonly covers: string;
  readonly roots: readonly string[];
}

export const HAND_KEPT_PAGES: readonly HandKeptPage[];

/** Every page the storybook consists of, as { "<file>.md": content }. */
export function renderPages(source: {
  maps: unknown;
  verdicts: unknown;
  parity: unknown;
}): Record<string, string>;

export function readSource(dir?: string): { maps: unknown; verdicts: unknown; parity: unknown };
