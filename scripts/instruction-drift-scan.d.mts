// Type surface for scripts/instruction-drift-scan.mjs (see scripts/moneypenny/index.d.mts for why
// scripts/ ships hand-written declarations instead of `allowJs`).

export interface DriftStamp {
  commit: string;
  date: string;
  run: "full" | "incremental";
}

export interface DriftItem {
  label: string;
  files: string[];
  branch: string;
  /** A skill chunk without its SKILL.md: that SKILL.md, read alongside; not one of the item's files. */
  context?: string[];
}

/** Read the stamp file's text: `stamp` when usable, `problem` naming why not. */
export function parseStamp(text: string): { stamp?: DriftStamp; problem?: string };

/** Is a run owed? `changed` counts in-scope files changed since the stamp. */
export function dueVerdict(input: {
  changed: number;
  daysSince: number | null;
  release?: boolean;
}): {
  due: boolean;
  reason: "release" | "changed" | "fresh" | "unchanged";
};

/** Split instruction files into the ones a rewrite may touch and the do-not-edit ones, with why. */
export function splitReadOnly(paths: string[]): {
  editable: string[];
  readOnly: { path: string; why: string }[];
};

/** Group changed instruction files into grind items, each with the branch its chain pushes to. */
export function groupItems(paths: string[], at7: string): DriftItem[];

/** Split items into grind's and the platter's by envelope.json's protected rules. */
export function splitProtected(
  items: DriftItem[],
  protectedRules: { pattern: string; why?: string }[],
): { items: DriftItem[]; protectedItems: (DriftItem & { pattern: string })[] };
