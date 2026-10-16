// Type surface for rescore.mjs (scripts/ is plain ESM with allowJs off).
export function rescoreOracle(
  oracle: Record<string, any>,
  task: Record<string, any>,
  meta: { rule: string; at: string },
): { changed: boolean; oracle: Record<string, any> };
