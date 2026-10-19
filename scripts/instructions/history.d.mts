// Type surface for scripts/instructions/history.mjs (see scripts/moneypenny/index.d.mts for why
// scripts/ ships hand-written declarations instead of `allowJs`).

export interface HistoryNote {
  /** 1-indexed line in the file. */
  line: number;
  /** A PR/issue number told as a story, or a phrase measured against an unseen version. */
  kind: "pr-narrative" | "migration";
  detail: string;
}

/** True when a repo-relative POSIX path is a rule file this note reads. */
export function isRuleFile(path: string): boolean;

/** Notes for one rule file's text. */
export function historyNotes(text: string): HistoryNote[];
