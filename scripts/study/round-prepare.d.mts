// Type surface for round-prepare.mjs (`allowJs` is off) — only what a spec imports.

/** The tree hash of a checkout's harness, exactly as pin.mjs records an overlay's. */
export function harnessTree(root: string): string;

/** Did a census operate what it listed (≥ 80% of the controls it did not skip)? */
export function censusReach(controls: { status: string }[]): {
  ok: boolean;
  operated: number;
  eligible: number;
  why: string;
};
