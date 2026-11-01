// Type surface for intents.mjs — same arrangement as conviction-proposals.d.mts (scripts/ is plain
// ESM with `allowJs` off, so a spec importing it needs this).

export const INTENTS_DIR: string;

export interface Intent {
  /** The file's name without `.md` — what a lane cites to show it read the record. */
  slug: string;
  kind: string;
  stated: string;
  until: string;
  /** The first instant after `until`, in UTC ms. */
  untilEndMs: number;
  said: string;
  outcome: string;
  check: string;
  steers: string[];
  events: string[];
  issues: number[];
  /** Weekly points held back while active, or null. */
  reserve: number | null;
  closed: boolean;
}

export function endOfDayUtc(s: string | null | undefined): number | null;
export function parseIntent(slug: string, text: string): Intent;
export const POSITION_SHAPES: [RegExp, string][];
export function publicHalfProblems(text: string): string[];
export function stateOf(intent: Intent, now?: number): "active" | "lapsed" | "closed";
export function loadIntents(dir?: string): Intent[];
export function activeIntents(intents: Intent[], now: number): Intent[];
export function forEvent(intents: Intent[], id: string, now: number): Intent[];
export function forIssue(intents: Intent[], n: number, now: number): Intent[];
export function reserveToday(intents: Intent[], now: number): number | null;
