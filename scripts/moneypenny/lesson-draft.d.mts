// Type surface for lesson-draft.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a spec
// that imports from it needs this (same arrangement as burst-alarm.d.mts).

export interface DraftCapsule {
  readonly number: number;
  readonly title: string;
  readonly createdAt: string;
  readonly closedAt: string;
}
export interface DraftRun {
  readonly id: string | number;
  readonly sha: string;
  readonly createdAt: string;
  readonly url?: string;
}
export interface DraftFix {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly mergeSha: string;
  readonly specs: string[];
}
export interface DraftIntent {
  kind: "draft-lesson";
  issueNumber: number;
  title?: string;
}

export function learnedIn(ledger: string, sha: string): boolean;
export function routeLessonDraft(ctx: {
  eventName?: string;
  action?: string;
  payload?: {
    issue?: {
      number?: number;
      title?: string;
      state_reason?: string | null;
      labels?: Array<{ name?: string } | string>;
    };
  };
}): DraftIntent[];
export function runIdsFrom(
  body: string | null | undefined,
  comments?: Array<{ user?: { login?: string }; body?: string | null }>,
): string[];
export function fixingPrNumber(
  timeline: unknown[],
  closedAt: string | null | undefined,
): number | null;
export function sectionOf(body: string | null | undefined, heading: string): string;
export function jobOf(capsuleTitle: string): string;
export function draftEntry(p: {
  capsule: DraftCapsule;
  runs: DraftRun[];
  fix: DraftFix | null;
  ledger?: string;
}): { entry: string; covered: string[] } | null;
export function insertEntry(ledger: string, entry: string): string;
export function prBody(p: {
  capsule: DraftCapsule;
  fix: DraftFix | null;
  covered: string[];
}): string;
export function commentBody(p: { entry: string; reason: string }): string;
export function draftLesson(intent: DraftIntent): string;
