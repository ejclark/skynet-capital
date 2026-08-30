// Type surface for readability.mjs — same arrangement as plan-closure-scan.d.mts/
// envelope-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so a spec that imports
// from it needs this rather than a repo-wide loosening.

/** Approximate syllable count for one English word. */
export function countSyllables(word: string): number;
/** Strip markdown syntax before measuring readability — leaves plain prose behind. */
export function stripMarkdown(text: string): string;
/** Flesch-Kincaid Grade Level on plain prose; `null` when there's too little text to measure. */
export function fleschKincaidGrade(text: string): number | null;
