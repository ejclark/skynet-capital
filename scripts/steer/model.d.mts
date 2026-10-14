// Type surface for scripts/steer/model.mjs (scripts/ is plain ESM with `allowJs` off; see
// scripts/moneypenny/index.d.mts). Only what a spec imports is declared.
import type { NeedsYouRow } from "../moneypenny/assignments.mjs";

export type Kind = "design" | "fork" | "approve";
export interface Picture {
  src: string;
  alt: string;
  size: "phone" | "desk";
  local?: string | null;
  /** The pins its frame was drawn with (pins.mjs, #5143): a button sits on each badge. */
  pins?: { n: number; x: number; y: number; label: string }[];
}
export interface Option {
  key: string;
  name: string;
  delta: string;
  recommended: boolean;
  pictures?: Picture[];
  /** A problems option drawn as a row: its pin number on Today's frame, in place of pictures. */
  pin?: number;
  /** The scope's outcome ids this shape works toward (scope.mjs). */
  serves?: string[];
}
/** A round's goal and the outcomes it is drawn to meet (scope.mjs). */
export interface Scope {
  goal: string;
  outcomes: { id: string; text: string; met: boolean }[];
}
export interface Decision {
  key: string;
  kind: Kind;
  /** A round-0 question (`kind: "problems"` in the manifest): a pick chooses a problem, never a build. */
  problems?: boolean;
  /** A problems question that opens on clean frames, Claude's problems folded away (marks.mjs). */
  opening?: boolean;
  scope?: Scope;
  issue: number;
  isPr: boolean;
  title: string;
  ask: string;
  labels?: string[];
  cls?: string;
  why?: string;
  plan?: boolean;
  createdAt?: string | null;
  ageDays?: number | null;
  irreversible: boolean;
  default: string | null;
  link?: string;
  recommendation: {
    key?: string;
    label: string;
    confidence: string | null;
    wrongIf: string | null;
    saw?: string[];
  } | null;
  /** `clean`: Today's frames before pin.mjs drew on them, for a round that opens on them (marks.mjs). */
  today: { pictures: Picture[]; clean?: Picture[]; caption: string; real: boolean } | null;
  options: Option[];
  changes?: string | null;
  topic?: string | null;
  round?: number | string | null;
  q?: number;
  minutes: number;
  skip: string;
}
export interface Saved {
  pick?: string | null;
  react?: Record<string, string>;
  verdict?: string | null;
  note?: string;
  /** Pin reactions by `<option>:<phone|desk>:<n>`; a cleared one is null (#5143). */
  pins?: Record<string, string | null>;
  /** His note on a pin, keyed like `pins`; an emptied one is null. */
  pinNotes?: Record<string, string | null>;
  /** His marks by `<option>:<phone|desk>:m<unique>` (marks.mjs); a removed one is null. */
  marks?: Record<string, { x: number; y: number; at: string; beforeReveal: boolean } | null>;
  /** When he pressed "Show what Claude found" on an opening question. */
  revealAt?: string | null;
  at?: string;
  [k: string]: unknown;
}
/** The REST rows `gather()` read: an issue (a PR GitHub lists as one) or a pull request. */
type Row = {
  number: number;
  title?: string;
  labels?: unknown[];
  created_at?: string;
  pull_request?: unknown;
  head?: unknown;
};

export const SECTIONS: string[];
export const BUDGET_MINUTES: { am: number; pm: number };
export const TAP_GAP_CAP_MS: number;
export const MINUTES: Record<Kind, number>;
export function safeKey(raw: unknown): string;
export function roundPath(id: string): string;
export function recordPath(id: string, section: string, key: string | number): string;
export function activeMinutes(taps?: number[], capMs?: number): number;
export function isIrreversible(input?: { isPr?: boolean; text?: string }): boolean;
export function estimateMinutes(d: { kind: Kind; options?: unknown[] }): number;
export function skipText(d: Partial<Decision>): string;
export function decisionsFrom(input: {
  needsYou?: NeedsYouRow[];
  issues?: Row[];
  prs?: Row[];
  blocks?: Record<number, number[]>;
  design?: Record<number, Partial<Decision>[]>;
  now: string | number;
}): Decision[];
/** A decision held back for want of a picture: named on the page, never asked, rolled over. */
export interface NeedsPictures {
  key: string;
  issue: number;
  title: string;
  kind: Kind;
  minutes: number;
}
export function hasPictures(d: Partial<Decision>): boolean;
export function splitByPictures(decisions: Decision[]): {
  pictured: Decision[];
  needsPictures: NeedsPictures[];
};
export function fitBudget(
  decisions: Decision[],
  minutes: number,
): {
  shown: Decision[];
  deferred: { key: string; issue: number; title: string; minutes: number }[];
  used: number;
  minutes: number;
};
export function roundRecords(
  records: Record<string, unknown>,
  id: string,
): {
  meta: { openedAt?: string; doneAt?: string | null; taps?: number[]; shown?: string[] } | null;
  decisions: Record<string, Saved>;
  queue: Record<string, Saved>;
  reel: Record<string, Saved>;
};
export function steerMarker(id: string, key: string | number): string;
export function parseSteerMarker(
  body?: string | null,
): { round: string; key: string; note: string | null } | null;
/** Given the decision, only a reaction on a pin it shows counts (#5143). */
export function isAnswered(rec: Saved | null | undefined, d?: Partial<Decision>): boolean;
